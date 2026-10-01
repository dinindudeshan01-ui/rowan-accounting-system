'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import { bomLineCost } from '@/lib/styles';
import {
  Chip,
  DataTable,
  ReportFrame,
  SectionHeading,
  StatRow,
  fmt,
  fmtQty,
  money,
  one,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type PLRow = { account_type: string; subtype: string | null; account_code: string; account_name: string; amount: number | string };

type RunRow = {
  id: string;
  style_id: string;
  qty: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  total_cost: number;
  styles: { style_no: string; name: string; labor_cost_per_unit: number; overhead_cost_per_unit: number } | { style_no: string; name: string; labor_cost_per_unit: number; overhead_cost_per_unit: number }[] | null;
};

type Bom = { style_id: string; consumption_qty: number; wastage_pct: number; unit_cost: number };

type AbsRow = { key: string; element: string; actual: number; absorbed: number; variance: number };
type StyleVar = {
  key: string;
  style: string;
  runs: number;
  units: number;
  stdMaterial: number;
  actMaterial: number;
  stdLabor: number;
  actLabor: number;
  stdOverhead: number;
  actOverhead: number;
  stdTotal: number;
  actTotal: number;
  variance: number;
};

const money0 = (n: number) => (Math.abs(n) < 0.005 ? 0 : n);

export default function CostingVarianceReport() {
  const p = usePeriod('year');
  const [pl, setPl] = useState<PLRow[]>([]);
  const [appliedCodes, setAppliedCodes] = useState<{ labor: string[]; overhead: string[] }>({ labor: [], overhead: [] });
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [bom, setBom] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      Promise.resolve(supabase.rpc('get_pl', { p_start: p.start, p_end: p.end })),
      Promise.resolve(supabase.from('chart_of_accounts').select('code, system_role').in('system_role', ['direct_labor_applied', 'overhead_applied'])),
      fetchAll<RunRow>((from, to) =>
        supabase
          .from('production_runs')
          .select('id, style_id, qty, material_cost, labor_cost, overhead_cost, total_cost, styles(style_no, name, labor_cost_per_unit, overhead_cost_per_unit)')
          .gte('run_date', p.start)
          .lte('run_date', p.end)
          .order('run_date')
          .order('id')
          .range(from, to)
      ),
      fetchAll<Bom>((from, to) =>
        supabase.from('style_bom_lines').select('style_id, consumption_qty, wastage_pct, unit_cost').order('id').range(from, to)
      ),
    ])
      .then(([plRes, accRes, r, b]) => {
        if (cancelled) return;
        if (plRes.error) throw new Error(plRes.error.message);
        if (accRes.error) throw new Error(accRes.error.message);
        const acc = (accRes.data ?? []) as { code: string; system_role: string }[];
        setPl((plRes.data ?? []) as PLRow[]);
        setAppliedCodes({
          labor: acc.filter((a) => a.system_role === 'direct_labor_applied').map((a) => a.code),
          overhead: acc.filter((a) => a.system_role === 'overhead_applied').map((a) => a.code),
        });
        setRuns(r);
        setBom(b);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setPl([]);
        setRuns([]);
        setError(e?.message ?? 'Failed to load costing data');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [p.start, p.end]);

  // ---- 1) Absorption: what was actually spent vs what was charged into product cost ----
  const absorption: AbsRow[] = useMemo(() => {
    const expense = pl.filter((r) => r.account_type === 'expense');
    const make = (key: string, element: string, subtype: string, applied: string[]): AbsRow => {
      const group = expense.filter((r) => r.subtype === subtype);
      const absorbed = -group.filter((r) => applied.includes(r.account_code)).reduce((s, r) => s + Number(r.amount), 0);
      const actual = group.filter((r) => !applied.includes(r.account_code)).reduce((s, r) => s + Number(r.amount), 0);
      return { key, element, actual, absorbed, variance: actual - absorbed };
    };
    return [
      make('labor', 'Direct labour', 'Direct Labor', appliedCodes.labor),
      make('overhead', 'Manufacturing overhead', 'Manufacturing Overhead', appliedCodes.overhead),
    ];
  }, [pl, appliedCodes]);

  // ---- 2) Per style: current standard vs what the production runs actually cost ----
  const styleVar: StyleVar[] = useMemo(() => {
    const stdMaterialPerUnit = new Map<string, number>();
    for (const l of bom) {
      stdMaterialPerUnit.set(
        l.style_id,
        (stdMaterialPerUnit.get(l.style_id) ?? 0) +
          bomLineCost({ consumption_qty: Number(l.consumption_qty), wastage_pct: Number(l.wastage_pct), unit_cost: Number(l.unit_cost) })
      );
    }
    const m = new Map<string, StyleVar>();
    for (const r of runs) {
      const st = one(r.styles);
      const q = Number(r.qty);
      const e =
        m.get(r.style_id) ??
        ({
          key: r.style_id,
          style: st ? `${st.style_no} ${st.name}` : 'Unknown style',
          runs: 0,
          units: 0,
          stdMaterial: 0,
          actMaterial: 0,
          stdLabor: 0,
          actLabor: 0,
          stdOverhead: 0,
          actOverhead: 0,
          stdTotal: 0,
          actTotal: 0,
          variance: 0,
        } as StyleVar);
      const sm = (stdMaterialPerUnit.get(r.style_id) ?? 0) * q;
      const sl = Number(st?.labor_cost_per_unit ?? 0) * q;
      const so = Number(st?.overhead_cost_per_unit ?? 0) * q;
      e.runs += 1;
      e.units += q;
      e.stdMaterial += sm;
      e.actMaterial += Number(r.material_cost);
      e.stdLabor += sl;
      e.actLabor += Number(r.labor_cost);
      e.stdOverhead += so;
      e.actOverhead += Number(r.overhead_cost);
      e.stdTotal += sm + sl + so;
      e.actTotal += Number(r.total_cost);
      m.set(r.style_id, e);
    }
    return Array.from(m.values())
      .map((e) => ({ ...e, variance: e.actTotal - e.stdTotal }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  }, [runs, bom]);

  const absTotal = absorption.reduce((s, r) => s + r.variance, 0);
  const styleTotal = styleVar.reduce((s, r) => s + r.variance, 0);
  const units = styleVar.reduce((s, r) => s + r.units, 0);

  const flag = (v: number) =>
    Math.abs(v) < 0.5 ? <Chip tone="gray">On target</Chip> : v > 0 ? <Chip tone="red">Unfavourable</Chip> : <Chip tone="green">Favourable</Chip>;
  const varCell = (v: number) => <b className={Math.abs(v) < 0.5 ? 'text-gray-500' : v > 0 ? 'text-rowan-red' : 'text-green-700'}>{fmt(v)}</b>;

  const absCols: Col<AbsRow>[] = [
    { label: 'Cost element', value: (r) => r.element },
    money<AbsRow>('Actual spend (ledger)', (r) => r.actual),
    money<AbsRow>('Absorbed into production', (r) => r.absorbed),
    money<AbsRow>('Variance (actual − absorbed)', (r) => money0(r.variance), { format: (r) => varCell(r.variance) }),
    {
      label: 'Result',
      align: 'center',
      value: (r) => (Math.abs(r.variance) < 0.5 ? 'On target' : r.variance > 0 ? 'Under-absorbed' : 'Over-absorbed'),
      format: (r) =>
        Math.abs(r.variance) < 0.5 ? flag(0) : r.variance > 0 ? <Chip tone="red">Under-absorbed</Chip> : <Chip tone="green">Over-absorbed</Chip>,
    },
  ];

  const styleCols: Col<StyleVar>[] = [
    { label: 'Style', value: (r) => r.style },
    { label: 'Runs', align: 'right', value: (r) => r.runs, sum: true, totalFormat: (n) => n },
    { label: 'Units', align: 'right', value: (r) => r.units, sum: true, format: (r) => fmtQty(r.units), totalFormat: (n) => fmtQty(n) },
    money<StyleVar>('Standard cost', (r) => r.stdTotal),
    money<StyleVar>('Actual cost', (r) => r.actTotal),
    money<StyleVar>('Material var.', (r) => r.actMaterial - r.stdMaterial, { format: (r) => varCell(r.actMaterial - r.stdMaterial) }),
    money<StyleVar>('Labour var.', (r) => r.actLabor - r.stdLabor, { format: (r) => varCell(r.actLabor - r.stdLabor) }),
    money<StyleVar>('Overhead var.', (r) => r.actOverhead - r.stdOverhead, { format: (r) => varCell(r.actOverhead - r.stdOverhead) }),
    money<StyleVar>('Total variance', (r) => r.variance, { format: (r) => varCell(r.variance) }),
    {
      label: '%',
      align: 'right',
      value: (r) => (r.stdTotal ? Number(((r.variance / r.stdTotal) * 100).toFixed(1)) : 0),
      format: (r) => (r.stdTotal ? `${((r.variance / r.stdTotal) * 100).toFixed(1)}%` : '—'),
    },
  ];

  return (
    <ReportFrame
      title="Costing Variance"
      periodText={p.label}
      loading={loading}
      error={error}
      maxWidth="max-w-7xl"
      controls={p.controls}
      getCsv={() => ({
        filename: `costing-variance-${p.start}-to-${p.end}.csv`,
        rows: [
          ['ABSORPTION VARIANCE (ledger)'],
          ...tableCsv(absCols, absorption),
          [],
          ['STANDARD VS ACTUAL BY STYLE (production runs)'],
          ...tableCsv(styleCols, styleVar),
        ] as (string | number | null | undefined)[][],
      })}
      notes={
        <>
          <p>
            <b>Absorption variance</b> compares what labour and overhead really cost the business (all postings in the period, from the ledger) with what
            was charged into finished goods at the standard rate when production runs were posted. Under-absorbed means actual cost exceeded the amount
            absorbed — the shortfall hits profit this period.
          </p>
          <p>
            <b>Standard vs actual by style</b> compares each production run in the period with the style’s current standard: material is priced at the
            BOM’s planned cost (including wastage) versus the stock average cost actually issued; labour and overhead use the style’s per-unit rates, so
            any difference there means the style’s rates changed after the run. Positive variance = actual cost above standard (unfavourable).
          </p>
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Production runs', value: runs.length },
          { label: 'Units produced', value: fmtQty(units) },
          { label: 'Absorption variance', value: fmt(absTotal), tone: Math.abs(absTotal) < 0.5 ? 'navy' : absTotal > 0 ? 'red' : 'green' },
          { label: 'Std vs actual variance', value: fmt(styleTotal), tone: Math.abs(styleTotal) < 0.5 ? 'navy' : styleTotal > 0 ? 'red' : 'green' },
        ]}
      />

      <SectionHeading>Labour & overhead absorption</SectionHeading>
      <DataTable cols={absCols} rows={absorption} rowKey={(r) => r.key} />

      <SectionHeading>Standard vs actual cost by style</SectionHeading>
      <DataTable cols={styleCols} rows={styleVar} rowKey={(r) => r.key} empty="No production runs in this period" />
    </ReportFrame>
  );
}
