'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type APRow = {
  vendor_id: string;
  vendor_name: string;
  expense_number: string;
  expense_date: string;
  effective_due_date: string;
  open_amount: number;
  days_overdue: number;
  bucket: string;
};

const BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'] as const;

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

export default function APAgingPage() {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [preparedBy, setPreparedBy] = useState('');
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [rows, setRows] = useState<APRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.resolve(supabase.rpc('get_ap_aging', { p_as_of: asOf }))
      .then((res) => {
        if (res.error) setError(res.error.message);
        setRows((res.data ?? []) as APRow[]);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load report data from Supabase.');
        setRows([]);
        setLoading(false);
      });
  }, [asOf]);

  const summary = useMemo(() => {
    const map = new Map<string, { name: string; buckets: Record<string, number>; total: number }>();
    for (const r of rows) {
      if (!map.has(r.vendor_id)) {
        map.set(r.vendor_id, { name: r.vendor_name, buckets: Object.fromEntries(BUCKETS.map((b) => [b, 0])), total: 0 });
      }
      const entry = map.get(r.vendor_id)!;
      entry.buckets[r.bucket] += Number(r.open_amount);
      entry.total += Number(r.open_amount);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const columnTotals = useMemo(() => {
    const totals = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<string, number>;
    let grand = 0;
    for (const s of summary) {
      for (const b of BUCKETS) totals[b] += s.buckets[b];
      grand += s.total;
    }
    return { totals, grand };
  }, [summary]);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        <BrandRibbon />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <RowanWordmark markSize={40} />
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">A/P Aging</h2>

          <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">As of</label>
              <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>

            <div className="flex gap-2">
              <button onClick={() => setView('summary')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${view === 'summary' ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}>
                Summary
              </button>
              <button onClick={() => setView('detail')} className={`px-3 py-1.5 rounded-md text-xs font-bold ${view === 'detail' ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}>
                Detail
              </button>
            </div>

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

          <PrintLetterhead title={`A/P Aging ${view === 'summary' ? 'Summary' : 'Detail'}`} periodText={`As of ${fmtDate(asOf)}`} preparedBy={preparedBy} />

          {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : view === 'summary' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rowan-navy text-white text-xs uppercase">
                  <th className="p-2 text-left">Vendor</th>
                  {BUCKETS.map((b) => (
                    <th key={b} className="p-2 text-right w-24">
                      {b}
                    </th>
                  ))}
                  <th className="p-2 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400 italic text-xs">
                      No open bills as of this date
                    </td>
                  </tr>
                )}
                {summary.map((s) => (
                  <tr key={s.name} className="border-b border-gray-100">
                    <td className="p-2 text-gray-700 font-medium">{s.name}</td>
                    {BUCKETS.map((b) => (
                      <td key={b} className="p-2 text-right">
                        {s.buckets[b] ? fmt(s.buckets[b]) : ''}
                      </td>
                    ))}
                    <td className="p-2 text-right font-semibold">{fmt(s.total)}</td>
                  </tr>
                ))}
              </tbody>
              {summary.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-rowan-navy font-bold">
                    <td className="p-2 text-right">Total</td>
                    {BUCKETS.map((b) => (
                      <td key={b} className="p-2 text-right">
                        {fmt(columnTotals.totals[b])}
                      </td>
                    ))}
                    <td className="p-2 text-right">{fmt(columnTotals.grand)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rowan-navy text-white text-xs uppercase">
                  <th className="p-2 text-left">Vendor</th>
                  <th className="p-2 text-left">Bill #</th>
                  <th className="p-2 text-left">Bill Date</th>
                  <th className="p-2 text-left">Due Date</th>
                  <th className="p-2 text-right w-20">Days Overdue</th>
                  <th className="p-2 text-left w-20">Bucket</th>
                  <th className="p-2 text-right w-28">Open Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-400 italic text-xs">
                      No open bills as of this date
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-2 text-gray-700">{r.vendor_name}</td>
                    <td className="p-2 text-gray-600">{r.expense_number}</td>
                    <td className="p-2 text-gray-600">{fmtDate(r.expense_date)}</td>
                    <td className="p-2 text-gray-600">{fmtDate(r.effective_due_date)}</td>
                    <td className="p-2 text-right">{r.days_overdue}</td>
                    <td className="p-2">{r.bucket}</td>
                    <td className="p-2 text-right font-semibold">{fmt(Number(r.open_amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
