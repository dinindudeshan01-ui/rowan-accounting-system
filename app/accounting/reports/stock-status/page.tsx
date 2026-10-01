'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  StatRow,
  fmt,
  fmtDate,
  fmtQty,
  tableCsv,
  todayISO,
  type Col,
} from '@/components/ReportKit';
import { isFinishedGood, loadStockItems, type StockItem } from '@/lib/stockReport';

type Mv = { item_id: string; movement_type: 'receipt' | 'issue' | 'adjustment'; qty_change: number; movement_date: string };

type Status = 'out' | 'low' | 'ok' | 'none';
type Row = {
  id: string;
  code: string;
  name: string;
  kind: string;
  qty: number;
  reorder: number | null;
  status: Status;
  shortfall: number;
  used90: number;
  monthly: number;
  cover: number | null;
  last: string | null;
};

const USAGE_DAYS = 90;
const HISTORY_DAYS = 365;
const STATUS_ORDER: Record<Status, number> = { out: 0, low: 1, ok: 2, none: 3 };
const STATUS_LABEL: Record<Status, string> = { out: 'Out of stock', low: 'Reorder', ok: 'OK', none: 'No reorder level' };

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function StockStatusReport() {
  const today = todayISO();
  const [items, setItems] = useState<StockItem[]>([]);
  const [moves, setMoves] = useState<Mv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<'all' | 'rm' | 'fg'>('all');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const since = iso(addDays(new Date(), -HISTORY_DAYS));
    Promise.all([
      loadStockItems(),
      fetchAll<Mv>((from, to) =>
        supabase
          .from('stock_movements')
          .select('item_id, movement_type, qty_change, movement_date')
          .gte('movement_date', since)
          .order('movement_date')
          .order('id')
          .range(from, to)
      ),
    ])
      .then(([it, mv]) => {
        if (cancelled) return;
        setItems(it);
        setMoves(mv);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setItems([]);
        setMoves([]);
        setError(e?.message ?? 'Failed to load stock');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    const cutoff = iso(addDays(new Date(), -USAGE_DAYS));
    const used = new Map<string, number>();
    const last = new Map<string, string>();
    for (const m of moves) {
      if (!last.has(m.item_id) || m.movement_date > (last.get(m.item_id) as string)) last.set(m.item_id, m.movement_date);
      // "Usage" = stock leaving: materials issued to production + finished goods sold (both are 'issue'); adjustments are not usage
      if (m.movement_type === 'issue' && m.movement_date >= cutoff) used.set(m.item_id, (used.get(m.item_id) ?? 0) + Math.abs(Number(m.qty_change)));
    }
    return items.map((r) => {
      const qty = Number(r.quantity_on_hand ?? 0);
      const reorder = r.reorder_level === null ? null : Number(r.reorder_level);
      const u = used.get(r.id) ?? 0;
      const daily = u / USAGE_DAYS;
      const st: Status = qty <= 0 ? 'out' : reorder === null ? 'none' : qty <= reorder ? 'low' : 'ok';
      return {
        id: r.id,
        code: r.code,
        name: r.name,
        kind: isFinishedGood(r) ? 'Finished good' : 'Raw material',
        qty,
        reorder,
        status: st,
        shortfall: reorder !== null && qty < reorder ? reorder - qty : 0,
        used90: u,
        monthly: (u / USAGE_DAYS) * 30,
        cover: daily > 0 ? Math.min(999, qty / daily) : null,
        last: last.get(r.id) ?? null,
      };
    });
  }, [items, moves]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => kind === 'all' || (kind === 'fg') === (r.kind === 'Finished good'))
      .filter((r) => status === 'all' || r.status === status)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || (a.cover ?? 9999) - (b.cover ?? 9999) || a.code.localeCompare(b.code));
  }, [rows, kind, status, search]);

  const count = (s: Status) => rows.filter((r) => r.status === s).length;

  const statusChip = (s: Status) =>
    s === 'out' ? <Chip tone="red">Out of stock</Chip> : s === 'low' ? <Chip tone="amber">Reorder</Chip> : s === 'ok' ? <Chip tone="green">OK</Chip> : <Chip tone="gray">No level set</Chip>;

  const cols: Col<Row>[] = [
    { label: 'Code', value: (r) => r.code },
    { label: 'Item', value: (r) => r.name },
    { label: 'Type', value: (r) => r.kind },
    { label: 'On hand', align: 'right', value: (r) => r.qty, format: (r) => <b className={r.qty <= 0 ? 'text-rowan-red' : ''}>{fmtQty(r.qty)}</b> },
    { label: 'Reorder level', align: 'right', value: (r) => r.reorder ?? '', format: (r) => (r.reorder === null ? '—' : fmtQty(r.reorder)) },
    { label: 'Status', align: 'center', value: (r) => STATUS_LABEL[r.status], format: (r) => statusChip(r.status) },
    { label: 'Short by', align: 'right', value: (r) => r.shortfall, format: (r) => (r.shortfall ? fmtQty(r.shortfall) : '') },
    { label: `Used (${USAGE_DAYS}d)`, align: 'right', value: (r) => r.used90, format: (r) => (r.used90 ? fmtQty(r.used90) : '—') },
    { label: 'Avg / month', align: 'right', value: (r) => Number(r.monthly.toFixed(2)), format: (r) => (r.monthly ? fmtQty(Number(r.monthly.toFixed(1))) : '—') },
    {
      label: 'Days of cover',
      align: 'right',
      value: (r) => (r.cover === null ? '' : Math.round(r.cover)),
      format: (r) => (r.cover === null ? '—' : r.cover >= 999 ? '999+' : Math.round(r.cover)),
    },
    { label: 'Last movement', value: (r) => r.last ?? '', format: (r) => (r.last ? fmtDate(r.last) : '—') },
  ];

  return (
    <ReportFrame
      title="Stock Status by Item"
      periodText={`As of ${fmtDate(today)}`}
      loading={loading}
      error={error}
      maxWidth="max-w-7xl"
      controls={
        <>
          <Field label="Type">
            <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
              <option value="all">All stock</option>
              <option value="rm">Raw materials</option>
              <option value="fg">Finished goods</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
              <option value="all">All</option>
              <option value="out">Out of stock</option>
              <option value="low">Reorder</option>
              <option value="ok">OK</option>
              <option value="none">No reorder level</option>
            </select>
          </Field>
          <Field label="Item">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-40" />
          </Field>
        </>
      }
      getCsv={() => ({ filename: `stock-status-${today}.csv`, rows: tableCsv(cols, filtered, false) })}
      notes={
        <>
          <p>
            Used = stock that left in the last {USAGE_DAYS} days: materials issued to production plus finished goods sold on invoices (stock adjustments are
            not counted as usage). Days of cover = on hand ÷ average daily usage; a dash means there was no usage to measure.
          </p>
          <p>
            “On order” isn’t shown because purchase orders aren’t tracked in the system. Set reorder levels on each item (in the catalog) so low-stock items
            are flagged.
          </p>
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Items tracked', value: rows.length },
          { label: 'Out of stock', value: count('out'), tone: count('out') ? 'red' : 'green' },
          { label: 'At / below reorder', value: count('low'), tone: count('low') ? 'red' : 'green' },
          { label: 'Healthy', value: count('ok'), tone: 'green' },
        ]}
      />
      <DataTable cols={cols} rows={filtered} rowKey={(r) => r.id} showTotals={false} empty="No items match" />
    </ReportFrame>
  );
}
