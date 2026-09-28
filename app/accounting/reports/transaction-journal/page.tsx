'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type TJRow = {
  entry_id: string;
  entry_number: string;
  entry_date: string;
  memo: string | null;
  reference: string | null;
  source_type: string;
  created_by_name: string | null;
  line_no: number;
  account_code: string;
  account_name: string;
  line_description: string | null;
  debit: number;
  credit: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Period = { key: string; label: string; start: string; end: string };
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
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
type PeriodMode = 'month' | 'custom';

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

export default function TransactionJournalPage() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [mode, setMode] = useState<PeriodMode>('month');
  const [preparedBy, setPreparedBy] = useState('');
  const [period, setPeriod] = useState<Period>(monthOptions[0]);
  const [customStart, setCustomStart] = useState(monthOptions[0].start);
  const [customEnd, setCustomEnd] = useState(monthOptions[0].end);

  const start = mode === 'custom' ? customStart : period.start;
  const end = mode === 'custom' ? customEnd : period.end;
  const periodLabel = mode === 'custom' ? `${fmtDate(start)} to ${fmtDate(end)}` : period.label;

  const [rows, setRows] = useState<TJRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.resolve(supabase.rpc('get_transaction_journal', { p_start: start, p_end: end }))
      .then((res) => {
        if (res.error) setError(res.error.message);
        setRows((res.data ?? []) as TJRow[]);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load report data from Supabase.');
        setRows([]);
        setLoading(false);
      });
  }, [start, end]);

  const entries = useMemo(() => {
    const map = new Map<string, TJRow[]>();
    for (const r of rows) {
      if (!map.has(r.entry_id)) map.set(r.entry_id, []);
      map.get(r.entry_id)!.push(r);
    }
    return Array.from(map.values());
  }, [rows]);

  const grandDebit = rows.reduce((s, r) => s + Number(r.debit), 0);
  const grandCredit = rows.reduce((s, r) => s + Number(r.credit), 0);

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

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">Transaction Journal</h2>

          <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">View by</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="month">Month</option>
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
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">Month</label>
                <select
                  value={period.key}
                  onChange={(e) => {
                    const p = monthOptions.find((o) => o.key === e.target.value);
                    if (p) setPeriod(p);
                  }}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[160px]"
                >
                  {monthOptions.map((o) => (
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

          <PrintLetterhead title="Transaction Journal" periodText={periodLabel} preparedBy={preparedBy} />

          {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div>
              <h3 className="text-center font-bold text-rowan-navy text-sm mb-4 pb-2 border-b-2 border-rowan-navy">{periodLabel}</h3>
              {entries.length === 0 && <p className="text-center text-xs text-gray-400 italic py-8">No posted entries in this period.</p>}
              {entries.map((lines) => (
                <div key={lines[0].entry_id} className="mb-5 break-inside-avoid">
                  <div className="flex justify-between items-baseline text-xs mb-1">
                    <span className="font-bold text-rowan-navy">
                      {lines[0].entry_number} · {fmtDate(lines[0].entry_date)}
                    </span>
                    <span className="text-gray-400">
                      {lines[0].source_type}
                      {lines[0].created_by_name ? ` · ${lines[0].created_by_name}` : ''}
                    </span>
                  </div>
                  {lines[0].memo && <p className="text-[11px] text-gray-500 italic mb-1">{lines[0].memo}</p>}
                  <table className="w-full text-xs">
                    <tbody>
                      {lines.map((l, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="p-1 pl-2 text-gray-600">
                            {l.account_code} — {l.account_name}
                            {l.line_description && <span className="text-gray-400"> ({l.line_description})</span>}
                          </td>
                          <td className="p-1 text-right w-24">{Number(l.debit) ? fmt(Number(l.debit)) : ''}</td>
                          <td className="p-1 text-right w-24">{Number(l.credit) ? fmt(Number(l.credit)) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              {entries.length > 0 && (
                <div className="mt-4 pt-3 border-t-2 border-rowan-navy flex justify-end">
                  <table className="text-sm">
                    <tbody>
                      <tr className="font-bold">
                        <td className="p-2 pr-6 text-right text-gray-500">Total</td>
                        <td className="p-2 text-right w-24">{fmt(grandDebit)}</td>
                        <td className="p-2 text-right w-24">{fmt(grandCredit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
