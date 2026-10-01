'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import { bomLineCost } from '@/lib/styles';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  StatRow,
  ToggleGroup,
  fmt,
  fmtQty,
  money,
  one,
  tableCsv,
  todayISO,
  fmtDate,
  type Col,
} from '@/components/ReportKit';

type StyleRow = {
  id: string;
  style_no: string;
  name: string;
  category: string | null;
  status: 'active' | 'sample' | 'discontinued';
  labor_cost_per_unit: number;
  overhead_cost_per_unit: number;
  selling_price: number;
};

type BomLine = {
  id: string;
  style_id: string;
  item_id: string | null;
  material_name: string;
  uom: string;
  consumption_qty: number;
  wastage_pct: number;
  unit_cost: number;
  sort_order: number;
  items: { unit_cost: number | null; code: string } | { unit_cost: number | null; code: string }[] | null;
};

type Summary = {
  id: string;
  styleNo: string;
  name: string;
  category: string;
  status: StyleRow['status'];
  materials: number;
  unlinked: number;
  material: number;
  currentMaterial: number;
  labor: number;
  overhead: number;
  cost: number;
  price: number;
  margin: number;
  marginPct: number | null;
};

type DetailRow = {
  id: string;
  style: string;
  material: string;
  code: string;
  uom: string;
  qty: number;
  wastage: number;
  unitCost: number;
  currentCost: number | null;
  lineCost: number;
  linked: boolean;
};

export default function BomCostReport() {
  const today = todayISO();
  const [styles, setStyles] = useState<StyleRow[]>([]);
  const [lines, setLines] = useState<BomLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [status, setStatus] = useState<'all' | StyleRow['status']>('active');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchAll<StyleRow>((from, to) =>
        supabase
          .from('styles')
          .select('id, style_no, name, category, status, labor_cost_per_unit, overhead_cost_per_unit, selling_price')
          .order('style_no')
          .range(from, to)
      ),
      fetchAll<BomLine>((from, to) =>
        supabase
          .from('style_bom_lines')
          .select('id, style_id, item_id, material_name, uom, consumption_qty, wastage_pct, unit_cost, sort_order, items(unit_cost, code)')
          .order('sort_order')
          .order('id')
          .range(from, to)
      ),
    ])
      .then(([s, l]) => {
        if (cancelled) return;
        setStyles(s);
        setLines(l);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setStyles([]);
        setLines([]);
        setError(e?.message ?? 'Failed to load styles');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const shownStyles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return styles.filter((s) => (status === 'all' || s.status === status) && (!q || s.name.toLowerCase().includes(q) || s.style_no.toLowerCase().includes(q)));
  }, [styles, status, search]);

  const summary: Summary[] = useMemo(
    () =>
      shownStyles.map((s) => {
        const ls = lines.filter((l) => l.style_id === s.id);
        const material = ls.reduce((sum, l) => sum + bomLineCost({ consumption_qty: Number(l.consumption_qty), wastage_pct: Number(l.wastage_pct), unit_cost: Number(l.unit_cost) }), 0);
        // cost using today's stock average cost for linked materials (falls back to the BOM's planned cost)
        const currentMaterial = ls.reduce((sum, l) => {
          const live = one(l.items)?.unit_cost;
          const unit = l.item_id && live !== null && live !== undefined && Number(live) > 0 ? Number(live) : Number(l.unit_cost);
          return sum + bomLineCost({ consumption_qty: Number(l.consumption_qty), wastage_pct: Number(l.wastage_pct), unit_cost: unit });
        }, 0);
        const labor = Number(s.labor_cost_per_unit);
        const overhead = Number(s.overhead_cost_per_unit);
        const cost = material + labor + overhead;
        const price = Number(s.selling_price);
        return {
          id: s.id,
          styleNo: s.style_no,
          name: s.name,
          category: s.category ?? '—',
          status: s.status,
          materials: ls.length,
          unlinked: ls.filter((l) => !l.item_id).length,
          material,
          currentMaterial,
          labor,
          overhead,
          cost,
          price,
          margin: price - cost,
          marginPct: price > 0 ? ((price - cost) / price) * 100 : null,
        };
      }),
    [shownStyles, lines]
  );

  const detail: DetailRow[] = useMemo(() => {
    const byId = new Map(shownStyles.map((s) => [s.id, s]));
    return lines
      .filter((l) => byId.has(l.style_id))
      .map((l) => {
        const s = byId.get(l.style_id) as StyleRow;
        const live = one(l.items);
        const factor = Number(l.consumption_qty) * (1 + Number(l.wastage_pct) / 100);
        return {
          id: l.id,
          style: `${s.style_no} ${s.name}`,
          material: l.material_name,
          code: live?.code ?? '',
          uom: l.uom,
          qty: Number(l.consumption_qty),
          wastage: Number(l.wastage_pct),
          unitCost: Number(l.unit_cost),
          currentCost: l.item_id && live?.unit_cost ? Number(live.unit_cost) : null,
          lineCost: factor * Number(l.unit_cost),
          linked: !!l.item_id,
        };
      })
      .sort((a, b) => a.style.localeCompare(b.style));
  }, [lines, shownStyles]);

  const statusChip = (s: StyleRow['status']) => (s === 'active' ? <Chip tone="green">Active</Chip> : s === 'sample' ? <Chip tone="blue">Sample</Chip> : <Chip tone="gray">Discontinued</Chip>);

  const summaryCols: Col<Summary>[] = [
    { label: 'Style', value: (r) => r.styleNo },
    { label: 'Name', value: (r) => r.name },
    { label: 'Category', value: (r) => r.category },
    { label: 'Status', align: 'center', value: (r) => r.status, format: (r) => statusChip(r.status) },
    {
      label: 'Materials',
      align: 'right',
      value: (r) => r.materials,
      format: (r) =>
        r.materials === 0 ? <Chip tone="red">No BOM</Chip> : r.unlinked ? <span title="Lines not linked to a stock item block production"><Chip tone="amber">{r.materials} · {r.unlinked} unlinked</Chip></span> : r.materials,
    },
    money<Summary>('Material', (r) => r.material, { sum: false }),
    money<Summary>('Labour', (r) => r.labor, { sum: false }),
    money<Summary>('Overhead', (r) => r.overhead, { sum: false }),
    money<Summary>('Std cost / unit', (r) => r.cost, { sum: false, format: (r) => <b>{fmt(r.cost)}</b> }),
    money<Summary>('Material at today’s cost', (r) => r.currentMaterial, { sum: false }),
    money<Summary>('Selling price', (r) => r.price, { sum: false }),
    {
      label: 'Margin %',
      align: 'right',
      value: (r) => (r.marginPct === null ? '' : Number(r.marginPct.toFixed(1))),
      format: (r) => (r.marginPct === null ? '—' : <b className={r.marginPct < 0 ? 'text-rowan-red' : r.marginPct < 20 ? 'text-amber-600' : 'text-green-700'}>{r.marginPct.toFixed(1)}%</b>),
    },
  ];

  const detailCols: Col<DetailRow>[] = [
    { label: 'Style', value: (r) => r.style },
    { label: 'Material', value: (r) => r.material },
    { label: 'Stock code', value: (r) => r.code, format: (r) => (r.linked ? r.code : <Chip tone="amber">Not linked</Chip>) },
    { label: 'UoM', value: (r) => r.uom },
    { label: 'Qty / unit', align: 'right', value: (r) => r.qty, format: (r) => fmtQty(r.qty) },
    { label: 'Wastage %', align: 'right', value: (r) => r.wastage, format: (r) => `${r.wastage}%` },
    money<DetailRow>('BOM unit cost', (r) => r.unitCost, { sum: false }),
    { label: 'Stock avg cost', align: 'right', value: (r) => r.currentCost ?? '', format: (r) => (r.currentCost === null ? '—' : fmt(r.currentCost)) },
    money<DetailRow>('Line cost', (r) => r.lineCost, { format: (r) => <b>{fmt(r.lineCost)}</b> }),
  ];

  const noBom = summary.filter((s) => s.materials === 0).length;
  const withUnlinked = summary.filter((s) => s.unlinked > 0).length;
  const avgMargin = (() => {
    const m = summary.filter((s) => s.marginPct !== null && s.materials > 0);
    return m.length ? m.reduce((a, s) => a + (s.marginPct as number), 0) / m.length : null;
  })();

  return (
    <ReportFrame
      title="BOM Cost Report"
      printTitle={`BOM Cost Report — ${view === 'summary' ? 'by style' : 'material lines'}`}
      periodText={`As of ${fmtDate(today)}`}
      loading={loading}
      error={error}
      maxWidth="max-w-7xl"
      controls={
        <>
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { value: 'summary', label: 'By style' },
              { value: 'detail', label: 'Material lines' },
            ]}
          />
          <Field label="Style status">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
              <option value="active">Active</option>
              <option value="sample">Sample</option>
              <option value="discontinued">Discontinued</option>
              <option value="all">All</option>
            </select>
          </Field>
          <Field label="Style">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-40" />
          </Field>
        </>
      }
      getCsv={() =>
        view === 'summary'
          ? { filename: `bom-cost-by-style-${today}.csv`, rows: tableCsv(summaryCols, summary, false) }
          : { filename: `bom-cost-lines-${today}.csv`, rows: tableCsv(detailCols, detail) }
      }
      notes={
        <>
          <p>
            Material cost = Σ (quantity per unit × (1 + wastage %) × BOM unit cost). Standard cost per unit = material + labour + overhead as set on the
            style. “Material at today’s cost” re-prices the same BOM using the current stock average cost of each linked item (the BOM’s own cost is used
            where an item isn’t linked or has no cost yet).
          </p>
          <p>Styles flagged “unlinked” have BOM lines not tied to a stock item — production runs for them will be blocked until they are linked.</p>
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Styles', value: summary.length },
          { label: 'Without a BOM', value: noBom, tone: noBom ? 'red' : 'green' },
          { label: 'With unlinked materials', value: withUnlinked, tone: withUnlinked ? 'red' : 'green' },
          { label: 'Average margin', value: avgMargin === null ? '—' : `${avgMargin.toFixed(1)}%` },
        ]}
      />
      {view === 'summary' ? (
        <DataTable cols={summaryCols} rows={summary} rowKey={(r) => r.id} showTotals={false} empty="No styles match" />
      ) : (
        <DataTable cols={detailCols} rows={detail} rowKey={(r) => r.id} empty="No BOM lines" />
      )}
    </ReportFrame>
  );
}
