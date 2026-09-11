'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { DrillDownModal, DrillDownTarget } from '@/components/DrillDownModal';

type TBRow = {
  account_type: string;
  subtype: string | null;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TYPE_LABEL: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};
const TYPE_ORDER = ['asset', 'liability', 'equity', 'revenue', 'expense'];

function DrillAmount({ amount, onClick }: { amount: number; onClick?: () => void }) {
  if (!amount) return <>{fmt(0)}</>;
  if (!onClick) return <>{fmt(amount)}</>;
  return (
    <button onClick={onClick} className="hover:underline hover:text-rowan-red decoration-dotted underline-offset-2" title="View underlying transactions">
      {fmt(amount)}
    </button>
  );
}

/* Period helpers, same shape as app/accounting/reports/page.tsx so the two pages feel identical */
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

export default function TrialBalancePage() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildFiscalYearOptions(), []);

  const [mode, setMode] = useState<PeriodMode>('month');
  const [preparedBy, setPreparedBy] = useState('');
  const [drillTarget, setDrillTarget] = useState<DrillDownTarget | null>(null);

  const options = mode === 'month' ? monthOptions : mode === 'year' ? yearOptions : [];
  const [period, setPeriod] = useState<Period>(monthOptions[0]);
  const [customAsOf, setCustomAsOf] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (mode === 'custom') return;
    const opts = mode === 'month' ? monthOptions : yearOptions;
    setPeriod(opts[0]);
  }, [mode, monthOptions, yearOptions]);

  const asOf = mode === 'custom' ? customAsOf : period.end;
  const periodLabel = mode === 'custom' ? `As at ${fmtDate(asOf)}` : `As at end of ${period.label}`;

  const [rows, setRows] = useState<TBRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.resolve(supabase.rpc('get_trial_balance', { p_as_of: asOf }))
      .then((res) => {
        if (res.error) setError(res.error.message);
        setRows((res.data ?? []) as TBRow[]);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err?.message ?? 'Failed to load report data from Supabase.');
        setRows([]);
        setLoading(false);
      });
  }, [asOf]);

  const totalDebit = rows.reduce((s, r) => s + Number(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + Number(r.credit), 0);
  const diff = Math.round((totalDebit - totalCredit) * 100) / 100;

  const grouped = TYPE_ORDER.map((t) => ({ type: t, rows: rows.filter((r) => r.account_type === t) })).filter((g) => g.rows.length > 0);

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

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">Trial Balance</h2>

          <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
            <div>
              <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">View by</label>
              <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="month">Month end</option>
                <option value="year">Fiscal year end</option>
                <option value="custom">Custom date</option>
              </select>
            </div>

            {mode === 'custom' ? (
              <div>
                <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">As of</label>
                <input type="date" value={customAsOf} onChange={(e) => setCustomAsOf(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
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

          <PrintLetterhead title="Trial Balance" periodText={periodLabel} preparedBy={preparedBy} />

          {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}

          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div>
              <h3 className="text-center font-bold text-rowan-navy text-sm mb-4 pb-2 border-b-2 border-rowan-navy">{periodLabel}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-rowan-navy text-white text-xs uppercase">
                    <th className="p-2 text-left">Account</th>
                    <th className="p-2 text-right w-36">Debit</th>
                    <th className="p-2 text-right w-36">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-gray-400 italic text-xs">
                        No posted activity as of this date
                      </td>
                    </tr>
                  )}
                  {grouped.map((g) => (
                    <React.Fragment key={g.type}>
                      <tr className="bg-gray-100">
                        <td colSpan={3} className="p-2 font-bold text-rowan-navy text-xs uppercase">
                          {TYPE_LABEL[g.type] ?? g.type}
                        </td>
                      </tr>
                      {g.rows.map((r) => (
                        <tr key={r.account_code} className="border-b border-gray-100">
                          <td className="p-2 pl-4 text-gray-600">{r.account_name}</td>
                          <td className="p-2 text-right">
                            <DrillAmount
                              amount={Number(r.debit)}
                              onClick={
                                Number(r.debit)
                                  ? () => setDrillTarget({ label: r.account_name, accountCodes: [r.account_code], polarity: 'debit', start: '1900-01-01', end: asOf })
                                  : undefined
                              }
                            />
                          </td>
                          <td className="p-2 text-right">
                            <DrillAmount
                              amount={Number(r.credit)}
                              onClick={
                                Number(r.credit)
                                  ? () => setDrillTarget({ label: r.account_name, accountCodes: [r.account_code], polarity: 'credit', start: '1900-01-01', end: asOf })
                                  : undefined
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-rowan-navy font-bold text-base">
                    <td className="p-2 text-right">Total</td>
                    <td className="p-2 text-right">{fmt(totalDebit)}</td>
                    <td className="p-2 text-right">{fmt(totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
              <div className={`mt-4 text-sm font-bold text-right ${diff === 0 ? 'text-green-700' : 'text-rowan-red'}`}>
                {diff === 0 ? 'Balanced ✓' : `Out of balance by ${fmt(Math.abs(diff))}`}
              </div>
            </div>
          )}
        </div>
        <BrandRibbon />
      </div>

      <DrillDownModal target={drillTarget} onClose={() => setDrillTarget(null)} />
    </div>
  );
}
