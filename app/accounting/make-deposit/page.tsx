'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { AccountModal, Account } from '@/components/AccountModal';
import {
  DepositLineDraft,
  DepositRow,
  listRecentDeposits,
  makeDeposit,
  nextDepositNumberPreview,
  setBankAccountFlag,
  voidDeposit,
} from '@/lib/bank';

type Line = { key: string; account_id: string; received_from: string; description: string; amount: string };

const currentUser = { id: 'demo-user', name: 'Dinindu' };

const emptyLine = (): Line => ({ key: crypto.randomUUID(), account_id: '', received_from: '', description: '', amount: '' });

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MakeDepositPage() {
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [bankAccount, setBankAccount] = useState<Account | null>(null);
  const [creditAccounts, setCreditAccounts] = useState<Account[]>([]);
  const [accountSeed, setAccountSeed] = useState('');
  const [showAccountModal, setShowAccountModal] = useState<{ target: 'line' | 'bank'; lineKey?: string } | null>(null);

  const [depositDate, setDepositDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewNumber, setPreviewNumber] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [recent, setRecent] = useState<DepositRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('is_active', true)
      .eq('is_bank_account', true)
      .order('code')
      .then(({ data }) => setBankAccounts((data as Account[]) ?? []));
    supabase
      .from('chart_of_accounts')
      .select('id, code, name, type, subtype')
      .eq('is_active', true)
      .in('type', ['revenue', 'liability', 'equity', 'asset'])
      .order('code')
      .then(({ data }) => setCreditAccounts((data as Account[]) ?? []));
    fetchPreviewNumber();
    loadRecent();
  }, []);

  async function fetchPreviewNumber() {
    setPreviewNumber(await nextDepositNumberPreview());
  }

  async function loadRecent() {
    setRecentLoading(true);
    setRecent(await listRecentDeposits());
    setRecentLoading(false);
  }

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  const total = useMemo(() => lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [lines]);

  function handleAccountCreated(account: Account) {
    if (showAccountModal?.target === 'bank') {
      setBankAccountFlag(account.id, true).catch(() => {});
      setBankAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
      setBankAccount(account);
    } else {
      setCreditAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
      if (showAccountModal?.lineKey) updateLine(showAccountModal.lineKey, { account_id: account.id });
    }
    setShowAccountModal(null);
  }

  function resetForm() {
    setBankAccount(null);
    setDepositDate(new Date().toISOString().slice(0, 10));
    setMemo('');
    setLines([emptyLine()]);
    setError(null);
    fetchPreviewNumber();
  }

  async function handleSubmit() {
    setError(null);
    if (!bankAccount) return setError('Select a bank account to deposit into.');
    const validLines = lines.filter((l) => l.account_id && (parseFloat(l.amount) || 0) > 0);
    if (validLines.length === 0) return setError('Add at least one line with a category and amount.');

    setSaving(true);
    try {
      const draft: DepositLineDraft[] = validLines.map((l) => ({
        account_id: l.account_id,
        received_from: l.received_from || null,
        description: l.description || null,
        amount: parseFloat(l.amount),
      }));
      const number = await makeDeposit({
        depositDate,
        bankAccountId: bankAccount.id,
        memo: memo || null,
        createdByName: currentUser.name,
        lines: draft,
      });
      setSuccessNote(`${number} recorded and posted to the ledger.`);
      resetForm();
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to record deposit.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(depositId: string) {
    setVoidingId(depositId);
    try {
      await voidDeposit(depositId);
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to void deposit.');
    } finally {
      setVoidingId(null);
    }
  }

  const bankAccountOptions: ComboOption[] = useMemo(() => bankAccounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code })), [bankAccounts]);
  const creditAccountOptions: ComboOption[] = useMemo(
    () =>
      [...creditAccounts]
        .sort((a, b) => (a.subtype ?? '').localeCompare(b.subtype ?? '') || a.code.localeCompare(b.code))
        .map((a) => ({ id: a.id, label: a.name, sublabel: a.subtype ?? a.code })),
    [creditAccounts]
  );

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Make Deposit" />

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
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Make Deposit</h2>
              <p className="text-[10px] font-mono text-gray-400 mt-1">{previewNumber ? `${previewNumber} (next)` : ''}</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mb-4">
            For bank credits that aren't a customer invoice payment — capital contributions, refunds, interest, misc. income. Customer payments belong on
            Receive Payment instead.
          </p>

          {successNote && <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">{successNote}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deposit To *</label>
              <ComboBox
                options={bankAccountOptions}
                value={bankAccount ? { id: bankAccount.id, label: bankAccount.name, sublabel: bankAccount.code } : null}
                placeholder="Select a bank account…"
                onSelect={(opt) => setBankAccount(opt ? bankAccounts.find((a) => a.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setAccountSeed(text);
                  setShowAccountModal({ target: 'bank' });
                }}
                createLabel="Add new bank account"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deposit Date</label>
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <table className="w-full text-xs mb-2 border-collapse">
            <thead>
              <tr className="bg-rowan-navy text-white text-left">
                <th className="p-2 w-56">Received From</th>
                <th className="p-2 w-56">Account</th>
                <th className="p-2">Description</th>
                <th className="p-2 w-32 text-right">Amount</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className="border-b border-gray-200">
                  <td className="p-1">
                    <input
                      value={line.received_from}
                      onChange={(e) => updateLine(line.key, { received_from: e.target.value })}
                      className="w-full border border-gray-300 rounded px-1 py-1"
                      placeholder="Who / what from"
                    />
                  </td>
                  <td className="p-1">
                    <ComboBox
                      options={creditAccountOptions}
                      value={
                        line.account_id
                          ? (() => {
                              const a = creditAccounts.find((x) => x.id === line.account_id);
                              return a ? { id: a.id, label: a.name, sublabel: a.code } : null;
                            })()
                          : null
                      }
                      placeholder="Select account…"
                      onSelect={(opt) => updateLine(line.key, { account_id: opt?.id ?? '' })}
                      onCreateNew={(text) => {
                        setAccountSeed(text);
                        setShowAccountModal({ target: 'line', lineKey: line.key });
                      }}
                      createLabel="Add new account"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={line.description}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      className="w-full border border-gray-300 rounded px-1 py-1"
                      placeholder="Memo"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => updateLine(line.key, { amount: e.target.value })}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <button onClick={() => removeLine(line.key)} className="text-gray-400 hover:text-rowan-red" title="Remove line">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={addLine} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6">
            + Add line
          </button>

          <div className="flex justify-end mb-6">
            <table className="text-xs w-64">
              <tbody>
                <tr className="bg-rowan-bg">
                  <td className="p-2 text-right font-black text-rowan-navy">Total Deposit:</td>
                  <td className="p-2 text-right font-black text-rowan-navy text-base">{fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Memo (optional)</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
          </div>

          <div className="flex justify-end">
            <button
              disabled={saving}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" />}
              Save Deposit
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-3">Recent Deposits</h3>
            {recentLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
            ) : recent.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No deposits recorded yet.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Number</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Bank Account</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-mono">{r.deposit_number}</td>
                      <td className="p-2">{new Date(r.deposit_date).toLocaleDateString()}</td>
                      <td className="p-2">{r.chart_of_accounts?.name ?? '—'}</td>
                      <td className="p-2 text-right font-bold">{fmt(r.total_amount)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'void' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {r.status === 'posted' && (
                          <button disabled={voidingId === r.id} onClick={() => handleVoid(r.id)} className="text-rowan-red font-bold hover:underline disabled:opacity-50">
                            Void
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

      {showAccountModal && (
        <AccountModal
          seedName={accountSeed}
          existing={showAccountModal.target === 'bank' ? bankAccounts : creditAccounts}
          onClose={() => setShowAccountModal(null)}
          onCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
