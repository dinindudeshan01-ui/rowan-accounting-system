'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type LucideIcon,
  AlarmClock,
  ArrowRight,
  Boxes,
  CalendarDays,
  Factory,
  HandCoins,
  Package,
  PackageMinus,
  RefreshCw,
  TrendingUp,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, btnSecondary } from '@/components/PageHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  CHART_COLORS,
  PALETTE,
  ComboChart,
  CountUp,
  DonutChart,
  Gauge,
  HBars,
  Heatmap,
  RingProgress,
  Sparkline,
  StackedBar,
  fmtCompact,
  fmtMoney,
  type ComboDatum,
  type HeatCell,
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

type InvRef = { invoice_date: string; status: string };
type LineRow = {
  item_id: string | null;
  code: string | null;
  qty: number | null;
  unit_price: number | null;
  invoices: InvRef | InvRef[] | null;
};

type Movement = 'fast' | 'medium' | 'slow' | 'none';

/** Posted sales revenue straight from the ledger — the same source as the Profit & Loss report. */
type LedgerData = {
  months: Record<string, number>; // 'YYYY-MM' -> revenue
  mtd: number; // revenue 1st of this month -> today
  lmSame: number; // revenue same day-range last month
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
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const num = (v: number | null | undefined) => Number(v ?? 0);
const lkr = (n: number) => `LKR ${fmtMoney(n)}`;
const lkrC = (n: number) => `LKR ${fmtCompact(n)}`;

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

const MOVE_META: Record<Movement, { label: string; color: string; badge: string }> = {
  fast: { label: 'Fast', color: CHART_COLORS.green, badge: 'bg-green-50 text-green-700 border-green-200' },
  medium: { label: 'Medium', color: CHART_COLORS.navyLight, badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  slow: { label: 'Slow', color: CHART_COLORS.amber, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  none: { label: 'No sales', color: CHART_COLORS.red, badge: 'bg-red-50 text-rowan-red border-red-200' },
};

// ------------------------------------------------------------------
// Layout pieces
// ------------------------------------------------------------------
function Card({
  title,
  subtitle,
  action,
  right,
  className = '',
  children,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative bg-white rounded-2xl border border-rowan-red/15 p-4 sm:p-5 min-w-0 shadow-[0_1px_2px_rgba(6,21,75,0.04),0_8px_24px_-12px_rgba(6,21,75,0.12)] chart-fade ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy flex items-center gap-2">
            <span className="inline-block w-1 h-3.5 rounded-full bg-gradient-to-b from-rowan-red to-rowan-navy" />
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-1 pl-3">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {right}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-rowan-navy hover:text-rowan-red print:hidden"
            >
              {action.label} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3 mt-2">
      <h2 className="text-[13px] font-black uppercase tracking-[0.18em] text-rowan-navy">
        {children}
        <span className="block mt-1.5 h-[3px] w-10 rounded-full bg-gradient-to-r from-rowan-red to-rowan-navy" />
      </h2>
      {note && <span className="text-[11px] text-gray-400 hidden sm:block">{note}</span>}
    </div>
  );
}

function Toggle<T extends string | number>({
  value,
  options,
  onChange,
  suffix = '',
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  suffix?: string;
}) {
  return (
    <div className="inline-flex rounded-full border border-rowan-red/30 overflow-hidden text-[11px] font-bold">
      {options.map((o) => (
        <button
          key={String(o)}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3 py-1 transition-colors ${value === o ? 'bg-rowan-red text-white' : 'bg-white text-rowan-navy hover:bg-red-50'}`}
        >
          {o}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  format,
  sub,
  icon: Icon,
  tone = 'navy',
  hero = false,
  trend,
  delta,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub?: string;
  icon: LucideIcon;
  tone?: 'navy' | 'red' | 'green' | 'gray';
  hero?: boolean;
  trend?: number[];
  delta?: number | null;
}) {
  const chip = {
    navy: 'bg-rowan-navy/10 text-rowan-navy',
    red: 'bg-rowan-red/10 text-rowan-red',
    green: 'bg-green-600/10 text-green-700',
    gray: 'bg-gray-100 text-gray-500',
  }[tone];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden min-w-0 p-3.5 chart-fade ${
        hero
          ? 'bg-gradient-to-br from-rowan-navy via-[#0b1d66] to-[#1d34a0] text-white shadow-[0_12px_28px_-10px_rgba(6,21,75,0.6)]'
          : 'bg-white border border-rowan-red/15 shadow-[0_1px_2px_rgba(6,21,75,0.04),0_8px_24px_-12px_rgba(6,21,75,0.12)]'
      }`}
    >
      {hero && <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-rowan-red/40 blur-2xl" />}
      <div className="relative flex items-center justify-between gap-2">
        <div className={`text-[10px] font-bold uppercase tracking-widest truncate ${hero ? 'text-white/65' : 'text-gray-400'}`}>
          {label}
        </div>
        <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${hero ? 'bg-white/15 text-white' : chip}`}>
          <Icon size={14} />
        </span>
      </div>
      <div className={`relative text-xl sm:text-[22px] font-black leading-tight mt-1.5 break-words ${hero ? 'text-white' : 'text-rowan-navy'}`}>
        <CountUp value={value} format={format} />
      </div>
      <div className="relative flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] mt-1 min-h-[16px] leading-snug">
        {delta !== undefined && delta !== null && (
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-px font-bold text-[10px] ${
              delta >= 0
                ? hero
                  ? 'bg-green-400/20 text-green-300'
                  : 'bg-green-50 text-green-700'
                : hero
                  ? 'bg-red-400/25 text-red-200'
                  : 'bg-red-50 text-rowan-red'
            }`}
          >
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {sub && <span className={hero ? 'text-white/65' : 'text-gray-500'}>{sub}</span>}
      </div>
      {trend && (
        <div className="relative mt-2">
          <Sparkline values={trend} color={hero ? '#ffffff' : CHART_COLORS.navy} dot={hero ? '#ff6b82' : CHART_COLORS.red} />
        </div>
      )}
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
  const accent = {
    navy: 'from-rowan-navy to-[#1d34a0]',
    red: 'from-rowan-red to-[#8c0019]',
    gray: 'from-gray-300 to-gray-200',
  }[tone];
  const inner = (
    <div
      className={`relative h-full rounded-2xl p-4 sm:p-5 overflow-hidden chart-fade ${
        muted
          ? 'bg-gray-50 border border-dashed border-gray-300'
          : 'bg-white border border-rowan-red/15 shadow-[0_8px_24px_-12px_rgba(6,21,75,0.12)] hover:border-rowan-red/60 hover:-translate-y-0.5 transition-all'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${accent}`} />
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

function CoverPill({ cover, moved }: { cover: number | null; moved: boolean }) {
  if (!moved || cover === null) return <span className="text-[11px] text-gray-300">—</span>;
  const d = Math.round(cover);
  const cls =
    d < 15
      ? 'bg-red-50 text-rowan-red border-red-200'
      : d <= 60
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  const txt = d >= 999 ? '999+d' : `${d}d`;
  return (
    <span
      title="Days of cover: stock on hand ÷ average daily units sold"
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${cls}`}
    >
      {txt}
    </span>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default function DashboardPage() {
  const [salesInv, setSalesInv] = useState<InvoiceRow[]>([]);
  const [openInv, setOpenInv] = useState<InvoiceRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [ledgerErr, setLedgerErr] = useState<string | null>(null);
  const [salesErr, setSalesErr] = useState<string | null>(null);
  const [stockErr, setStockErr] = useState<string | null>(null);
  const [linesErr, setLinesErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [range, setRange] = useState<6 | 12>(12);
  const [win, setWin] = useState<30 | 90>(90);
  const [moveViewPick, setMoveViewPick] = useState<'stock' | 'sales' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const windowStart = localISO(new Date(now.getFullYear(), now.getMonth() - 23, 1));
    const linesStart = localISO(new Date(now.getFullYear(), now.getMonth() - 6, 1)); // 6 complete months + current
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
      // Every issued invoice regardless of age — old unpaid balances still count as receivables
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

    // Units sold per item: invoice lines of issued / paid invoices over the last 6 months
    const linesP = fetchAll<LineRow>((from, to) =>
      supabase
        .from('invoice_lines')
        .select('id, item_id, code, qty, unit_price, invoices!inner(invoice_date, status)')
        .in('invoices.status', ['issued', 'paid'])
        .gte('invoices.invoice_date', linesStart)
        .order('id')
        .range(from, to)
    );

    // Sales revenue as the P&L sees it: posted journal entries by entry date (get_pl)
    const ledgerP = (async (): Promise<LedgerData> => {
      const call = async (start: string, end: string) => {
        const { data, error } = await supabase.rpc('get_pl', { p_start: start, p_end: end });
        if (error) throw new Error(error.message);
        return ((data ?? []) as { account_type: string; amount: number | string }[])
          .filter((r) => r.account_type === 'revenue')
          .reduce((sum, r) => sum + Number(r.amount), 0);
      };
      const months: Record<string, number> = {};
      const tasks: Promise<void>[] = [];
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        tasks.push(call(localISO(d), localISO(end)).then((v) => void (months[monthKey(d)] = v)));
      }
      const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const daysInLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const lastCut = new Date(lastStart.getFullYear(), lastStart.getMonth(), Math.min(now.getDate(), daysInLast));
      let mtd = 0;
      let lmSame = 0;
      tasks.push(call(localISO(new Date(now.getFullYear(), now.getMonth(), 1)), localISO(now)).then((v) => void (mtd = v)));
      tasks.push(call(localISO(lastStart), localISO(lastCut)).then((v) => void (lmSame = v)));
      await Promise.all(tasks);
      return { months, mtd, lmSame };
    })();

    const [salesRes, stockRes, linesRes, ledgerRes] = await Promise.allSettled([salesP, stockP, linesP, ledgerP]);

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
    if (linesRes.status === 'fulfilled') {
      setLines(linesRes.value);
      setLinesErr(null);
    } else {
      setLinesErr(linesRes.reason?.message ?? 'Unknown error');
    }
    if (ledgerRes.status === 'fulfilled') {
      setLedger(ledgerRes.value);
      setLedgerErr(null);
    } else {
      setLedger(null);
      setLedgerErr(ledgerRes.reason?.message ?? 'Unknown error');
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

    const netInv = new Map<string, number>(); // by invoice date, from invoices
    const invoiced = new Map<string, number>();
    const collected = new Map<string, number>();
    const daily = new Map<string, number>();
    for (const r of salesInv) {
      const k = r.invoice_date.slice(0, 7);
      netInv.set(k, (netInv.get(k) ?? 0) + num(r.subtotal));
      invoiced.set(k, (invoiced.get(k) ?? 0) + num(r.total_amount));
      collected.set(k, (collected.get(k) ?? 0) + Math.min(num(r.amount_paid), num(r.total_amount)));
      daily.set(r.invoice_date, (daily.get(r.invoice_date) ?? 0) + num(r.subtotal));
    }

    const months: { key: string; prevKey: string; label: string; tag?: string; long: string; d: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prev = new Date(d.getFullYear() - 1, d.getMonth(), 1);
      months.push({
        key: monthKey(d),
        prevKey: monthKey(prev),
        label: MONTH_ABBR[d.getMonth()],
        tag: d.getMonth() === 0 || i === 11 ? `’${String(d.getFullYear()).slice(2)}` : undefined,
        long: `${MONTH_ABBR[d.getMonth()]} ${d.getFullYear()}`,
        d,
      });
    }

    // Sales basis: posted ledger revenue (identical to the P&L). Falls back to invoices if the ledger call failed.
    const basis: 'ledger' | 'invoices' = ledger ? 'ledger' : 'invoices';
    const net: Map<string, number> = ledger ? new Map(Object.entries(ledger.months)) : netInv;

    const salesSeries = months.map((m) => net.get(m.key) ?? 0);
    const thisMonth = net.get(curKey) ?? 0;

    // Where invoices (by invoice date) and the ledger (by posting date) disagree
    const recon = ledger
      ? months
          .map((m) => {
            const inv = netInv.get(m.key) ?? 0;
            const led = net.get(m.key) ?? 0;
            return { key: m.key, long: m.long, inv, led, diff: inv - led };
          })
          .filter((r) => Math.abs(r.diff) >= 1)
      : [];

    // Same period last month: 1st → same day-of-month (clamped), so MTD compares like with like
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const daysInLast = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const cutoff = new Date(lastMonthStart.getFullYear(), lastMonthStart.getMonth(), Math.min(now.getDate(), daysInLast));
    const lmStart = localISO(lastMonthStart);
    const lmEnd = localISO(cutoff);
    let lastMonthSamePeriod = 0;
    for (const r of salesInv) if (r.invoice_date >= lmStart && r.invoice_date <= lmEnd) lastMonthSamePeriod += num(r.subtotal);
    const delta = ledger
      ? ledger.lmSame > 0
        ? ((ledger.mtd - ledger.lmSame) / ledger.lmSame) * 100
        : null
      : lastMonthSamePeriod > 0
        ? ((thisMonth - lastMonthSamePeriod) / lastMonthSamePeriod) * 100
        : null;

    // Sri Lankan fiscal year: 1 Apr → 31 Mar
    const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStart = `${fyStartYear}-04-01`;
    const fyStartKey = fyStart.slice(0, 7);
    let fyToDate = 0;
    net.forEach((v, k) => {
      if (k >= fyStartKey && k <= curKey) fyToDate += v;
    });

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

    let inv12 = 0;
    let col12 = 0;
    for (const m of months) {
      inv12 += invoiced.get(m.key) ?? 0;
      col12 += collected.get(m.key) ?? 0;
    }
    const collectionRate = inv12 > 0 ? (col12 / inv12) * 100 : null;

    // Daily sales heatmap: last 26 weeks, Monday → Sunday columns
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = (today0.getDay() + 6) % 7;
    const startMonday = addDays(today0, -dow - 25 * 7);
    const weeks: HeatCell[][] = [];
    for (let w = 0; w < 26; w++) {
      const col: HeatCell[] = [];
      for (let d = 0; d < 7; d++) {
        const day = addDays(startMonday, w * 7 + d);
        const iso = localISO(day);
        col.push({ date: iso, value: daily.get(iso) ?? 0, future: day > today0 });
      }
      weeks.push(col);
    }

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
      weeks,
      basis,
      recon,
    };
  }, [salesInv, openInv, ledger]);

  const salesCombo: ComboDatum[] = useMemo(() => {
    const full = sales.months.map((m, i) => {
      const isCurrent = i === sales.months.length - 1;
      // 3-month moving average (this month + previous two); skipped for the unfinished current month
      let ma: number | null = null;
      if (!isCurrent) {
        const keys = [0, 1, 2].map((k) => monthKey(new Date(m.d.getFullYear(), m.d.getMonth() - k, 1)));
        ma = keys.reduce((s, k) => s + (sales.net.get(k) ?? 0), 0) / 3;
      }
      return {
        label: m.label,
        tag: m.tag,
        sublabel: m.long,
        parts: [sales.net.get(m.key) ?? 0],
        lines: [ma, (sales.net.get(m.prevKey) ?? 0) > 0 ? (sales.net.get(m.prevKey) as number) : null],
      };
    });
    return range === 6 ? full.slice(-6) : full;
  }, [sales, range]);

  const receivableCombo: ComboDatum[] = useMemo(
    () =>
      sales.months.map((m) => {
        const inv = sales.invoiced.get(m.key) ?? 0;
        const col = sales.collected.get(m.key) ?? 0;
        return {
          label: m.label,
          tag: m.tag,
          sublabel: `${m.long} invoices`,
          parts: [col, Math.max(0, inv - col)],
          lines: [inv > 0 ? (col / inv) * 100 : null],
        };
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

  // ---------------- Fast-moving finished goods ----------------
  const movers = useMemo(() => {
    const fgAll = items.filter(isFinishedGood);
    const byId = new Map(fgAll.map((r) => [r.id, r]));
    const byCode = new Map(fgAll.filter((r) => r.code).map((r) => [r.code.trim().toLowerCase(), r]));

    const now = new Date();
    const cutoff = localISO(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), -win));
    const monthKeys: string[] = [];
    // trend sparklines use the last 6 *complete* months (the current month is partial and would always dip)
    for (let i = 6; i >= 1; i--) monthKeys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));

    type Agg = { item: ItemRow; units: number; revenue: number; monthly: number[] };
    const agg = new Map<string, Agg>();
    let matchedLines = 0;

    for (const l of lines) {
      const inv = Array.isArray(l.invoices) ? l.invoices[0] : l.invoices;
      if (!inv || (inv.status !== 'issued' && inv.status !== 'paid')) continue;
      const it = (l.item_id ? byId.get(l.item_id) : undefined) ?? (l.code ? byCode.get(l.code.trim().toLowerCase()) : undefined);
      if (!it) continue;
      matchedLines++;
      const a = agg.get(it.id) ?? { item: it, units: 0, revenue: 0, monthly: [0, 0, 0, 0, 0, 0] };
      const q = num(l.qty);
      const mi = monthKeys.indexOf(inv.invoice_date.slice(0, 7));
      if (mi >= 0) a.monthly[mi] += q;
      if (inv.invoice_date >= cutoff) {
        a.units += q;
        a.revenue += q * num(l.unit_price);
      }
      agg.set(it.id, a);
    }

    // Rank by units sold in the chosen window; classify by cumulative share of units
    // (first ~70% of units = Fast, next ~20% = Medium, remainder = Slow). Items that
    // sold nothing but still hold stock are "No sales".
    const sold = Array.from(agg.values())
      .filter((a) => a.units > 0)
      .sort((a, b) => b.units - a.units);
    const totalUnits = sold.reduce((s, a) => s + a.units, 0);
    let cum = 0;
    const cls = new Map<string, Movement>();
    for (const a of sold) {
      const before = totalUnits > 0 ? cum / totalUnits : 0;
      cls.set(a.item.id, before < 0.7 ? 'fast' : before < 0.9 ? 'medium' : 'slow');
      cum += a.units;
    }

    // If every finished good has quantity 0, stock simply isn't tracked yet — don't pretend it's "sold out"
    const tracked = fgAll.some((r) => num(r.quantity_on_hand) !== 0);

    const rows = sold.map((a) => {
      const onHand = num(a.item.quantity_on_hand);
      const rate = a.units / win;
      return {
        id: a.item.id,
        name: a.item.name,
        code: a.item.code,
        units: a.units,
        revenue: a.revenue,
        monthly: a.monthly,
        onHand,
        value: onHand * num(a.item.unit_cost),
        cover: tracked && rate > 0 ? Math.min(999, onHand / rate) : null,
        cls: cls.get(a.item.id) ?? 'slow',
      };
    });

    // Value of finished-goods stock by movement class
    const valueBy: Record<Movement, number> = { fast: 0, medium: 0, slow: 0, none: 0 };
    const countBy: Record<Movement, number> = { fast: 0, medium: 0, slow: 0, none: 0 };
    for (const r of fgAll) {
      const q = num(r.quantity_on_hand);
      if (q <= 0) continue;
      const c = cls.get(r.id) ?? 'none';
      valueBy[c] += q * num(r.unit_cost);
      countBy[c] += 1;
    }

    // Sales (revenue) and item counts by movement class — works even when stock isn't tracked
    const salesBy: Record<Movement, number> = { fast: 0, medium: 0, slow: 0, none: 0 };
    const soldCount: Record<Movement, number> = { fast: 0, medium: 0, slow: 0, none: 0 };
    for (const r of rows) {
      salesBy[r.cls] += r.revenue;
      soldCount[r.cls] += 1;
    }

    const notSelling = fgAll
      .filter((r) => num(r.quantity_on_hand) > 0 && !cls.has(r.id))
      .map((r) => ({ label: r.name, sub: r.code, value: num(r.quantity_on_hand) * num(r.unit_cost) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { rows, valueBy, countBy, salesBy, soldCount, tracked, notSelling, matchedLines, maxUnits: rows[0]?.units ?? 0, totalUnits };
  }, [items, lines, win]);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const moveView: 'stock' | 'sales' = moveViewPick ?? (stock.fgValue > 0 ? 'stock' : 'sales');
  const anyCollected = sales.months.some((m) => (sales.collected.get(m.key) ?? 0) > 0);
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
          {linesErr && <SectionError what="fast-moving item data" message={linesErr} />}
          {ledgerErr && (
            <SectionError
              what="ledger sales (P&L source)"
              message={`Showing invoice-based sales instead, which may not match the P&L. ${ledgerErr}`}
            />
          )}

          {/* ---------- KPI strip ---------- */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            <Kpi
              hero
              icon={TrendingUp}
              label="Sales · this month"
              value={sales.thisMonth}
              format={lkrC}
              delta={sales.delta}
              sub="vs same period last month"
              trend={sales.salesSeries}
            />
            <Kpi
              icon={CalendarDays}
              label={`Sales · ${sales.fyLabel}`}
              value={sales.fyToDate}
              format={lkrC}
              sub={sales.basis === 'ledger' ? 'posted revenue, 1 Apr to date' : 'invoiced (net), 1 Apr to date'}
            />
            <Kpi
              icon={HandCoins}
              label="Receivables"
              value={sales.outstanding}
              format={lkrC}
              sub={`${sales.openCount} open invoice${sales.openCount === 1 ? '' : 's'}`}
            />
            <Kpi
              icon={AlarmClock}
              tone={overduePct > 40 ? 'red' : 'gray'}
              label="Overdue"
              value={sales.overdue}
              format={lkrC}
              sub={sales.outstanding > 0 ? `${overduePct.toFixed(0)}% of receivables` : 'nothing outstanding'}
            />
            <Kpi
              icon={Boxes}
              label="Inventory value"
              value={stock.total}
              format={lkrC}
              sub="raw materials + finished goods"
            />
            <Kpi
              icon={PackageMinus}
              tone={stock.low.length > 0 ? 'red' : 'green'}
              label="Low stock"
              value={stock.low.length}
              format={(n) => String(Math.round(n))}
              sub={stock.low.length === 1 ? 'item at / below reorder' : 'items at / below reorder'}
            />
          </div>

          {/* ---------- Sales ---------- */}
          <SectionTitle note="Net of tax unless stated">Sales &amp; receivables</SectionTitle>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <Card
              className="xl:col-span-2"
              title="Sales by month"
              subtitle={`${sales.basis === 'ledger' ? 'Posted sales revenue — same source as the P&L' : 'Invoiced sales (net of tax)'} · red line = 3-month average · dashed = last year`}
              action={{ href: '/accounting/reports/sales-by-customer', label: 'Sales report' }}
              right={<Toggle value={range} options={[6, 12] as (6 | 12)[]} onChange={setRange} suffix="M" />}
            >
              <ComboChart
                data={salesCombo}
                barNames={['Net sales']}
                barColors={[[CHART_COLORS.navyLight, CHART_COLORS.navy]]}
                lines={[
                  { name: '3-month average', color: CHART_COLORS.red },
                  { name: 'Same month last year', color: '#9aa3b2', dashed: true },
                ]}
                format={lkr}
                partialLast
                emptyText="No issued invoices in this period."
              />
              {sales.recon.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11px] text-amber-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <TriangleAlert size={13} className="shrink-0" />
                    Invoices and the ledger disagree in {sales.recon.length} month{sales.recon.length === 1 ? '' : 's'}
                  </div>
                  <p className="mt-1 text-amber-800">
                    The chart above uses posted ledger revenue, so it matches the P&amp;L. Invoices dated in these months add up to a different
                    amount — usually an invoice that was never posted, or one whose date was changed after it was posted:
                  </p>
                  <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1">
                    {sales.recon.slice(0, 6).map((r) => (
                      <li key={r.key} className="flex items-baseline gap-2">
                        <span className="font-bold">{r.long}</span>
                        <span className="text-amber-800">
                          invoices {lkrC(r.inv)} · ledger {lkrC(r.led)}
                        </span>
                        <span className={`ml-auto font-black ${r.diff > 0 ? 'text-rowan-red' : 'text-amber-900'}`}>
                          {r.diff > 0 ? '+' : ''}
                          {lkrC(r.diff)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                <RingProgress pct={overduePct} color={overduePct > 40 ? CHART_COLORS.red : CHART_COLORS.amber} label="overdue" />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total receivable</div>
                  <div className="text-lg font-black text-rowan-navy leading-tight">{lkr(sales.outstanding)}</div>
                  <div className="text-[11px] text-gray-500">{lkr(sales.overdue)} past due</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <Card
              className="xl:col-span-2"
              title="Receivables by invoice month"
              subtitle="Incl. tax · how much of each month’s billing is collected vs still owed · line = % collected"
              action={{ href: '/accounting/invoices', label: 'Invoices' }}
            >
              <ComboChart
                data={receivableCombo}
                barNames={['Collected', 'Still outstanding']}
                barColors={[
                  [CHART_COLORS.greenLight, CHART_COLORS.green],
                  ['#ff5b73', CHART_COLORS.red],
                ]}
                lines={anyCollected ? [{ name: '% collected', color: CHART_COLORS.navy, axis: 'right' }] : []}
                format={lkr}
                height={290}
                partialLast
                emptyText="No invoices in the last 12 months."
              />
              {!anyCollected && sales.invoiced.size > 0 && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                  <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                  <div>
                    <b>No customer payments are recorded against any invoice yet</b>, so everything shows as outstanding and every invoice
                    ages as overdue. If customers have already paid, record the receipts in{' '}
                    <Link href="/accounting/receive-payment" className="font-bold underline">
                      Receive Payment
                    </Link>{' '}
                    — collected amounts, A/R aging and this chart update from there.
                  </div>
                </div>
              )}
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
                  ranked
                  items={sales.topCustomers.map((c) => ({ label: c.name, value: c.amount, sub: `${c.count} inv` }))}
                  format={lkrC}
                  color={CHART_COLORS.red}
                  emptyText="No outstanding balances."
                />
              </div>
            </Card>
          </div>

          <Card
            className="mb-8"
            title="Daily sales heatmap"
            subtitle="Net sales per day over the last 26 weeks — darker means a bigger day"
          >
            <Heatmap weeks={sales.weeks} format={lkr} />
          </Card>

          {/* ---------- Inventory ---------- */}
          <SectionTitle note="Valued at weighted-average cost">Inventory</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <PipelineCard
              title="Raw materials"
              icon={<Package size={15} />}
              value={lkrC(stock.rmValue)}
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
              value={lkrC(stock.fgValue)}
              lines={[`${stock.fg.length} items in stock`, `${stock.fgUnits.toLocaleString('en-US', { maximumFractionDigits: 0 })} units on hand`]}
              tone="red"
              href="/warehouse/valuation"
            />
          </div>

          {/* ---------- Fast-moving finished goods ---------- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
            <Card
              className="xl:col-span-2"
              title="Fast-moving finished goods"
              subtitle={`Units sold in the last ${win} days · ranked by volume · cover = stock ÷ daily sales`}
              right={<Toggle value={win} options={[30, 90] as (30 | 90)[]} onChange={setWin} suffix="D" />}
            >
              {movers.rows.length === 0 ? (
                <div className="text-[12px] text-gray-400 py-10 text-center">
                  {lines.length === 0
                    ? 'No invoice lines found for the last 6 months.'
                    : movers.matchedLines === 0
                      ? 'Invoice lines were found, but none link to a finished-goods item (by item or code).'
                      : `No finished goods sold in the last ${win} days.`}
                </div>
              ) : (
                <div>
                  <div className="hidden sm:grid grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1.3fr)_84px_64px_80px] items-center gap-3 px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <span>#</span>
                    <span>Item</span>
                    <span>Units sold</span>
                    <span title="Units sold in each of the last 6 complete months">6-mo trend</span>
                    <span className="text-right">In stock</span>
                    <span className="text-right">Cover</span>
                  </div>
                  <ul>
                    {movers.rows.slice(0, 8).map((r, i) => {
                      const meta = MOVE_META[r.cls];
                      return (
                        <li
                          key={r.id}
                          className="grid grid-cols-[28px_minmax(0,1fr)_auto] sm:grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1.3fr)_84px_64px_80px] items-center gap-3 px-2 py-2.5 border-b border-gray-50 last:border-0 hover:bg-red-50/40 rounded-lg transition-colors"
                        >
                          <span
                            className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                              i === 0 ? 'bg-rowan-red text-white' : i < 3 ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-rowan-navy'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-[12px] text-rowan-navy truncate">{r.name}</span>
                              <span className={`hidden sm:inline-flex shrink-0 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {r.code}
                              <span className="sm:hidden">
                                {' '}
                                · {r.units.toLocaleString('en-US', { maximumFractionDigits: 0 })} sold{movers.tracked ? ` · ${r.onHand.toLocaleString('en-US', { maximumFractionDigits: 0 })} in stock` : ''}
                              </span>
                            </div>
                          </div>
                          <div className="hidden sm:block min-w-0">
                            <div className="flex items-baseline justify-between text-[12px] mb-1">
                              <span className="font-black text-rowan-navy">{r.units.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                              <span className="text-[10px] text-gray-400">{lkrC(r.revenue)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(4, (r.units / movers.maxUnits) * 100)}%`,
                                  background: `linear-gradient(90deg, ${meta.color}, ${meta.color}99)`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="hidden sm:block">
                            <Sparkline values={r.monthly} color={meta.color} dot={CHART_COLORS.red} height={26} />
                          </div>
                          <div className="hidden sm:block text-right text-[12px] font-bold text-rowan-navy">
                            {movers.tracked ? r.onHand.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                          </div>
                          <div className="text-right">
                            <CoverPill cover={r.cover} moved={movers.tracked} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-gray-400">
                    <span>
                      <Zap size={11} className="inline -mt-0.5 text-green-600" /> Fast = first 70% of units sold · Medium = next 20% · Slow = the rest
                    </span>
                    {movers.tracked ? (
                      <span className="sm:ml-auto">
                        Cover: <b className="text-rowan-red">&lt;15d</b> reorder soon · <b className="text-green-700">15–60d</b> healthy ·{' '}
                        <b className="text-amber-600">&gt;60d</b> overstocked
                      </span>
                    ) : (
                      <span className="sm:ml-auto text-amber-700">
                        Stock quantities are all 0 in the system, so stock and cover aren’t shown — ranking is by units sold only.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card
              title={moveView === 'stock' ? 'Stock value by movement' : 'Sales by movement'}
              subtitle={
                moveView === 'stock'
                  ? `Finished goods on hand, based on sales in the last ${win} days`
                  : `Revenue from finished goods sold in the last ${win} days, by movement class`
              }
              right={
                <div className="inline-flex rounded-full border border-rowan-red/30 overflow-hidden text-[11px] font-bold">
                  {(['stock', 'sales'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMoveViewPick(v)}
                      className={`px-3 py-1 capitalize transition-colors ${
                        moveView === v ? 'bg-rowan-red text-white' : 'bg-white text-rowan-navy hover:bg-red-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              }
            >
              {moveView === 'stock' ? (
                stock.fgValue <= 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
                    <div className="text-[13px] font-black text-gray-500">No finished-goods stock recorded</div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
                      Every finished-good item has a quantity of 0, so there is no stock value to analyse. Sales history was imported without
                      production runs or stock-in entries, so quantities never went up. Record production runs or stock adjustments and this
                      view fills in.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMoveViewPick('sales')}
                      className="mt-3 text-[11px] font-bold text-rowan-red hover:text-rowan-navy"
                    >
                      See sales by movement instead →
                    </button>
                  </div>
                ) : (
                  <>
                    <DonutChart
                      centerLabel="FG stock"
                      centerValue={lkrC(stock.fgValue)}
                      slices={(['fast', 'medium', 'slow', 'none'] as Movement[]).map((k) => ({
                        label: `${MOVE_META[k].label} · ${movers.countBy[k]} item${movers.countBy[k] === 1 ? '' : 's'}`,
                        value: movers.valueBy[k],
                        color: MOVE_META[k].color,
                      }))}
                    />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                        Cash tied up in items not selling
                      </div>
                      <HBars
                        items={movers.notSelling}
                        format={lkrC}
                        color={CHART_COLORS.red}
                        emptyText="Every item in stock has sold recently."
                      />
                    </div>
                  </>
                )
              ) : movers.rows.length === 0 ? (
                <div className="text-[12px] text-gray-400 py-10 text-center">No finished goods sold in the last {win} days.</div>
              ) : (
                <>
                  <DonutChart
                    centerLabel="Revenue"
                    centerValue={lkrC(movers.rows.reduce((sum, r) => sum + r.revenue, 0))}
                    slices={(['fast', 'medium', 'slow'] as Movement[]).map((k) => ({
                      label: `${MOVE_META[k].label} · ${movers.soldCount[k]} item${movers.soldCount[k] === 1 ? '' : 's'}`,
                      value: movers.salesBy[k],
                      color: MOVE_META[k].color,
                    }))}
                  />
                  <p className="mt-4 pt-4 border-t border-gray-100 text-[11px] leading-relaxed text-gray-500">
                    Based on units × unit price from invoice lines, so it can differ slightly from invoice totals (discounts, tax).
                  </p>
                  {stock.fgValue <= 0 && (
                    <p className="mt-2 text-[11px] leading-relaxed text-amber-700">
                      The <b>Stock</b> view is empty because every finished-good quantity is 0 in the system — sales were imported without
                      production runs or stock-in entries.
                    </p>
                  )}
                </>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            <Card title="Inventory value mix" subtitle="Raw materials vs finished goods">
              <DonutChart
                centerLabel="Total"
                centerValue={lkrC(stock.total)}
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
                ranked
                items={stock.fgByCategory.slice(0, 7)}
                format={lkrC}
                color={CHART_COLORS.red}
                emptyText="No finished-goods stock recorded — every quantity is 0."
              />
            </Card>

            <Card
              title="Raw materials by type"
              subtitle="Stock value, grouped by cost classification"
              action={{ href: '/stock', label: 'Stock' }}
            >
              <DonutChart
                size={140}
                centerLabel="Materials"
                centerValue={lkrC(stock.rmValue)}
                slices={stock.rmByClass.map((g, i) => ({ label: g.label, value: g.value, color: PALETTE[i % PALETTE.length] }))}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card title="Top finished goods" subtitle="Highest stock value">
              <HBars ranked items={stock.topFg} format={lkrC} emptyText="No finished-goods stock recorded — every quantity is 0." />
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
