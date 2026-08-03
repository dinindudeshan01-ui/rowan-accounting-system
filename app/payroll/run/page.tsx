'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  PayrollPeriod, PayrollEntry, PayrollEntryLine, DeductionType,
  listPayrollPeriods, createPayrollPeriod, listPayrollEntries, listPayrollEntryLines,
  runPayrollPeriod, updatePayrollEntry, recomputePayrollEntry,
  addPayrollEntryLine, removePayrollEntryLine,
  finalizePayrollPeriod, reopenPayrollPeriod, postPayrollPeriod,
  listDeductionTypes,
  fmt, MONTH_NAMES,
} from '@/lib/payroll';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

type EntryRow = PayrollEntry & { employees: { name: string; employee_no: string } | null; departments: { name: string } | null };

export default function PayrollRunPage() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<PayrollPeriod | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);

  async function loadPeriods() {
    const p = await listPayrollPeriods();
    setPeriods(p);
    return p;
  }

  async function loadEntries(periodId: string) {
    setEntries(await listPayrollEntries(periodId));
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await loadPeriods();
        setDeductionTypes(await listDeductionTypes());
        if (p.length > 0) {
          setActivePeriod(p[0]);
          await loadEntries(p[0].id);
        }
      } catch (e: any) { setError(e.message ?? 'Failed to load payroll.'); }
      finally { setLoading(false); }
    })();
  }, []);

  function flash(msg: string) { setNote(msg); setTimeout(() => setNote(null), 2500); }

  async function selectPeriod(p: PayrollPeriod) {
    setActivePeriod(p);
    setExpanded(null);
    setBusy(true);
    try { await loadEntries(p.id); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function handleCreatePeriod() {
    const label = `${MONTH_NAMES[newMonth - 1]} ${newYear}`;
    setBusy(true);
    try {
      const p = await createPayrollPeriod(newYear, newMonth, label);
      await loadPeriods();
      await selectPeriod(p);
      flash(`Created ${label}.`);
    } catch (e: any) { setError(e.message ?? 'Failed to create period. It may already exist.'); }
    finally { setBusy(false); }
  }

  async function handleRun() {
    if (!activePeriod) return;
    setBusy(true);
    try {
      const count = await runPayrollPeriod(activePeriod.id);
      await loadEntries(activePeriod.id);
      flash(`Generated payslips for ${count} active employee(s).`);
    } catch (e: any) { setError(e.message ?? 'Failed to run payroll.'); }
    finally { setBusy(false); }
  }

  async function handleFieldChange(entryId: string, patch: { no_pay_days?: number; ot_hours?: number }) {
    setBusy(true);
    try {
      await updatePayrollEntry(entryId, patch);
      await recomputePayrollEntry(entryId);
      if (activePeriod) await loadEntries(activePeriod.id);
    } catch (e: any) { setError(e.message ?? 'Failed to recompute.'); }
    finally { setBusy(false); }
  }

  async function handleFinalize() {
    if (!activePeriod) return;
    if (!confirm(`Finalize ${activePeriod.label}? Payslips can't be edited after this (you can still reopen before posting).`)) return;
    setBusy(true);
    try {
      await finalizePayrollPeriod(activePeriod.id);
      const p = await loadPeriods();
      const updated = p.find((x) => x.id === activePeriod.id)!;
      setActivePeriod(updated);
      flash('Period finalized.');
    } catch (e: any) { setError(e.message ?? 'Failed to finalize.'); }
    finally { setBusy(false); }
  }

  async function handleReopen() {
    if (!activePeriod) return;
    setBusy(true);
    try {
      await reopenPayrollPeriod(activePeriod.id);
      const p = await loadPeriods();
      setActivePeriod(p.find((x) => x.id === activePeriod.id)!);
      flash('Reopened for editing.');
    } catch (e: any) { setError(e.message ?? 'Failed to reopen.'); }
    finally { setBusy(false); }
  }

  async function handlePost() {
    if (!activePeriod) return;
    if (!confirm(`Post ${activePeriod.label} to the general ledger? This creates a permanent journal entry.`)) return;
    setBusy(true);
    try {
      await postPayrollPeriod(activePeriod.id, currentUser.name);
      const p = await loadPeriods();
      setActivePeriod(p.find((x) => x.id === activePeriod.id)!);
      flash('Posted to the ledger.');
    } catch (e: any) { setError(e.message ?? 'Failed to post.'); }
    finally { setBusy(false); }
  }

  const totals = entries.reduce(
    (acc, e) => ({
      gross: acc.gross + e.gross_earnings, net: acc.net + e.net_pay, ctc: acc.ctc + e.ctc,
      epf_ee: acc.epf_ee + e.epf_employee, epf_er: acc.epf_er + e.epf_employer, etf: acc.etf + e.etf_employer, apit: acc.apit + e.apit_amount,
    }),
    { gross: 0, net: 0, ctc: 0, epf_ee: 0, epf_er: 0, etf: 0, apit: 0 }
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-rowan-bg"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Payroll Run" />
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
              <div className="flex items-center gap-2 mt-1"><RowanWordmark /></div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Payroll Run</h2>
              <Link href="/payroll/setup" className="text-[10px] font-bold text-gray-400 hover:text-rowan-red">Payroll Setup →</Link>
            </div>
          </div>

          {note && <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">{note}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">{error}</div>}

          <div className="flex gap-6">
            {/* ---------- period sidebar ---------- */}
            <div className="w-48 shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Periods</p>
              <div className="space-y-1 mb-4">
                {periods.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPeriod(p)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs font-bold flex items-center justify-between ${
                      activePeriod?.id === p.id ? 'bg-rowan-navy text-white' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase ${
                      p.status === 'posted' ? 'bg-green-100 text-green-800' : p.status === 'finalized' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'
                    } ${activePeriod?.id === p.id ? 'opacity-90' : ''}`}>
                      {p.status}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">New period</p>
                <div className="flex gap-1 mb-2">
                  <select value={newMonth} onChange={(e) => setNewMonth(parseInt(e.target.value))} className="border border-gray-300 rounded px-1 py-1 text-xs flex-1">
                    {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" value={newYear} onChange={(e) => setNewYear(parseInt(e.target.value))} className="border border-gray-300 rounded px-1 py-1 text-xs w-16" />
                </div>
                <button onClick={handleCreatePeriod} disabled={busy} className="w-full px-2 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red disabled:opacity-50">
                  + Create period
                </button>
              </div>
            </div>

            {/* ---------- main panel ---------- */}
            <div className="flex-1 min-w-0">
              {!activePeriod ? (
                <p className="text-sm text-gray-400 py-12 text-center">Create a payroll period to get started.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-rowan-navy">{activePeriod.label}</h3>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{activePeriod.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {activePeriod.status === 'draft' && (
                        <>
                          <button onClick={handleRun} disabled={busy} className="px-3 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red disabled:opacity-50 inline-flex items-center gap-1">
                            {busy && <LoadingSpinner size="sm" />} Run Payroll
                          </button>
                          {entries.length > 0 && (
                            <button onClick={handleFinalize} disabled={busy} className="px-3 py-1.5 rounded border border-rowan-navy text-rowan-navy text-xs font-bold hover:bg-rowan-bg disabled:opacity-50">
                              Finalize
                            </button>
                          )}
                        </>
                      )}
                      {activePeriod.status === 'finalized' && (
                        <>
                          <button onClick={handleReopen} disabled={busy} className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-50">
                            Reopen
                          </button>
                          <button onClick={handlePost} disabled={busy} className="px-3 py-1.5 rounded bg-rowan-red text-white text-xs font-bold hover:opacity-90 disabled:opacity-50">
                            Post to Ledger
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {entries.length === 0 ? (
                    <p className="text-sm text-gray-400 py-12 text-center">
                      No payslips yet. Click <strong>Run Payroll</strong> to pull in every active employee&apos;s basic
                      salary, allowances, and deductions.
                    </p>
                  ) : (
                    <>
                      <table className="w-full text-xs mb-4">
                        <thead>
                          <tr className="bg-rowan-navy text-white text-left">
                            <th className="p-2">Employee</th><th className="p-2">Dept</th>
                            <th className="p-2 text-right">Basic</th>
                            <th className="p-2 text-right w-20">No-pay days</th>
                            <th className="p-2 text-right w-20">OT hrs</th>
                            <th className="p-2 text-right">Gross</th>
                            <th className="p-2 text-right">EPF (ee)</th>
                            <th className="p-2 text-right">APIT</th>
                            <th className="p-2 text-right">Net Pay</th>
                            <th className="p-2 text-right">CTC</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((e) => (
                            <React.Fragment key={e.id}>
                              <tr className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-2 font-bold text-rowan-navy">{e.employees?.name}<div className="text-[9px] text-gray-400 font-mono">{e.employees?.employee_no}</div></td>
                                <td className="p-2">{e.departments?.name ?? <span className="text-rowan-red">unassigned</span>}</td>
                                <td className="p-2 text-right">{fmt(e.basic_salary)}</td>
                                <td className="p-2 text-right">
                                  <input
                                    type="number" defaultValue={e.no_pay_days} disabled={activePeriod.status !== 'draft'}
                                    onBlur={(ev) => { const v = parseFloat(ev.target.value) || 0; if (v !== e.no_pay_days) handleFieldChange(e.id, { no_pay_days: v }); }}
                                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-right disabled:bg-gray-50"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <input
                                    type="number" defaultValue={e.ot_hours} disabled={activePeriod.status !== 'draft'}
                                    onBlur={(ev) => { const v = parseFloat(ev.target.value) || 0; if (v !== e.ot_hours) handleFieldChange(e.id, { ot_hours: v }); }}
                                    className="w-16 border border-gray-200 rounded px-1 py-0.5 text-right disabled:bg-gray-50"
                                  />
                                </td>
                                <td className="p-2 text-right font-bold">{fmt(e.gross_earnings)}</td>
                                <td className="p-2 text-right">{fmt(e.epf_employee)}</td>
                                <td className="p-2 text-right">{fmt(e.apit_amount)}</td>
                                <td className="p-2 text-right font-bold text-rowan-navy">{fmt(e.net_pay)}</td>
                                <td className="p-2 text-right font-bold text-rowan-red">{fmt(e.ctc)}</td>
                                <td className="p-2 text-right">
                                  <button onClick={() => setExpanded(expanded === e.id ? null : e.id)} className="text-rowan-navy font-bold hover:text-rowan-red">
                                    {expanded === e.id ? 'Close' : 'Details'}
                                  </button>
                                </td>
                              </tr>
                              {expanded === e.id && (
                                <tr>
                                  <td colSpan={11} className="p-3 bg-rowan-bg">
                                    <EntryLinesEditor
                                      entry={e}
                                      deductionTypes={deductionTypes}
                                      locked={activePeriod.status !== 'draft'}
                                      onChanged={() => loadEntries(activePeriod.id)}
                                      onError={setError}
                                    />
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-rowan-bg font-bold">
                            <td className="p-2" colSpan={5}>Totals</td>
                            <td className="p-2 text-right">{fmt(totals.gross)}</td>
                            <td className="p-2 text-right">{fmt(totals.epf_ee)}</td>
                            <td className="p-2 text-right">{fmt(totals.apit)}</td>
                            <td className="p-2 text-right text-rowan-navy">{fmt(totals.net)}</td>
                            <td className="p-2 text-right text-rowan-red">{fmt(totals.ctc)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="text-[10px] text-gray-400">
                        <strong>CTC</strong> (gross + employer EPF + employer ETF) is the true cost to the business —
                        that&apos;s the figure the labour costing engine will use, not Net Pay.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}

function EntryLinesEditor({ entry, deductionTypes, locked, onChanged, onError }: {
  entry: PayrollEntry; deductionTypes: DeductionType[]; locked: boolean; onChanged: () => void; onError: (e: string) => void;
}) {
  const [lines, setLines] = useState<PayrollEntryLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [dedTypeId, setDedTypeId] = useState('');
  const [dedAmount, setDedAmount] = useState('');

  async function load() { setLines(await listPayrollEntryLines(entry.id)); setLoaded(true); }
  useEffect(() => { load(); }, [entry.id]);

  async function addAdhocDeduction() {
    const dt = deductionTypes.find((d) => d.id === dedTypeId);
    if (!dt || !dedAmount) return;
    try {
      await addPayrollEntryLine({ payroll_entry_id: entry.id, line_type: 'deduction', name: dt.name, amount: parseFloat(dedAmount) || 0, account_id: dt.account_id });
      setShowAddDeduction(false); setDedTypeId(''); setDedAmount('');
      await load(); onChanged();
    } catch (e: any) { onError(e.message ?? 'Failed to add line.'); }
  }

  async function remove(lineId: string) {
    try { await removePayrollEntryLine(lineId, entry.id); await load(); onChanged(); }
    catch (e: any) { onError(e.message ?? 'Failed to remove line.'); }
  }

  if (!loaded) return <LoadingSpinner size="sm" />;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Allowances</p>
        {lines.filter((l) => l.line_type === 'allowance').map((l) => (
          <div key={l.id} className="flex justify-between text-xs py-0.5">
            <span>{l.name} {l.is_epf_qualifying ? <span className="text-[9px] text-gray-400">(EPF)</span> : null}</span>
            <span className="font-bold">{fmt(l.amount)}</span>
          </div>
        ))}
        {lines.filter((l) => l.line_type === 'allowance').length === 0 && <p className="text-xs text-gray-400">None this period.</p>}
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs flex justify-between"><span>OT ({entry.ot_hours} hrs)</span><span className="font-bold">{fmt(entry.ot_amount)}</span></div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Deductions</p>
        {lines.filter((l) => l.line_type === 'deduction').map((l) => (
          <div key={l.id} className="flex justify-between items-center text-xs py-0.5">
            <span>{l.name}</span>
            <span className="flex items-center gap-2">
              <span className="font-bold">{fmt(l.amount)}</span>
              {!locked && <button onClick={() => remove(l.id)} className="text-gray-400 hover:text-rowan-red">✕</button>}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
          <div className="flex justify-between"><span>EPF (employee share)</span><span className="font-bold">{fmt(entry.epf_employee)}</span></div>
          <div className="flex justify-between"><span>APIT</span><span className="font-bold">{fmt(entry.apit_amount)}</span></div>
        </div>
        {!locked && (
          showAddDeduction ? (
            <div className="mt-2 flex gap-1 items-center">
              <select value={dedTypeId} onChange={(e) => setDedTypeId(e.target.value)} className="border border-gray-300 rounded px-1 py-1 text-xs flex-1">
                <option value="">Type…</option>
                {deductionTypes.filter((d) => !d.is_statutory).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <input type="number" value={dedAmount} onChange={(e) => setDedAmount(e.target.value)} placeholder="Amt" className="border border-gray-300 rounded px-1 py-1 text-xs w-20" />
              <button onClick={addAdhocDeduction} className="text-xs font-bold text-rowan-navy hover:text-rowan-red">Add</button>
            </div>
          ) : (
            <button onClick={() => setShowAddDeduction(true)} className="mt-2 text-xs font-bold text-rowan-navy hover:text-rowan-red">+ Add one-off deduction</button>
          )
        )}
      </div>
    </div>
  );
}
