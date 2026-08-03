'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type PLRow = { account_type: string; subtype: string | null; account_code: string; account_name: string; amount: number };
type ProductionRunRow = { style_id: string; qty: number; material_cost: number; labor_cost: number; overhead_cost: number; total_cost: number; run_date: string };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Period generation — nothing below is hardcoded to a specific date. */
/* Every list is built off "today" at render time.                    */
/* ------------------------------------------------------------------ */

type Period = { key: string; label: string; start: string; end: string };

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Last N calendar months, most recent first. */
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

/** Last N Sri Lanka fiscal years (Apr 1 - Mar 31), most recent first. */
function buildFiscalYearOptions(count = 6): Period[] {
  const out: Period[] = [];
  const now = new Date();
  const currentFyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  for (let i = 0; i < count; i++) {
    const startYear = currentFyStartYear - i;
    const start = new Date(startYear, 3, 1);
    const end = new Date(startYear + 1, 2, 31);
    out.push({
      key: `fy-${startYear}`,
      label: `FY ${startYear}/${String(startYear + 1).slice(2)}`,
      start: isoDate(start),
      end: isoDate(end),
    });
  }
  return out;
}

type PeriodMode = 'month' | 'year' | 'custom';

function PeriodPicker({
  mode,
  options,
  value,
  onChange,
  customStart,
  customEnd,
  onCustomChange,
  asOfLabel,
}: {
  mode: PeriodMode;
  options: Period[];
  value: Period;
  onChange: (p: Period) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
  asOfLabel?: string;
}) {
  if (mode === 'custom') {
    return (
      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">
            {asOfLabel ? asOfLabel : 'Start'}
          </label>
          <input
            type="date"
            value={asOfLabel ? customEnd : customStart}
            onChange={(e) => onCustomChange(asOfLabel ? customStart : e.target.value, asOfLabel ? e.target.value : customEnd)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
        {!asOfLabel && (
          <div>
            <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">End</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => onCustomChange(customStart, e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">
        {mode === 'month' ? 'Month' : 'Fiscal Year'}
      </label>
      <select
        value={value.key}
        onChange={(e) => {
          const p = options.find((o) => o.key === e.target.value);
          if (p) onChange(p);
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
  );
}

/* ------------------------------------------------------------------ */
/* Print letterhead — shown only when printing.                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Profit & Loss                                                      */
/* ------------------------------------------------------------------ */

const COGS_SUBTYPES = ['Cost of Goods Sold'];
const PERIOD_SUBTYPES = ['Direct Labor', 'Direct Expenses', 'Manufacturing Overhead', 'Selling & Distribution', 'Administrative Expense', 'Finance Cost'];
// 'Direct Materials' is intentionally absent from both lists: materials now
// capitalize into Finished Goods Inventory at production and only reach P&L
// via COGS when sold (see migration 023). If it ever carries a balance
// (e.g. a manual adjusting JE), it surfaces under "Unclassified" below
// rather than silently vanishing.

type PLStatement = {
  productionRuns: ProductionRunRow[];
  productionMaterialCost: number;
  productionLaborCost: number;
  productionOverheadCost: number;
  productionUnits: number;
  cogsRows: PLRow[];
  costOfGoodsSold: number;
  revenue: PLRow[];
  totalRevenue: number;
  grossProfit: number;
  periodGroups: { subtype: string; rows: PLRow[]; subtotal: number }[];
  totalPeriodCosts: number;
  unclassified: PLRow[];
  unclassifiedTotal: number;
  netProfit: number;
};

function computePL(rows: PLRow[], productionRuns: ProductionRunRow[]): PLStatement {
  const revenue = rows.filter((r) => r.account_type === 'revenue');
  const expense = rows.filter((r) => r.account_type === 'expense');
  const totalRevenue = revenue.reduce((s, r) => s + Number(r.amount), 0);

  const cogsRows = expense.filter((r) => COGS_SUBTYPES.includes(r.subtype ?? ''));
  const costOfGoodsSold = cogsRows.reduce((s, r) => s + Number(r.amount), 0);
  const grossProfit = totalRevenue - costOfGoodsSold;

  const periodGroups = PERIOD_SUBTYPES.map((subtype) => ({
    subtype,
    rows: expense.filter((r) => r.subtype === subtype),
    subtotal: expense.filter((r) => r.subtype === subtype).reduce((s, r) => s + Number(r.amount), 0),
  }));
  const totalPeriodCosts = periodGroups.reduce((s, g) => s + g.subtotal, 0);

  const unclassified = expense.filter((r) => !COGS_SUBTYPES.includes(r.subtype ?? '') && !PERIOD_SUBTYPES.includes(r.subtype ?? ''));
  const unclassifiedTotal = unclassified.reduce((s, r) => s + Number(r.amount), 0);

  const netProfit = grossProfit - totalPeriodCosts - unclassifiedTotal;

  const productionMaterialCost = productionRuns.reduce((s, r) => s + Number(r.material_cost), 0);
  const productionLaborCost = productionRuns.reduce((s, r) => s + Number(r.labor_cost), 0);
  const productionOverheadCost = productionRuns.reduce((s, r) => s + Number(r.overhead_cost), 0);
  const productionUnits = productionRuns.reduce((s, r) => s + Number(r.qty), 0);

  return {
    productionRuns, productionMaterialCost, productionLaborCost, productionOverheadCost, productionUnits,
    cogsRows, costOfGoodsSold, revenue, totalRevenue, grossProfit,
    periodGroups, totalPeriodCosts, unclassified, unclassifiedTotal, netProfit,
  };
}

type PLSections = { manufacturing: boolean; trading: boolean; pl: boolean };

function PLTable({ stmt, periodLabel, sections }: { stmt: PLStatement; periodLabel: string; sections: PLSections }) {
  const noneSelected = !sections.manufacturing && !sections.trading && !sections.pl;
  return (
    <div>
      <h3 className="text-center font-bold text-rowan-navy text-sm mb-4 pb-2 border-b-2 border-rowan-navy">{periodLabel}</h3>

      {noneSelected && (
        <p className="text-center text-xs text-gray-400 italic py-8">Select at least one account above to view it here.</p>
      )}

      {sections.manufacturing && (
        <>
          <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2 mt-2">Manufacturing Summary</h4>
          <p className="text-[11px] text-gray-400 mb-2">
            Informational — what was produced this period. Doesn't drive Gross Profit directly (Cost of Goods Sold does,
            below) since units produced and units sold aren't always the same in a period.
          </p>
          <table className="w-full text-sm mb-6">
            <tbody>
              {stmt.productionRuns.length === 0 ? (
                <tr>
                  <td className="p-2 text-gray-400 italic text-xs" colSpan={2}>No production runs this period</td>
                </tr>
              ) : (
                <>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Units Produced</td>
                    <td className="p-2 text-right w-40">{stmt.productionUnits.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Direct Materials Consumed</td>
                    <td className="p-2 text-right w-40">{fmt(stmt.productionMaterialCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Direct Labor Absorbed</td>
                    <td className="p-2 text-right w-40">{fmt(stmt.productionLaborCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Manufacturing Overhead Absorbed</td>
                    <td className="p-2 text-right w-40">{fmt(stmt.productionOverheadCost)}</td>
                  </tr>
                </>
              )}
              <tr className="border-b-2 border-rowan-navy font-bold">
                <td className="p-2 text-right">Total Cost of Production</td>
                <td className="p-2 text-right w-40">{fmt(stmt.productionMaterialCost + stmt.productionLaborCost + stmt.productionOverheadCost)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {sections.trading && (
        <>
          <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Trading Account</h4>
          <table className="w-full text-sm mb-6">
            <tbody>
              <tr className="bg-gray-100">
                <td colSpan={2} className="p-2 font-bold text-rowan-navy text-xs uppercase">
                  Revenue
                </td>
              </tr>
              {stmt.revenue.map((r) => (
                <tr key={r.account_code} className="border-b border-gray-100">
                  <td className="p-2 pl-4 text-gray-600">{r.account_name}</td>
                  <td className="p-2 text-right w-40">{fmt(Number(r.amount))}</td>
                </tr>
              ))}
              <tr className="border-b border-gray-200 font-semibold text-xs">
                <td className="p-2 pl-4 text-right text-gray-500">Sales Revenue</td>
                <td className="p-2 text-right w-40">{fmt(stmt.totalRevenue)}</td>
              </tr>
              <tr className="border-b border-gray-200 font-semibold text-xs">
                <td className="p-2 pl-4 text-right text-gray-500">Less: Cost of Goods Sold</td>
                <td className="p-2 text-right w-40">({fmt(stmt.costOfGoodsSold)})</td>
              </tr>
              <tr className={`border-b-2 border-rowan-navy font-bold ${stmt.grossProfit >= 0 ? '' : 'text-rowan-red'}`}>
                <td className="p-2 text-right">Gross Profit</td>
                <td className="p-2 text-right w-40">{fmt(stmt.grossProfit)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {sections.pl && (
      <>
      <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Profit &amp; Loss Account</h4>
      <table className="w-full text-sm">
        <tbody>
          {!sections.trading && (
            <tr className="border-b border-gray-200 font-semibold text-xs">
              <td className="p-2 text-gray-500">Gross Profit brought forward</td>
              <td className="p-2 text-right w-40">{fmt(stmt.grossProfit)}</td>
            </tr>
          )}
          {stmt.periodGroups.map((g) => (
            <React.Fragment key={g.subtype}>
              <tr className="bg-gray-100">
                <td colSpan={2} className="p-2 font-bold text-rowan-navy text-xs uppercase">
                  {g.subtype}
                  {(g.subtype === 'Direct Labor' || g.subtype === 'Manufacturing Overhead') && (
                    <span className="block font-normal normal-case text-[10px] text-gray-400 mt-0.5">
                      Actual cost less amount absorbed into production — the period's variance, not the full cost
                    </span>
                  )}
                </td>
              </tr>
              {g.rows.length === 0 ? (
                <tr>
                  <td className="p-2 pl-4 text-gray-400 italic text-xs" colSpan={2}>
                    No transactions this period
                  </td>
                </tr>
              ) : (
                g.rows.map((r) => (
                  <tr key={r.account_code} className="border-b border-gray-100">
                    <td className="p-2 pl-4 text-gray-600">{r.account_name}</td>
                    <td className="p-2 text-right w-40">{fmt(Number(r.amount))}</td>
                  </tr>
                ))
              )}
              <tr className="border-b border-gray-200 font-semibold text-xs">
                <td className="p-2 pl-4 text-right text-gray-500">Subtotal — {g.subtype}</td>
                <td className="p-2 text-right w-40">{fmt(g.subtotal)}</td>
              </tr>
            </React.Fragment>
          ))}

          {stmt.unclassified.length > 0 && (
            <>
              <tr className="bg-amber-50">
                <td colSpan={2} className="p-2 font-bold text-amber-800 text-xs uppercase">
                  Unclassified (needs review)
                </td>
              </tr>
              {stmt.unclassified.map((r) => (
                <tr key={r.account_code} className="border-b border-gray-100">
                  <td className="p-2 pl-4 text-gray-600">{r.account_name}</td>
                  <td className="p-2 text-right w-40">{fmt(Number(r.amount))}</td>
                </tr>
              ))}
            </>
          )}

          <tr className="border-b-2 border-rowan-navy font-bold">
            <td className="p-2 text-right">Total Operating Expenses</td>
            <td className="p-2 text-right w-40">({fmt(stmt.totalPeriodCosts + stmt.unclassifiedTotal)})</td>
          </tr>
          <tr className={`font-bold text-base ${stmt.netProfit >= 0 ? 'text-green-700' : 'text-rowan-red'}`}>
            <td className="p-2 text-right">Net Profit / (Loss)</td>
            <td className="p-2 text-right w-40">{fmt(stmt.netProfit)}</td>
          </tr>
        </tbody>
      </table>
      </>
      )}
    </div>
  );
}

function ProfitAndLoss() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildFiscalYearOptions(), []);

  const [mode, setMode] = useState<PeriodMode>('year');
  const [compare, setCompare] = useState(false);
  const [preparedBy, setPreparedBy] = useState('');
  const [sections, setSections] = useState<PLSections>({ manufacturing: true, trading: true, pl: true });
  const toggleSection = (key: keyof PLSections) => setSections((s) => ({ ...s, [key]: !s[key] }));

  const options = mode === 'month' ? monthOptions : mode === 'year' ? yearOptions : [];

  const [periodA, setPeriodA] = useState<Period>(yearOptions[0]);
  const [periodB, setPeriodB] = useState<Period>(yearOptions[1] ?? yearOptions[0]);
  const [customAStart, setCustomAStart] = useState(yearOptions[0].start);
  const [customAEnd, setCustomAEnd] = useState(yearOptions[0].end);
  const [customBStart, setCustomBStart] = useState(yearOptions[1]?.start ?? yearOptions[0].start);
  const [customBEnd, setCustomBEnd] = useState(yearOptions[1]?.end ?? yearOptions[0].end);

  useEffect(() => {
    if (mode === 'custom') return;
    const opts = mode === 'month' ? monthOptions : yearOptions;
    setPeriodA(opts[0]);
    setPeriodB(opts[1] ?? opts[0]);
  }, [mode, monthOptions, yearOptions]);

  const effectiveA: Period = mode === 'custom' ? { key: 'custom-a', label: 'Custom Range', start: customAStart, end: customAEnd } : periodA;
  const effectiveB: Period = mode === 'custom' ? { key: 'custom-b', label: 'Custom Range', start: customBStart, end: customBEnd } : periodB;

  const [rowsA, setRowsA] = useState<PLRow[]>([]);
  const [rowsB, setRowsB] = useState<PLRow[]>([]);
  const [runsA, setRunsA] = useState<ProductionRunRow[]>([]);
  const [runsB, setRunsB] = useState<ProductionRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const calls = [
      supabase.rpc('get_pl', { p_start: effectiveA.start, p_end: effectiveA.end }),
      supabase.from('production_runs').select('style_id, qty, material_cost, labor_cost, overhead_cost, total_cost, run_date')
        .gte('run_date', effectiveA.start).lte('run_date', effectiveA.end),
    ];
    if (compare) {
      calls.push(supabase.rpc('get_pl', { p_start: effectiveB.start, p_end: effectiveB.end }));
      calls.push(supabase.from('production_runs').select('style_id, qty, material_cost, labor_cost, overhead_cost, total_cost, run_date')
        .gte('run_date', effectiveB.start).lte('run_date', effectiveB.end));
    }
    Promise.all(calls).then((results) => {
      const [resA, runsResA, resB, runsResB] = results;
      if (resA.error) setError(resA.error.message);
      setRowsA((resA.data ?? []) as PLRow[]);
      setRunsA((runsResA.data ?? []) as ProductionRunRow[]);
      if (compare && resB) {
        if (resB.error) setError(resB.error.message);
        setRowsB((resB.data ?? []) as PLRow[]);
        setRunsB((runsResB?.data ?? []) as ProductionRunRow[]);
      }
      setLoading(false);
    });
  }, [effectiveA.start, effectiveA.end, effectiveB.start, effectiveB.end, compare]);

  const stmtA = useMemo(() => computePL(rowsA, runsA), [rowsA, runsA]);
  const stmtB = useMemo(() => computePL(rowsB, runsB), [rowsB, runsB]);

  const periodText = compare
    ? `${effectiveA.label} vs ${effectiveB.label}`
    : `For the period ${fmtDate(effectiveA.start)} to ${fmtDate(effectiveA.end)}`;

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">View by</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="month">Month</option>
            <option value="year">Fiscal Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <PeriodPicker mode={mode} options={options} value={periodA} onChange={setPeriodA} customStart={customAStart} customEnd={customAEnd} onCustomChange={(s, e) => { setCustomAStart(s); setCustomAEnd(e); }} />

        {compare && (
          <>
            <span className="text-gray-400 font-bold pb-2">vs</span>
            <PeriodPicker mode={mode} options={options} value={periodB} onChange={setPeriodB} customStart={customBStart} customEnd={customBEnd} onCustomChange={(s, e) => { setCustomBStart(s); setCustomBEnd(e); }} />
          </>
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2 cursor-pointer">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          Compare periods
        </label>

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

      <div className="flex gap-4 items-center mb-6 print:hidden text-xs bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
        <span className="font-bold text-gray-500 uppercase tracking-wide text-[10px]">Show accounts</span>
        <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
          <input type="checkbox" checked={sections.manufacturing} onChange={() => toggleSection('manufacturing')} />
          Manufacturing
        </label>
        <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
          <input type="checkbox" checked={sections.trading} onChange={() => toggleSection('trading')} />
          Trading
        </label>
        <label className="flex items-center gap-1.5 font-semibold text-gray-700 cursor-pointer">
          <input type="checkbox" checked={sections.pl} onChange={() => toggleSection('pl')} />
          Profit &amp; Loss
        </label>
      </div>

      <PrintLetterhead title="Profit &amp; Loss Statement" periodText={periodText} preparedBy={preparedBy} />

      {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : compare ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8">
            <PLTable stmt={stmtA} periodLabel={effectiveA.label} sections={sections} />
            <PLTable stmt={stmtB} periodLabel={effectiveB.label} sections={sections} />
          </div>
          <div className="mt-6 border-t-2 border-rowan-navy pt-3 flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr className="font-bold">
                  <td className="p-2 pr-6 text-right text-gray-500">Net Profit Variance</td>
                  <td className={`p-2 text-right w-40 ${stmtA.netProfit - stmtB.netProfit >= 0 ? 'text-green-700' : 'text-rowan-red'}`}>
                    {fmt(stmtA.netProfit - stmtB.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <PLTable stmt={stmtA} periodLabel={effectiveA.label} sections={sections} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Balance Sheet                                                      */
/* ------------------------------------------------------------------ */

type BSStatement = { assets: PLRow[]; liabilities: PLRow[]; equity: PLRow[]; totalAssets: number; totalLiabilities: number; totalEquity: number; diff: number };

function computeBS(rows: PLRow[]): BSStatement {
  const assets = rows.filter((r) => r.account_type === 'asset');
  const liabilities = rows.filter((r) => r.account_type === 'liability');
  const equity = rows.filter((r) => r.account_type === 'equity');
  const totalAssets = assets.reduce((s, r) => s + Number(r.amount), 0);
  const totalLiabilities = liabilities.reduce((s, r) => s + Number(r.amount), 0);
  const totalEquity = equity.reduce((s, r) => s + Number(r.amount), 0);
  const diff = +(totalAssets - (totalLiabilities + totalEquity)).toFixed(2);
  return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, diff };
}

function BSSection({ title, items, total }: { title: string; items: PLRow[]; total: number }) {
  return (
    <>
      <tr className="bg-gray-100">
        <td colSpan={2} className="p-2 font-bold text-rowan-navy">
          {title}
        </td>
      </tr>
      {items.map((r) => (
        <tr key={r.account_code} className="border-b border-gray-100">
          <td className="p-2 pl-4 text-gray-600">{r.account_name}</td>
          <td className="p-2 text-right">{fmt(Number(r.amount))}</td>
        </tr>
      ))}
      <tr className="border-b-2 border-rowan-navy font-bold">
        <td className="p-2 text-right">Total {title}</td>
        <td className="p-2 text-right">{fmt(total)}</td>
      </tr>
    </>
  );
}

function BSTable({ stmt, periodLabel }: { stmt: BSStatement; periodLabel: string }) {
  return (
    <div>
      <h3 className="text-center font-bold text-rowan-navy text-sm mb-4 pb-2 border-b-2 border-rowan-navy">{periodLabel}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-rowan-navy text-white text-xs uppercase">
            <th className="p-2 text-left">Account</th>
            <th className="p-2 text-right w-40">Amount</th>
          </tr>
        </thead>
        <tbody>
          <BSSection title="Assets" items={stmt.assets} total={stmt.totalAssets} />
          <BSSection title="Liabilities" items={stmt.liabilities} total={stmt.totalLiabilities} />
          <BSSection title="Equity" items={stmt.equity} total={stmt.totalEquity} />
          <tr className="font-bold text-base">
            <td className="p-2 text-right">Total Liabilities + Equity</td>
            <td className="p-2 text-right">{fmt(stmt.totalLiabilities + stmt.totalEquity)}</td>
          </tr>
        </tbody>
      </table>
      <div className={`mt-4 text-sm font-bold text-right ${stmt.diff === 0 ? 'text-green-700' : 'text-rowan-red'}`}>
        {stmt.diff === 0 ? 'Balanced ✓' : `Out of balance by ${fmt(Math.abs(stmt.diff))}`}
      </div>
    </div>
  );
}

function BalanceSheet() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const yearOptions = useMemo(() => buildFiscalYearOptions(), []);

  const [mode, setMode] = useState<PeriodMode>('year');
  const [compare, setCompare] = useState(false);
  const [preparedBy, setPreparedBy] = useState('');

  const options = mode === 'month' ? monthOptions : mode === 'year' ? yearOptions : [];

  const [periodA, setPeriodA] = useState<Period>(yearOptions[0]);
  const [periodB, setPeriodB] = useState<Period>(yearOptions[1] ?? yearOptions[0]);
  const [customAsOfA, setCustomAsOfA] = useState(new Date().toISOString().slice(0, 10));
  const [customAsOfB, setCustomAsOfB] = useState(yearOptions[1]?.end ?? yearOptions[0].end);

  useEffect(() => {
    if (mode === 'custom') return;
    const opts = mode === 'month' ? monthOptions : yearOptions;
    setPeriodA(opts[0]);
    setPeriodB(opts[1] ?? opts[0]);
  }, [mode, monthOptions, yearOptions]);

  const asOfA = mode === 'custom' ? customAsOfA : periodA.end;
  const asOfB = mode === 'custom' ? customAsOfB : periodB.end;
  const labelA = mode === 'custom' ? `As at ${fmtDate(asOfA)}` : `As at end of ${periodA.label}`;
  const labelB = mode === 'custom' ? `As at ${fmtDate(asOfB)}` : `As at end of ${periodB.label}`;

  const [rowsA, setRowsA] = useState<PLRow[]>([]);
  const [rowsB, setRowsB] = useState<PLRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const calls = [supabase.rpc('get_balance_sheet', { p_as_of: asOfA })];
    if (compare) calls.push(supabase.rpc('get_balance_sheet', { p_as_of: asOfB }));
    Promise.all(calls).then((results) => {
      const [resA, resB] = results;
      if (resA.error) setError(resA.error.message);
      setRowsA((resA.data ?? []) as PLRow[]);
      if (compare && resB) {
        if (resB.error) setError(resB.error.message);
        setRowsB((resB.data ?? []) as PLRow[]);
      }
      setLoading(false);
    });
  }, [asOfA, asOfB, compare]);

  const stmtA = useMemo(() => computeBS(rowsA), [rowsA]);
  const stmtB = useMemo(() => computeBS(rowsB), [rowsB]);

  const periodText = compare ? `${labelA} vs ${labelB}` : labelA;

  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end mb-4 print:hidden text-sm">
        <div>
          <label className="block text-gray-500 text-[10px] font-bold mb-1 uppercase tracking-wide">View by</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as PeriodMode)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="month">Month end</option>
            <option value="year">Fiscal year end</option>
            <option value="custom">Custom date</option>
          </select>
        </div>

        <PeriodPicker mode={mode} options={options} value={periodA} onChange={setPeriodA} customStart={customAsOfA} customEnd={customAsOfA} onCustomChange={(_, e) => setCustomAsOfA(e)} asOfLabel="As of" />

        {compare && (
          <>
            <span className="text-gray-400 font-bold pb-2">vs</span>
            <PeriodPicker mode={mode} options={options} value={periodB} onChange={setPeriodB} customStart={customAsOfB} customEnd={customAsOfB} onCustomChange={(_, e) => setCustomAsOfB(e)} asOfLabel="As of" />
          </>
        )}

        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2 cursor-pointer">
          <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} />
          Compare periods
        </label>

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

      <PrintLetterhead title="Statement of Financial Position" periodText={periodText} preparedBy={preparedBy} />

      {error && <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : compare ? (
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8">
          <BSTable stmt={stmtA} periodLabel={labelA} />
          <BSTable stmt={stmtB} periodLabel={labelB} />
        </div>
      ) : (
        <BSTable stmt={stmtA} periodLabel={labelA} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page shell                                                         */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const [tab, setTab] = useState<'pl' | 'bs'>('pl');

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none print:rounded-none">
        <BrandRibbon />
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <RowanWordmark markSize={40} />
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
              ← Dashboard
            </Link>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-4 print:hidden">Reports</h2>

          <div className="flex gap-2 mb-6 print:hidden">
            <button
              onClick={() => setTab('pl')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'pl' ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Profit &amp; Loss
            </button>
            <button
              onClick={() => setTab('bs')}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'bs' ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Balance Sheet
            </button>
          </div>

          {tab === 'pl' ? <ProfitAndLoss /> : <BalanceSheet />}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
