'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type Row = {
  group_key: string;
  item_code: string;
  item_name: string;
  qty_sold: number;
  revenue: number;
  avg_price: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Period = { key: string; label: string; start: string; end: string };
function buildMonthOptions(count = 24): Period[] {
  const out: Period[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const y = now.getFullYear();
    const m = now.getMonth() - i;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    out.push({ key: `${start.getFullYear()}-${start.getMonth()}`, label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), start: isoDate(start), end: isoDate(end) });
  }
  return out;
}
function buildFiscalYearOptions(count = 6): Period[] {
  const out: Period[] = [];
  const now = new Date();
  const currentFyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  for (let i = 0; i < count; i++) {
    const startYear = currentFyStartYear - i;
    const start = new Date(startYear, 3, 1);
    const end = new Date(startYear + 1, 2, 31);
    out.push({ key: `fy-${startYear}`, label: `FY ${startYear}/${String(startYear + 1).slice(2)}`, start: isoDate(start), end: isoDate(end) });
  }
  return out;
}
type PeriodMode = 'month' | 'year' | 'custom';

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

export default function SalesByItemPage() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildFiscalYearOptions(), []);
  const [mode, setMode] = useState<PeriodMode>('year');
  const [preparedBy, setPreparedBy] = useState('');

  const options = mode === 'month' ? monthOptions : mode === 'year' ? yearOptions : [];
  const [period, setPeriod] = useState<Period>(yearOptions[0]);
  const [customStart, setCustomStart] = useState(yearOptions[0].start);
  const [customEnd, setCustomEnd] = useState(yearOptions[0].end);

  useEffect(() => {
    if (mode === 'custom') return;
    setPeriod((mode === 'month' ? monthOptions : yearOptions)[0]);
  }, [mode, monthOptions, yearOptions]);

  const start = mode === 'custom' ? customStart : period.start;
  const end = mode === 'custom' ? customEnd : period.end;
  const periodLabel = mode === 'custom' ? `${fmtDate(start)} to ${fmtDate(end)}` : period.label;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.resolve(supabase.rpc('get_sales_by_item', { p_start: start, p_end: end }))
      .then((res) => {
        if (res.error) setError(res.error.message);
        setRows((res.data ?? []) as Row[]);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load report data from Supabase.');
        setRows([]);
        setLoading(false);
      });
  }, [start, end]);

  const grandRevenue = rows.reduce((s, r) => s + Number(r.revenue), 0);
  const grandQty = rows.reduce((s, r) => s + Number(r.qty_sold), 0);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        <BrandRibbon />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <RowanWordmark markSize={40} />
            <Link href="/accounting/reports/center" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
              ← Report Center
            </Link>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">Sales by Item</h2>

          <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">View by</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="month">Month</option>
                <option value="year">Fiscal Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {mode === 'custom' ? (
              <div className="flex gap-2">
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">Start</label>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">End</label>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">{mode === 'month' ? 'Month' : 'Fiscal Year'}</label>
                <select
                  value={period.key}
                  onChange={(e) => {
                    const p = options.find((o) => o.key === e.target.value);
                    if (p) setPeriod(p);
                  }}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[160px]"
                >
                  {options.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ml-auto flex gap-2 items-end">
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">Prepared by</label>
                <input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} placeholder="Your name" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-36" />
              </div>
              <button onClick={() => window.print()} className="px-4 py-2 rounded-lg border border-rowan-navy text-rowan-navy font-bold text-sm hover:bg-gray-50">
                Print / PDF
              </button>
            </div>
          </div>

          <PrintLetterhead title="Sales by Item" periodText={periodLabel} preparedBy={preparedBy} />

          {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rowan-navy text-white text-xs uppercase">
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-right w-20">Qty Sold</th>
                  <th className="p-2 text-right w-24">Avg Price</th>
                  <th className="p-2 text-right w-32">Revenue</th>
                  <th className="p-2 text-right w-20">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-400 italic text-xs">
                      No sales in this period
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.group_key} className="border-b border-gray-100">
                    <td className="p-2 text-gray-500">{r.item_code}</td>
                    <td className="p-2 text-gray-700 font-medium">{r.item_name}</td>
                    <td className="p-2 text-right">{Number(r.qty_sold).toLocaleString()}</td>
                    <td className="p-2 text-right">{fmt(Number(r.avg_price))}</td>
                    <td className="p-2 text-right font-semibold">{fmt(Number(r.revenue))}</td>
                    <td className="p-2 text-right text-gray-400">{grandRevenue ? ((Number(r.revenue) / grandRevenue) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-rowan-navy font-bold">
                    <td className="p-2 text-right" colSpan={2}>
                      Total
                    </td>
                    <td className="p-2 text-right">{grandQty.toLocaleString()}</td>
                    <td className="p-2"></td>
                    <td className="p-2 text-right">{fmt(grandRevenue)}</td>
                    <td className="p-2 text-right">100.0%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
