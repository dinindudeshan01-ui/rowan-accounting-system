'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, TriangleAlert, Package, Factory, Boxes } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, btnSecondary } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  CHART_COLORS,
  PALETTE,
  ColumnChart,
  DonutChart,
  Gauge,
  HBars,
  Sparkline,
  StackedBar,
  fmtCompact,
  fmtMoney,
  type ColumnDatum,
} from '@/components/charts';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  subtotal: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  purchaser_name: string | null;
  customer_id: string | null;
};

type ItemRow = {
  id: string;
  code: string;
  name: string;
  quantity_on_hand: number | null;
  unit_cost: number | null;
  reorder_level: number | null;
  style_id: string | null;
  stock_class: string | null;
  material_classification: string | null;
  styles?: { category: string | null } | { category: string | null }[] | null;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const PAGE = 1000;
const MAX_PAGES = 60; // safety stop

/** PostgREST returns at most 1,000 rows per request — page through all of them. */
async function fetchAll<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  make: (from: number, to: number) => PromiseLike<{ data: any; error: { message: string } | null }>
): Promise<T[]> {
  const out: T[] = [];
  for (let p = 0; p < MAX_PAGES; p++) {
    const { data, error } = await make(p * PAGE, p * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Local-date ISO string (toISOString would shift the day in UTC+5:30). */
const localISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const num = (v: number | null | undefined) => Number(v ?? 0);
const lkr = (n: number) => `LKR ${fmtMoney(n)}`;

function daysBetween(fromISO: string, to: Date): number {
  const a = new Date(fromISO + 'T00:00:00');
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const isFinishedGood = (r: ItemRow) => !!r.style_id || r.stock_class === 'finished_good';
const styleCategory = (r: ItemRow): string => {
  const s = Array.isArray(r.styles) ? r.styles[0] : r.styles;
  return s?.category?.trim() || 'Uncategorised';
};
const MATERIAL_CLASS_LABEL: Record<string, string> = {
  direct_material: 'Direct materials',
  direct_expense: 'Direct expenses',
  indirect_material: 'Indirect materials',
};

// ------------------------------------------------------------------
// Small layout pieces
// ------------------------------------------------------------------
function Card({
  title,
  subtitle,
  action,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-rowan-red/20 p-4 sm:p-5 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-rowan-navy hover:text-rowan-red print:hidden"
          >
            {action.label} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = 'navy',
  trend,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'navy' | 'red' | 'green' | 'gray';
  trend?: number[];
  delta?: number | null;
}) {
  const bar = { navy: 'bg-rowan-navy', red: 'bg-rowan-red', green: 'bg-green-600', gray: 'bg-gray-400' }[tone];
  return (
    <div className="bg-white rounded-2xl border border-rowan-red/20 overflow-hidden flex min-w-0">
      <div className={`w-1.5 shrink-0 ${bar}`} />
      <div className="px-3.5 py-3 min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">{label}</div>
        <div className="text-lg sm:text-xl font-black text-rowan-navy leading-tight mt-0.5 break-words">{value}</div>
        <div className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] mt-0.5 min-h-[16px] leading-snug">
          {delta !== undefined && delta !== null && (
            <span className={`font-bold ${delta >= 0 ? 'text-green-600' : 'text-rowan-red'}`}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub && <span className="text-gray-500">{sub}</span>}
        </div>
        {trend && <div className="mt-1.5">
          <Sparkline values={trend} />
        </div>}
      </div>
    </div>
  );
}

function SectionError({ what, message }: { what: string; message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-800 mb-4">
      <TriangleAlert size={15} className="mt-0.5 shrink-0" />
      <div>
        <span className="font-bold">Couldn&apos;t load {what}.</span> {message}
      </div>
    </div>
  );
}

function PipelineCard({
  title,
  icon,
  value,
  lines,
  tone,
  href,
  muted,
  note,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  lines: string[];
  tone: 'navy' | 'red' | 'gray';
  href?: string;
  muted?: boolean;
  note?: string;
}) {
  const accent = { navy: 'bg-rowan-navy', red: 'bg-rowan-red', gray: 'bg-gray-300' }[tone];
  const inner = (
    <div
      className={`relative h-full rounded-2xl p-4 sm:p-5 overflow-hidden ${
        muted ? 'bg-gray-50 border border-dashed border-gray-300' : 'bg-white border border-rowan-red/20 hover:border-rowan-red transition-colors'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accent}`} />
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{title}</span>
      </div>
      <div className={`text-2xl font-black leading-tight ${muted ? 'text-gray-400' : 'text-rowan-navy'}`}>{value}</div>
      <div className="mt-1 space-y-0.5">
        {lines.map((l, i) => (
          <div key={i} className="text-[11px] text-gray-500">
            {l}
          </div>
        ))}
      </div>
      {note && <div className="mt-2 text-[11px] leading-snug text-gray-500">{note}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function DashboardPage() {
  const [salesInv, setSalesInv] = useState<InvoiceRow[]>([]);
  const [openInv, setOpenInv] = useState<InvoiceRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [salesErr, setSalesErr] = useState<string | null>(null);
  const [stockErr, setStockErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [range, setRange] = useState<6 | 12>(12);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const windowStart = localISO(new Date(now.getFullYear(), now.getMonth() - 23, 1));
    const cols = 'id, invoice_number, invoice_date, due_date, status, subtotal, total_amount, amount_paid, purchaser_name, customer_id';

    const salesP = Promise.all([
      // Issued + paid invoices over the last 24 months (this year and prior year, for comparison)
      fetchAll<InvoiceRow>((from, to) =>
        supabase
          .from('invoices')
          .select(cols)
          .in('status', ['issued', 'paid'])
          .gte('invoice_date', windowStart)
          .order('invoice_date')
          .order('id')
          .range(from, to)
      ),
      // Every issued invoice regardless of age — needed so old unpaid balances still count as receivables
      fetchAll<InvoiceRow>((from, to) =>
        supabase.from('invoices').select(cols).eq('status', 'issued').order('invoice_date').order('id').range(from, to)
      ),
    ]);

    const stockP = (async () => {
      const base = 'id, code, name, quantity_on_hand, unit_cost, reorder_level, style_id, stock_class, material_classification';
      const run = (select: string) =>
        fetchAll<ItemRow>((from, to) =>
          supabase
            .from('items')
            .select(select)
            .eq('is_active', true)
            .eq('item_type', 'inventory')
            .order('code')
            .range(from, to)
        );
      try {
        return await run(`${base}, styles(category)`);
      } catch {
        // If the styles relationship isn't available, still show stock (categories fall back to "Uncategorised")
        return await run(base);
      }
    })();

    const [salesRes, stockRes] = await Promise.allSettled([salesP, stockP]);

    if (salesRes.status === 'fulfilled') {
      setSalesInv(salesRes.value[0]);
      setOpenInv(salesRes.value[1]);
      setSalesErr(null);
    } else {
      setSalesErr(salesRes.reason?.message ?? 'Unknown error');
    }
    if (stockRes.status === 'fulfilled') {
      setItems(stockRes.value);
      setStockErr(null);
    } else {
      setStockErr(stockRes.reason?.message ?? 'Unknown error');
    }
    setUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------- Sales / receivables ----------------
  const sales = useMemo(() => {
    const now = new Date();
    const curKey = monthKey(now);

    // Every month in the 24-month window → net sales + invoiced/collected
    const net = new Map<string, number>();
    const invoiced = new Map<string, number>();
    const collected = new Map<string, number>();
    for (const r of salesInv) {
      const k = r.invoice_date.slice(0, 7);
      net.set(k, (net.get(k) ?? 0) + num(r.subtotal));
      invoiced.set(k, (invoiced.get(k) ?? 0) + num(r.total_amount));
      collected.set(k, (collected.get(k) ?? 0) + Math.min(num(r.amount_paid), num(r.total_amount)));
    }

    const months: { key: string; prevKey: string; label: string; tag?: string; long: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prev = new Date(d.getFullYear() - 1, d.getMonth(), 1);
      months.push({
        key: monthKey(d),
        prevKey: monthKey(prev),
        label: MONTH_ABBR[d.getMonth()],
        tag: d.getMonth() === 0 || i === 11 ? `’${String(d.getFullYear()).slice(2)}` : undefined,
        long: `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`,
      });
    }

    const salesSeries = months.map((m) => net.get(m.key) ?? 0);
    const thisMonth = net.get(curKey) ?? 0;

    // Same period last month: 1st → same day-of-month (clamped), so MTD compares like with like
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const daysInLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const cutoff = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), Math.min(now.getDate(), daysInLast));
    const lmStart = localISO(lastMonthStart);
    const lmEnd = localISO(cutoff);
    let lastMonthSamePeriod = 0;
    for (const r of salesInv) if (r.invoice_date >= lmStart && r.invoice_date <= lmEnd) lastMonthSamePeriod += num(r.subtotal);
    const delta = lastMonthSamePeriod > 0 ? ((thisMonth - lastMonthSamePeriod) / lastMonthSamePeriod) * 100 : null;

    // Sri Lankan fiscal year: 1 Apr → 31 Mar
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = `${fyStartYear}-04-01`;
    let fyToDate = 0;
    for (const r of salesInv) if (r.invoice_date >= fyStart) fyToDate += num(r.subtotal);

    // Receivables from ALL open issued invoices
    const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0 };
    const byCustomer = new Map<string, { name: string; amount: number; count: number }>();
    let outstanding = 0;
    let overdue = 0;
    let openCount = 0;
    for (const r of openInv) {
      const bal = num(r.total_amount) - num(r.amount_paid);
      if (bal <= 0.01) continue;
      openCount++;
      outstanding += bal;
      const due = r.due_date ?? r.invoice_date;
      const days = daysBetween(due, now);
      if (days <= 0) buckets.current += bal;
      else {
        overdue += bal;
        if (days <= 30) buckets.d30 += bal;
        else if (days <= 60) buckets.d60 += bal;
        else if (days <= 90) buckets.d90 += bal;
        else buckets.d90p += bal;
      }
      const name = r.purchaser_name?.trim() || 'Unknown customer';
      const key = r.customer_id ?? name;
      const c = byCustomer.get(key) ?? { name, amount: 0, count: 0 };
      c.amount += bal;
      c.count += 1;
      byCustomer.set(key, c);
    }
    const topCustomers = Array.from(byCustomer.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Collection rate over the 12 displayed months
    let inv12 = 0;
    let col12 = 0;
    for (const m of months) {
      inv12 += invoiced.get(m.key) ?? 0;
      col12 += collected.get(m.key) ?? 0;
    }
    const collectionRate = inv12 > 0 ? (col12 / inv12) * 100 : null;

    return {
      months,
      salesSeries,
      thisMonth,
      delta,
      fyToDate,
      fyLabel: `FY ${fyStartYear}/${String(fyStartYear + 1).slice(2)}`,
      buckets,
      outstanding,
      overdue,
      openCount,
      topCustomers,
      collectionRate,
      net,
      invoiced,
      collected,
    };
  }, [salesInv, openInv]);

  const salesColumns: ColumnDatum[] = useMemo(() => {
    const slice = range === 6 ? sales.months.slice(-6) : sales.months;
    return slice.map((m) => ({
      label: m.label,
      tag: m.tag,
      sublabel: m.long,
      parts: [sales.net.get(m.key) ?? 0],
      ref: sales.net.get(m.prevKey) ?? 0,
    }));
  }, [sales, range]);

  const receivableColumns: ColumnDatum[] = useMemo(
    () =>
      sales.months.map((m) => {
        const inv = sales.invoiced.get(m.key) ?? 0;
        const col = sales.collected.get(m.key) ?? 0;
        return { label: m.label, tag: m.tag, sublabel: `${m.long} invoices`, parts: [col, Math.max(0, inv - col)] };
      }),
    [sales]
  );

  // ---------------- Inventory ----------------
  const stock = useMemo(() => {
    const withStock = items.filter((r) => num(r.quantity_on_hand) !== 0);
    const val = (r: ItemRow) => num(r.quantity_on_hand) * num(r.unit_cost);

    const fg = withStock.filter(isFinishedGood);
    const rm = withStock.filter((r) => !isFinishedGood(r));
    const fgValue = fg.reduce((s, r) => s + val(r), 0);
    const rmValue = rm.reduce((s, r) => s + val(r), 0);
    const fgUnits = fg.reduce((s, r) => s + num(r.quantity_on_hand), 0);
    const rmUnits = rm.reduce((s, r) => s + num(r.quantity_on_hand), 0);

    const group = (rows: ItemRow[], keyOf: (r: ItemRow) => string) => {
      const m = new Map<string, { value: number; skus: number }>();
      for (const r of rows) {
        const k = keyOf(r);
        const g = m.get(k) ?? { value: 0, skus: 0 };
        g.value += val(r);
        g.skus += 1;
        m.set(k, g);
      }
      return Array.from(m.entries())
        .map(([label, g]) => ({ label, value: g.value, sub: `${g.skus} item${g.skus === 1 ? '' : 's'}` }))
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value);
    };

    const fgByCategory = group(fg, styleCategory);
    const rmByClass = group(rm, (r) => (r.material_classification ? MATERIAL_CLASS_LABEL[r.material_classification] : 'Unclassified'));

    const topFg = fg
      .map((r) => ({ label: r.name, sub: r.code, value: val(r) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const low = items
      .filter((r) => r.reorder_level !== null && num(r.quantity_on_hand) <= num(r.reorder_level))
      .map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        qty: num(r.quantity_on_hand),
        reorder: num(r.reorder_level),
        kind: isFinishedGood(r) ? 'Finished good' : 'Raw material',
      }))
      .sort((a, b) => (a.reorder > 0 ? a.qty / a.reorder : 0) - (b.reorder > 0 ? b.qty / b.reorder : 0));

    return { fg, rm, fgValue, rmValue, fgUnits, rmUnits, fgByCategory, rmByClass, topFg, low, total: fgValue + rmValue };
  }, [items]);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const overduePct = sales.outstanding > 0 ? (sales.overdue / sales.outstanding) * 100 : 0;
  const hasAnyData = salesInv.length > 0 || openInv.length > 0 || items.length > 0;

  return (
    <div className="min-h-full font-body px-4 sm:px-6 py-5 sm:py-6">
      <PageHeader
        title="Business Dashboard"
        subtitle={`${today}${updated ? ` · updated ${updated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
        actions={
          <button type="button" onClick={load} disabled={loading} className={btnSecondary}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {loading && !hasAnyData ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading dashboard…" />
        </div>
      ) : (
        <>
          {salesErr && <SectionError what="sales and receivables" message={salesErr} />}
          {stockErr && <SectionError what="inventory" message={stockErr} />}

          {/* ---------- KPI strip ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
            <Kpi
              label="Sales · this month"
              value={`LKR ${fmtCompact(sales.thisMonth)}`}
              delta={sales.delta}
              sub="vs same period last month"
              trend={sales.salesSeries}
              tone="red"
            />
            <Kpi label={`Sales · ${sales.fyLabel}`} value={`LKR ${fmtCompact(sales.fyToDate)}`} sub="net of tax, 1 Apr to date" tone="navy" />
            <Kpi
              label="Receivables"
              value={`LKR ${fmtCompact(sales.outstanding)}`}
              sub={`${sales.openCount} open invoice${sales.openCount === 1 ? '' : 's'}`}
              tone="navy"
            />
            <Kpi
              label="Overdue"
              value={`LKR ${fmtCompact(sales.overdue)}`}
              sub={sales.outstanding > 0 ? `${overduePct.toFixed(0)}% of receivables` : 'nothing outstanding'}
              tone={overduePct > 40 ? 'red' : 'gray'}
            />
            <Kpi
              label="Inventory value"
              value={`LKR ${fmtCompact(stock.total)}`}
              sub="raw materials + finished goods"
              tone="navy"
            />
            <Kpi
              label="Low stock"
              value={String(stock.low.length)}
              sub={stock.low.length === 1 ? 'item at / below reorder' : 'items at / below reorder'}
              tone={stock.low.length > 0 ? 'red' : 'green'}
            />
          </div>

          {/* ---------- Sales + aging ---------- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <Card
              className="xl:col-span-2"
              title="Sales by month"
              subtitle="Net of VAT / SSCL · issued and paid invoices · tick marks show the same month last year"
              action={{ href: '/accounting/reports/sales-by-customer', label: 'Sales report' }}
            >
              <div className="flex justify-end -mt-2 mb-2">
                <div className="inline-flex rounded-full border border-rowan-red/30 overflow-hidden text-[11px] font-bold">
                  {([6, 12] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRange(n)}
                      className={`px-3 py-1 transition-colors ${
                        range === n ? 'bg-rowan-red text-white' : 'bg-white text-rowan-navy hover:bg-red-50'
                      }`}
                    >
                      {n}M
                    </button>
                  ))}
                </div>
              </div>
              <ColumnChart
                data={salesColumns}
                format={lkr}
                colors={[CHART_COLORS.navy]}
                names={['Net sales']}
                highlightLast
                refName="Same month last year"
                emptyText="No issued invoices in this period."
              />
            </Card>

            <Card
              title="Receivables aging"
              subtitle="Open invoice balances by days past due"
              action={{ href: '/accounting/reports/ar-aging', label: 'A/R aging' }}
            >
              <StackedBar
                segments={[
                  { label: 'Current (not yet due)', value: sales.buckets.current, color: CHART_COLORS.navy },
                  { label: '1–30 days', value: sales.buckets.d30, color: CHART_COLORS.navyLight },
                  { label: '31–60 days', value: sales.buckets.d60, color: CHART_COLORS.amber },
                  { label: '61–90 days', value: sales.buckets.d90, color: '#f26b7f' },
                  { label: 'Over 90 days', value: sales.buckets.d90p, color: CHART_COLORS.red },
                ]}
              />
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-baseline justify-between text-[12px]">
                <span className="text-gray-500">Total receivable</span>
                <span className="font-black text-rowan-navy">LKR {fmtMoney(sales.outstanding)}</span>
              </div>
            </Card>
          </div>

          {/* ---------- Receivables by month + collections ---------- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-8">
            <Card
              className="xl:col-span-2"
              title="Receivables by invoice month"
              subtitle="Invoiced incl. tax — how much of each month’s billing has been collected vs. is still owed"
              action={{ href: '/accounting/invoices', label: 'Invoices' }}
            >
              <ColumnChart
                data={receivableColumns}
                format={lkr}
                height={250}
                colors={[CHART_COLORS.green, CHART_COLORS.red]}
                names={['Collected', 'Still outstanding']}
                emptyText="No invoices in the last 12 months."
              />
            </Card>

            <Card title="Collections" subtitle="Last 12 months of invoices, incl. tax">
              {sales.collectionRate === null ? (
                <div className="text-[12px] text-gray-400 py-6 text-center">No invoices to measure yet.</div>
              ) : (
                <Gauge pct={sales.collectionRate} label="Collected" />
              )}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Top customers owing</div>
                <HBars
                  items={sales.topCustomers.map((c) => ({
                    label: c.name,
                    value: c.amount,
                    sub: `${c.count} inv`,
                  }))}
                  format={(n) => `LKR ${fmtCompact(n)}`}
                  color={CHART_COLORS.red}
                  emptyText="No outstanding balances."
                />
              </div>
            </Card>
          </div>

          {/* ---------- Inventory ---------- */}
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Inventory pipeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <PipelineCard
              title="Raw materials"
              icon={<Package size={15} />}
              value={`LKR ${fmtCompact(stock.rmValue)}`}
              lines={[`${stock.rm.length} items in stock`, `${stock.rmUnits.toLocaleString('en-US', { maximumFractionDigits: 0 })} units on hand`]}
              tone="navy"
              href="/stock"
            />
            <PipelineCard
              title="Work in progress"
              icon={<Factory size={15} />}
              value="Not tracked"
              lines={[]}
              tone="gray"
              muted
              note="Production currently moves materials, labour and overhead straight into Finished Goods, so there is no WIP balance to report."
            />
            <PipelineCard
              title="Finished goods"
              icon={<Boxes size={15} />}
              value={`LKR ${fmtCompact(stock.fgValue)}`}
              lines={[`${stock.fg.length} items in stock`, `${stock.fgUnits.toLocaleString('en-US', { maximumFractionDigits: 0 })} units on hand`]}
              tone="red"
              href="/warehouse/valuation"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <Card title="Inventory value mix" subtitle="At weighted-average cost">
              <DonutChart
                centerLabel="Total"
                centerValue={`LKR ${fmtCompact(stock.total)}`}
                slices={[
                  { label: 'Raw materials', value: stock.rmValue, color: CHART_COLORS.navy },
                  { label: 'Work in progress', value: 0, color: CHART_COLORS.gray, note: 'n/a' },
                  { label: 'Finished goods', value: stock.fgValue, color: CHART_COLORS.red },
                ]}
              />
            </Card>

            <Card
              title="Finished goods by category"
              subtitle="Stock value, grouped by style category"
              action={{ href: '/warehouse/valuation', label: 'Valuation' }}
            >
              <HBars
                items={stock.fgByCategory.slice(0, 7)}
                format={(n) => `LKR ${fmtCompact(n)}`}
                color={CHART_COLORS.red}
                emptyText="No finished goods in stock."
              />
            </Card>

            <Card
              title="Raw materials by type"
              subtitle="Stock value, grouped by cost classification"
              action={{ href: '/stock', label: 'Stock' }}
            >
              <DonutChart
                size={130}
                centerLabel="Materials"
                centerValue={`LKR ${fmtCompact(stock.rmValue)}`}
                slices={stock.rmByClass.map((g, i) => ({ label: g.label, value: g.value, color: PALETTE[i % PALETTE.length] }))}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card title="Top finished goods" subtitle="Highest stock value">
              <HBars items={stock.topFg} format={(n) => `LKR ${fmtCompact(n)}`} emptyText="No finished goods in stock." />
            </Card>

            <Card
              className="lg:col-span-2"
              title="Low-stock alerts"
              subtitle="Items at or below their reorder level"
              action={{ href: '/warehouse/adjustment', label: 'Adjust stock' }}
            >
              {stock.low.length === 0 ? (
                <div className="text-[12px] text-gray-400 py-6 text-center">
                  Nothing at or below reorder level. Reorder levels are set per item in the catalog.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-left text-gray-400 uppercase text-[10px] border-b border-gray-100">
                        <th className="py-2 pr-3">Item</th>
                        <th className="py-2 pr-3 hidden sm:table-cell">Type</th>
                        <th className="py-2 text-right">On hand</th>
                        <th className="py-2 text-right">Reorder at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.low.slice(0, 8).map((r) => (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="py-2 pr-3">
                            <div className="font-bold text-rowan-navy truncate max-w-[220px]">{r.name}</div>
                            <div className="text-[10px] text-gray-400">{r.code}</div>
                          </td>
                          <td className="py-2 pr-3 text-gray-500 hidden sm:table-cell">{r.kind}</td>
                          <td className={`py-2 text-right font-bold ${r.qty <= 0 ? 'text-rowan-red' : 'text-amber-600'}`}>
                            {r.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-right text-gray-500">{r.reorder.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stock.low.length > 8 && (
                    <div className="text-[11px] text-gray-400 pt-2">+ {stock.low.length - 8} more below reorder level</div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
