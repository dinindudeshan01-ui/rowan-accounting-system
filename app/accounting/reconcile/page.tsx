'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { Account } from '@/components/AccountModal';
import {
  ReconciliationRow,
  UnclearedLine,
  completeReconciliation,
  fetchUnclearedLines,
  listRecentReconciliations,
  reopenReconciliation,
} from '@/lib/bank';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReconcilePage() {
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [bankAccount, setBankAccount] = useState<Account | null>(null);

  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [beginningBalance, setBeginningBalance] = useState('0.00');
  const [endingBalance, setEndingBalance] = useState('');

  const [lines, setLines] = useState<UnclearedLine[]>([]);
  const [linesLoading, setLinesLoading] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [recent, setRecent] = useState<ReconciliationRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('is_bank_account', true)
      .order('code')
      .then(({ data }) => setBankAccounts((data as Account[]) ?? []));
    loadRecent();
  }, []);

  useEffect(() => {
    if (!bankAccount) {
      setLines([]);
      setChecked({});
      return;
    }
    reload();
  }, [bankAccount, statementDate]);

  async function reload() {
    if (!bankAccount) return;
    setLinesLoading(true);
    try {
      const rows = await fetchUnclearedLines(bankAccount.id, statementDate);
      setLines(rows);
      setChecked({});
    } finally {
      setLinesLoading(false);
    }
  }

  async function loadRecent() {
    setRecentLoading(true);
    setRecent(await listRecentReconciliations());
    setRecentLoading(false);
  }

  function toggle(lineId: string) {
    setChecked((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  }

  const clearedMovement = useMemo(
    () => lines.filter((l) => checked[l.line_id]).reduce((s, l) => s + (l.debit - l.credit), 0),
    [lines, checked]
  );
  const beginningNum = parseFloat(beginningBalance) || 0;
  const endingNum = parseFloat(endingBalance) || 0;
  const clearedBalance = beginningNum + clearedMovement;
  const difference = +(endingNum - clearedBalance).toFixed(2);

  async function handleFinish() {
    setError(null);
    if (!bankAccount) return setError('Select a bank account.');
    if (!endingBalance) return setError('Enter the statement ending balance.');
    const clearedIds = Object.entries(checked).filter(([, v]) => v).map(([id]) => id);
    if (clearedIds.length === 0) return setError('Tick at least one transaction that cleared on the statement.');
    if (difference !== 0) return setError(`Off by ${fmt(Math.abs(difference))} — tick/untick items until the difference is 0.00.`);

    setSaving(true);
    try {
      await completeReconciliation({
        bankAccountId: bankAccount.id,
        statementDate,
        beginningBalance: beginningNum,
        endingBalance: endingNum,
        clearedLineIds: clearedIds,
        createdByName: currentUser.name,
      });
      setSuccessNote(`Reconciliation for ${statementDate} completed — balanced to ${fmt(endingNum)}.`);
      setBeginningBalance(endingBalance);
      setEndingBalance('');
      reload();
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to complete reconciliation.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReopen(id: string) {
    setReopeningId(id);
    try {
      await reopenReconciliation(id);
      loadRecent();
      if (bankAccount) reload();
    } catch (e: any) {
      setError(e.message ?? 'Failed to reopen reconciliation.');
    } finally {
      setReopeningId(null);
    }
  }

  const bankAccountOptions: ComboOption[] = useMemo(() => bankAccounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code })), [bankAccounts]);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Reconcile" />

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
              <div className="flex items-center gap-2 mt-1">
                <RowanWordmark />
              </div>
            </div>
            <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Reconcile</h2>
          </div>

          {successNote && <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">{successNote}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bank Account *</label>
              <ComboBox
                options={bankAccountOptions}
                value={bankAccount ? { id: bankAccount.id, label: bankAccount.name, sublabel: bankAccount.code } : null}
                placeholder="Select a bank account…"
                onSelect={(opt) => setBankAccount(opt ? bankAccounts.find((a) => a.id === opt.id) ?? null : null)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Statement Date</label>
              <input type="date" value={statementDate} onChange={(e) => setStatementDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Beginning Balance</label>
              <input
                type="number"
                step="0.01"
                value={beginningBalance}
                onChange={(e) => setBeginningBalance(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Statement Ending Balance</label>
              <input
                type="number"
                step="0.01"
                value={endingBalance}
                onChange={(e) => setEndingBalance(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Difference</label>
              <div className={`w-full border rounded px-2 py-1.5 text-right font-bold ${difference === 0 ? 'border-green-300 text-green-700 bg-green-50' : 'border-rowan-red text-rowan-red bg-red-50'}`}>
                {fmt(difference)}
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Uncleared Transactions (tick what's on the statement)</h3>
          {!bankAccount ? (
            <p className="text-xs text-gray-400 py-4">Select a bank account to see uncleared transactions.</p>
          ) : linesLoading ? (
            <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
          ) : lines.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No uncleared transactions on or before this date.</p>
          ) : (
            <table className="w-full text-xs mb-2 border-collapse">
              <thead>
                <tr className="bg-rowan-navy text-white text-left">
                  <th className="p-2 w-8"></th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Entry #</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 w-28 text-right">Debit</th>
                  <th className="p-2 w-28 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.line_id} className={`border-b border-gray-200 cursor-pointer ${checked[l.line_id] ? 'bg-rowan-bg' : ''}`} onClick={() => toggle(l.line_id)}>
                    <td className="p-2 text-center">
                      <input type="checkbox" checked={!!checked[l.line_id]} onChange={() => toggle(l.line_id)} onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td className="p-2">{new Date(l.entry_date).toLocaleDateString()}</td>
                    <td className="p-2 font-mono">{l.entry_number}</td>
                    <td className="p-2">{l.description ?? '—'}</td>
                    <td className="p-2 text-right">{l.debit > 0 ? fmt(l.debit) : ''}</td>
                    <td className="p-2 text-right">{l.credit > 0 ? fmt(l.credit) : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-rowan-bg">
                  <td className="p-2 font-bold text-rowan-navy" colSpan={4}>Cleared Balance</td>
                  <td className="p-2 text-right font-bold text-rowan-navy" colSpan={2}>{fmt(clearedBalance)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          <div className="flex justify-end mt-6">
            <button
              disabled={saving || !bankAccount || lines.length === 0}
              onClick={handleFinish}
              className="px-6 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" />}
              Finish Reconciliation
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-3">Past Reconciliations</h3>
            {recentLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
            ) : recent.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No reconciliations completed yet.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Bank Account</th>
                    <th className="p-2">Statement Date</th>
                    <th className="p-2 text-right">Ending Balance</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2">{r.chart_of_accounts?.name ?? '—'}</td>
                      <td className="p-2">{new Date(r.statement_date).toLocaleDateString()}</td>
                      <td className="p-2 text-right font-bold">{fmt(r.statement_ending_balance)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'reopened' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {r.status === 'completed' && (
                          <button disabled={reopeningId === r.id} onClick={() => handleReopen(r.id)} className="text-rowan-red font-bold hover:underline disabled:opacity-50">
                            Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
