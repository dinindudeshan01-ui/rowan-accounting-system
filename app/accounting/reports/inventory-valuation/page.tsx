'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  SectionHeading,
  StatRow,
  ToggleGroup,
  fmt,
  fmtQty,
  money,
  tableCsv,
  todayISO,
  fmtDate,
  type Col,
} from '@/components/ReportKit';
import { isFinishedGood, itemValue, loadStockItems, materialClass, styleCategory, type StockItem } from '@/lib/stockReport';

type GroupRow = { key: string; kind: string; group: string; items: number; units: number; value: number };
type DetailRow = { id: string; code: string; name: string; kind: string; group: string; qty: number; cost: number; value: number };
type TBRow = { account_code: string; debit: number; credit: number };

export default function InventoryValuationReport() {
  const today = todayISO();
  const [items, setItems] = useState<StockItem[]>([]);
  const [glRaw, setGlRaw] = useState<number | null>(null);
  const [glFg, setGlFg] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [kind, setKind] = useState<'all' | 'rm' | 'fg'>('all');
  const [showZero, setShowZero] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const glP = (async () => {
      const acc = await supabase.from('chart_of_accounts').select('code, system_role').in('system_role', ['inventory', 'finished_goods_inventory']);
      if (acc.error) throw new Error(acc.error.message);
      const tb = await supabase.rpc('get_trial_balance', { p_as_of: today });
      if (tb.error) throw new Error(tb.error.message);
      const rows = (tb.data ?? []) as TBRow[];
      const bal = (role: string) => {
        const codes = (acc.data ?? []).filter((a: { system_role: string }) => a.system_role === role).map((a: { code: string }) => a.code);
        if (!codes.length) return null;
        return rows.filter((r) => codes.includes(r.account_code)).reduce((s, r) => s + Number(r.debit) - Number(r.credit), 0);
      };
      return { raw: bal('inventory'), fg: bal('finished_goods_inventory') };
    })();

    Promise.allSettled([loadStockItems(), glP]).then(([it, gl]) => {
      if (cancelled) return;
      if (it.status === 'fulfilled') {
        setItems(it.value);
        setError(null);
      } else {
        setItems([]);
        setError(it.reason?.message ?? 'Failed to load stock items');
      }
      if (gl.status === 'fulfilled') {
        setGlRaw(gl.value.raw);
        setGlFg(gl.value.fg);
      } else {
        setGlRaw(null);
        setGlFg(null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  const scoped = useMemo(
    () =>
      items
        .filter((r) => showZero || Number(r.quantity_on_hand ?? 0) !== 0)
        .filter((r) => kind === 'all' || (kind === 'fg') === isFinishedGood(r)),
    [items, showZero, kind]
  );

  const detail: DetailRow[] = useMemo(
    () =>
      scoped
        .map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          kind: isFinishedGood(r) ? 'Finished good' : 'Raw material',
          group: isFinishedGood(r) ? styleCategory(r) : materialClass(r),
          qty: Number(r.quantity_on_hand ?? 0),
          cost: Number(r.unit_cost ?? 0),
          value: itemValue(r),
        }))
        .sort((a, b) => a.kind.localeCompare(b.kind) || a.group.localeCompare(b.group) || a.code.localeCompare(b.code)),
    [scoped]
  );

  const groups: GroupRow[] = useMemo(() => {
    const m = new Map<string, GroupRow>();
    for (const d of detail) {
      const key = `${d.kind}|${d.group}`;
      const e = m.get(key) ?? { key, kind: d.kind, group: d.group, items: 0, units: 0, value: 0 };
      e.items += 1;
      e.units += d.qty;
      e.value += d.value;
      m.set(key, e);
    }
    return Array.from(m.values()).sort((a, b) => a.kind.localeCompare(b.kind) || b.value - a.value);
  }, [detail]);

  const rmValue = detail.filter((d) => d.kind === 'Raw material').reduce((s, d) => s + d.value, 0);
  const fgValue = detail.filter((d) => d.kind === 'Finished good').reduce((s, d) => s + d.value, 0);
  const total = rmValue + fgValue;

  // The ledger comparison always uses ALL stock, regardless of the type / zero-stock filters above
  const rmAll = items.filter((r) => !isFinishedGood(r)).reduce((sum, r) => sum + itemValue(r), 0);
  const fgAll = items.filter((r) => isFinishedGood(r)).reduce((sum, r) => sum + itemValue(r), 0);

  const groupCols: Col<GroupRow>[] = [
    { label: 'Type', value: (r) => r.kind },
    { label: 'Group', value: (r) => r.group },
    { label: 'Items', align: 'right', value: (r) => r.items, sum: true, totalFormat: (n) => n },
    { label: 'Units on hand', align: 'right', value: (r) => r.units, sum: true, format: (r) => fmtQty(r.units), totalFormat: (n) => fmtQty(n) },
    money<GroupRow>('Value', (r) => r.value, { format: (r) => <b>{fmt(r.value)}</b> }),
    {
      label: '% of total',
      align: 'right',
      value: (r) => (total ? Number(((r.value / total) * 100).toFixed(1)) : 0),
      format: (r) => `${total ? ((r.value / total) * 100).toFixed(1) : '0.0'}%`,
    },
  ];

  const detailCols: Col<DetailRow>[] = [
    { label: 'Code', value: (r) => r.code },
    { label: 'Item', value: (r) => r.name },
    { label: 'Type', value: (r) => r.kind },
    { label: 'Group', value: (r) => r.group },
    { label: 'On hand', align: 'right', value: (r) => r.qty, format: (r) => fmtQty(r.qty) },
    money<DetailRow>('Avg unit cost', (r) => r.cost, { sum: false }),
    money<DetailRow>('Value', (r) => r.value, { format: (r) => <b>{fmt(r.value)}</b> }),
  ];

  const recon = (label: string, stock: number, gl: number | null) => {
    if (gl === null) return null;
    const diff = stock - gl;
    return (
      <tr key={label} className="border-b border-gray-100">
        <td className="p-2 font-medium text-gray-700">{label}</td>
        <td className="p-2 text-right">{fmt(stock)}</td>
        <td className="p-2 text-right">{fmt(gl)}</td>
        <td className="p-2 text-right">
          {Math.abs(diff) < 0.5 ? <Chip tone="green">Agrees</Chip> : <b className="text-rowan-red">{fmt(diff)}</b>}
        </td>
      </tr>
    );
  };

  return (
    <ReportFrame
      title="Inventory Valuation"
      printTitle={`Inventory Valuation ${view === 'summary' ? 'Summary' : 'Detail'}`}
      periodText={`As of ${fmtDate(today)} — weighted-average cost`}
      loading={loading}
      error={error}
      maxWidth="max-w-6xl"
      controls={
        <>
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { value: 'summary', label: 'Summary' },
              { value: 'detail', label: 'Detail' },
            ]}
          />
          <Field label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
              <option value="all">All stock</option>
              <option value="rm">Raw materials</option>
              <option value="fg">Finished goods</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2">
            <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />
            Include zero-stock items
          </label>
        </>
      }
      getCsv={() =>
        view === 'summary'
          ? { filename: `inventory-valuation-summary-${today}.csv`, rows: tableCsv(groupCols, groups) }
          : { filename: `inventory-valuation-detail-${today}.csv`, rows: tableCsv(detailCols, detail) }
      }
      notes={
        <>
          <p>
            Value = quantity on hand × weighted-average unit cost, as held in the stock ledger today. Finished goods are the items linked to a style (or
            marked as finished goods); everything else stocked is a raw material. Work-in-progress is not tracked separately — production moves costs
            straight into finished goods.
          </p>
          {total === 0 && items.length > 0 && (
            <p className="text-amber-700">
              Every quantity on hand is 0, so there is no value to report. Record production runs or stock adjustments to bring stock into the system.
            </p>
          )}
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Raw materials', value: fmt(rmValue) },
          { label: 'Finished goods', value: fmt(fgValue) },
          { label: 'Total stock value', value: fmt(total), tone: 'navy' },
          { label: 'Items listed', value: detail.length },
        ]}
      />

      {view === 'summary' ? (
        <DataTable cols={groupCols} rows={groups} rowKey={(r) => r.key} empty="No stock on hand" />
      ) : (
        <DataTable cols={detailCols} rows={detail} rowKey={(r) => r.id} empty="No stock on hand" />
      )}

      {(glRaw !== null || glFg !== null) && (
        <>
          <SectionHeading>Stock ledger vs general ledger</SectionHeading>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-rowan-navy text-white text-xs uppercase">
                <th className="p-2 text-left">Inventory account</th>
                <th className="p-2 text-right">Stock ledger value</th>
                <th className="p-2 text-right">GL balance</th>
                <th className="p-2 text-right">Difference</th>
              </tr>
            </thead>
            <tbody>
              {recon('Raw materials inventory', rmAll, glRaw)}
              {recon('Finished goods inventory', fgAll, glFg)}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-gray-500">
            Compares all stock in the stock ledger (ignoring the filters above) with the inventory accounts in the trial balance. A difference usually means stock was
            adjusted or opening balances were entered on one side only.
          </p>
        </>
      )}
    </ReportFrame>
  );
}
