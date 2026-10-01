'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// ------------------------------------------------------------------
// Shared building blocks for the Report Center reports:
//   <ReportFrame>      page chrome, print letterhead, Print / CSV buttons
//   usePeriod()        month / fiscal-year / custom-range picker
//   useAsOf()          single "as of" date picker
//   <DataTable>        navy-header table with totals row + CSV support
// Sri Lankan fiscal year = 1 Apr → 31 Mar, same as every other report.
// ------------------------------------------------------------------

export const fmt = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtQty = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 3 });

export const fmtDate = (d: string | null | undefined) => {
  if (!d) return '—';
  const date = new Date(d.length === 10 ? d + 'T00:00:00' : d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Local YYYY-MM-DD (toISOString would shift the day in UTC+5:30). */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoDate(new Date());

export type Period = { key: string; label: string; start: string; end: string };
export type PeriodMode = 'month' | 'year' | 'custom';

function buildMonthOptions(count = 24): Period[] {
  const out: Period[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    out.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      start: isoDate(start),
      end: isoDate(end),
    });
  }
  return out;
}

function buildFiscalYearOptions(count = 6): Period[] {
  const out: Period[] = [];
  const now = new Date();
  const currentFyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  for (let i = 0; i < count; i++) {
    const startYear = currentFyStartYear - i;
    out.push({
      key: `fy-${startYear}`,
      label: `FY ${startYear}/${String(startYear + 1).slice(2)}`,
      start: isoDate(new Date(startYear, 3, 1)),
      end: isoDate(new Date(startYear + 1, 2, 31)),
    });
  }
  return out;
}

const labelCls = 'block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide';
const inputCls = 'border border-gray-300 rounded px-2 py-1.5 text-sm';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold ${value === o.value ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Month / Fiscal Year / Custom Range picker. Returns the chosen range plus the controls to render. */
export function usePeriod(initial: PeriodMode = 'year') {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildFiscalYearOptions(), []);
  const [mode, setMode] = useState<PeriodMode>(initial);
  const options = mode === 'month' ? monthOptions : mode === 'year' ? yearOptions : [];
  const [period, setPeriod] = useState<Period>((initial === 'month' ? monthOptions : yearOptions)[0]);
  const [customStart, setCustomStart] = useState(yearOptions[0].start);
  const [customEnd, setCustomEnd] = useState(todayISO());

  useEffect(() => {
    if (mode === 'custom') return;
    setPeriod((mode === 'month' ? monthOptions : yearOptions)[0]);
  }, [mode, monthOptions, yearOptions]);

  const start = mode === 'custom' ? customStart : period.start;
  const end = mode === 'custom' ? customEnd : period.end;
  const label = mode === 'custom' ? `${fmtDate(start)} to ${fmtDate(end)}` : period.label;

  const controls = (
    <>
      <Field label="View by">
        <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className={inputCls}>
          <option value="month">Month</option>
          <option value="year">Fiscal Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </Field>
      {mode === 'custom' ? (
        <div className="flex gap-2">
          <Field label="Start">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className={inputCls} />
          </Field>
          <Field label="End">
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className={inputCls} />
          </Field>
        </div>
      ) : (
        <Field label={mode === 'month' ? 'Month' : 'Fiscal Year'}>
          <select
            value={period.key}
            onChange={(e) => {
              const p = options.find((o) => o.key === e.target.value);
              if (p) setPeriod(p);
            }}
            className={`${inputCls} min-w-[160px]`}
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );

  return { mode, start, end, label, controls };
}

/** Single "as of" date. */
export function useAsOf() {
  const [asOf, setAsOf] = useState(todayISO());
  const controls = (
    <Field label="As of">
      <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className={inputCls} />
    </Field>
  );
  return { asOf, label: `As of ${fmtDate(asOf)}`, controls };
}

// ------------------------------------------------------------------
// CSV
// ------------------------------------------------------------------
export type CsvCell = string | number | null | undefined;

export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const esc = (v: CsvCell) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n'); // BOM so Excel reads UTF-8
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------
// Frame
// ------------------------------------------------------------------
function PrintLetterhead({ title, periodText, preparedBy }: { title: string; periodText: string; preparedBy: string }) {
  return (
    <div className="hidden print:block mb-6">
      <div className="flex items-center justify-between">
        <RowanWordmark markSize={44} />
        <div className="text-right text-[10px] text-gray-500">
          <div>Printed {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          {preparedBy && <div>Prepared by {preparedBy}</div>}
        </div>
      </div>
      <div className="text-center mt-4 mb-1">
        <h2 className="text-lg font-black text-rowan-navy font-display uppercase tracking-widest">{title}</h2>
        <p className="text-xs text-gray-500">{periodText}</p>
      </div>
      <div className="w-full flex h-[3px] mt-3">
        <div className="w-2/3 bg-rowan-navy" />
        <div className="w-1/3 bg-rowan-red" />
      </div>
    </div>
  );
}

export function ReportFrame({
  title,
  printTitle,
  periodText,
  controls,
  getCsv,
  error,
  loading,
  maxWidth = 'max-w-5xl',
  notes,
  children,
}: {
  title: string;
  printTitle?: string;
  periodText: string;
  controls?: React.ReactNode;
  getCsv?: () => { filename: string; rows: CsvCell[][] } | null;
  error?: string | null;
  loading?: boolean;
  maxWidth?: string;
  /** Plain-language caveats shown under the report (and in print). */
  notes?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [preparedBy, setPreparedBy] = useState('');
  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className={`${maxWidth} mx-auto bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none`}>
        <BrandRibbon />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <RowanWordmark markSize={40} />
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">{title}</h2>

          <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
            {controls}
            <div className="ml-auto flex gap-2 items-end">
              <Field label="Prepared by">
                <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name" className={`${inputCls} w-36`} />
              </Field>
              {getCsv && (
                <button
                  type="button"
                  onClick={() => {
                    const c = getCsv();
                    if (c) downloadCsv(c.filename, c.rows);
                  }}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Export CSV
                </button>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg border border-rowan-navy text-rowan-navy font-bold text-sm hover:bg-gray-50"
              >
                Print / PDF
              </button>
            </div>
          </div>

          <PrintLetterhead title={printTitle ?? title} periodText={periodText} preparedBy={preparedBy} />

          {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            children
          )}

          {notes && !loading && <div className="mt-6 pt-4 border-t border-gray-200 text-[11px] leading-relaxed text-gray-500 space-y-1">{notes}</div>}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Table
// ------------------------------------------------------------------
export type Col<T> = {
  label: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Raw value — drives the CSV export, totals and (unless `format` is given) the cell text. */
  value: (r: T) => string | number | null | undefined;
  /** Optional display override for the cell. */
  format?: (r: T) => React.ReactNode;
  /** Sum this column in the footer. */
  sum?: boolean;
  /** How to display the footer total (defaults to money). */
  totalFormat?: (n: number) => React.ReactNode;
  hideInPrint?: boolean;
};

export const money = <T,>(label: string, value: (r: T) => number | null | undefined, opts: Partial<Col<T>> = {}): Col<T> => ({
  label,
  align: 'right',
  value: (r) => value(r) ?? 0,
  format: (r) => fmt(value(r) ?? 0),
  sum: true,
  ...opts,
});

export function tableCsv<T>(cols: Col<T>[], rows: T[], withTotals = true): CsvCell[][] {
  const out: CsvCell[][] = [cols.map((c) => c.label)];
  for (const r of rows) out.push(cols.map((c) => c.value(r) as CsvCell));
  if (withTotals && cols.some((c) => c.sum)) {
    out.push(
      cols.map((c, i) => (c.sum ? Math.round(rows.reduce((s, r) => s + Number(c.value(r) ?? 0), 0) * 100) / 100 : i === 0 ? 'Total' : ''))
    );
  }
  return out;
}

export function DataTable<T>({
  cols,
  rows,
  empty = 'Nothing to show for this period',
  rowKey,
  rowClass,
  showTotals = true,
}: {
  cols: Col<T>[];
  rows: T[];
  empty?: string;
  rowKey?: (r: T, i: number) => string;
  rowClass?: (r: T) => string;
  showTotals?: boolean;
}) {
  const alignCls = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left');
  const hasTotals = showTotals && rows.length > 0 && cols.some((c) => c.sum);
  const firstSum = cols.findIndex((c) => c.sum);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-rowan-navy text-white text-xs uppercase">
            {cols.map((c, i) => (
              <th key={i} className={`p-2 ${alignCls(c.align)} ${c.hideInPrint ? 'print:hidden' : ''}`} style={c.width ? { width: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={cols.length} className="p-6 text-center text-gray-400 italic text-xs">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r, ri) => (
            <tr key={rowKey ? rowKey(r, ri) : ri} className={`border-b border-gray-100 ${rowClass ? rowClass(r) : ''}`}>
              {cols.map((c, ci) => (
                <td key={ci} className={`p-2 text-gray-700 ${alignCls(c.align)} ${c.hideInPrint ? 'print:hidden' : ''}`}>
                  {c.format ? c.format(r) : (c.value(r) ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasTotals && (
          <tfoot>
            <tr className="border-t-2 border-rowan-navy font-bold">
              {cols.map((c, i) => {
                if (i === 0 && firstSum !== 0) return <td key={i} className="p-2 text-right" colSpan={firstSum}>Total</td>;
                if (i < firstSum) return null;
                if (!c.sum) return <td key={i} className="p-2" />;
                const total = rows.reduce((s, r) => s + Number(c.value(r) ?? 0), 0);
                return (
                  <td key={i} className={`p-2 ${alignCls(c.align)}`}>
                    {c.totalFormat ? c.totalFormat(total) : fmt(total)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// Small presentation helpers --------------------------------------------------

export function Chip({ tone, children }: { tone: 'green' | 'red' | 'amber' | 'gray' | 'blue'; children: React.ReactNode }) {
  const cls = {
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-rowan-red border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-500 border-gray-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{children}</span>;
}

export function StatRow({ items }: { items: { label: string; value: React.ReactNode; tone?: 'red' | 'green' | 'navy' }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-gray-200 px-3 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{it.label}</div>
          <div
            className={`text-lg font-black leading-tight mt-0.5 ${
              it.tone === 'red' ? 'text-rowan-red' : it.tone === 'green' ? 'text-green-700' : 'text-rowan-navy'
            }`}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mt-6 mb-2 first:mt-0">{children}</h3>;
}

/** Supabase returns an embedded to-one relation as an object, but typings/relationships sometimes make it an array — normalise. */
export function one<T>(x: T | T[] | null | undefined): T | null {
  if (!x) return null;
  return Array.isArray(x) ? (x[0] ?? null) : x;
}
