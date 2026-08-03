'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PartyModal } from '@/components/PartyModal';
import { AccountModal, Account } from '@/components/AccountModal';
import { Party, PartyDraft, createParty } from '@/lib/parties';

type ExpenseLine = {
  key: string;
  account_id: string;
  description: string;
  amount: string;
};

type ExpenseRow = {
  id: string;
  expense_number: string;
  expense_date: string;
  payment_type: 'paid_now' | 'bill';
  total_amount: number;
  status: 'posted' | 'void';
  vendors: { display_name: string } | null;
};

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

const currentUser = { id: 'demo-user', name: 'Dinindu' };

const emptyLine = (): ExpenseLine => ({ key: crypto.randomUUID(), account_id: '', description: '', amount: '' });

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RecordExpensePage() {
  const [vendors, setVendors] = useState<Party[]>([]);
  const [vendor, setVendor] = useState<Party | null>(null);
  const [vendorSeed, setVendorSeed] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [paidFromAccount, setPaidFromAccount] = useState<Account | null>(null);
  const [accountSeed, setAccountSeed] = useState('');
  const [showAccountModal, setShowAccountModal] = useState<{ target: 'line' | 'paidFrom'; lineKey?: string } | null>(null);

  const [paymentType, setPaymentType] = useState<'paid_now' | 'bill'>('paid_now');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<ExpenseLine[]>([emptyLine()]);
  const [previewNumber, setPreviewNumber] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [recent, setRecent] = useState<ExpenseRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('vendors').select('*').eq('is_active', true).order('display_name').then(({ data }) => {
      setVendors((data as Party[]) ?? []);
    });
    supabase
      .from('chart_of_accounts')
      .select('id, code, name, type, subtype')
      .eq('is_active', true)
      .eq('type', 'expense')
      .order('code')
      .then(({ data }) => setExpenseAccounts((data as Account[]) ?? []));
    supabase
      .from('chart_of_accounts')
      .select('id, code, name, type, subtype')
      .eq('is_active', true)
      .eq('type', 'asset')
      .order('code')
      .then(({ data }) => setCashAccounts((data as Account[]) ?? []));
    fetchPreviewNumber();
    loadRecent();
  }, []);

  async function fetchPreviewNumber() {
    const { data } = await supabase.rpc('next_expense_number_preview');
    if (typeof data === 'string') setPreviewNumber(data);
  }

  async function loadRecent() {
    setRecentLoading(true);
    const { data } = await supabase
      .from('expenses')
      .select('id, expense_number, expense_date, payment_type, total_amount, status, vendors(display_name)')
      .order('created_at', { ascending: false })
      .limit(25);
    setRecent((data as any) ?? []);
    setRecentLoading(false);
  }

  function updateLine(key: string, patch: Partial<ExpenseLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  const total = useMemo(() => lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0), [lines]);

  async function handleCreateVendor(draft: PartyDraft) {
    const created = await createParty('vendor', { ...draft, display_name: draft.display_name || vendorSeed });
    setVendors((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    setVendor(created);
    setShowVendorModal(false);
  }

  function handleAccountCreated(account: Account) {
    if (account.type === 'expense') {
      setExpenseAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
      if (showAccountModal?.target === 'line' && showAccountModal.lineKey) {
        updateLine(showAccountModal.lineKey, { account_id: account.id });
      }
    } else {
      setCashAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
      setPaidFromAccount(account);
    }
    setShowAccountModal(null);
  }

  function resetForm() {
    setVendor(null);
    setPaidFromAccount(null);
    setPaymentType('paid_now');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('cash');
    setReference('');
    setMemo('');
    setLines([emptyLine()]);
    setError(null);
    fetchPreviewNumber();
  }

  async function handleSubmit() {
    setError(null);
    if (!vendor) return setError('Select a vendor.');
    if (paymentType === 'paid_now' && !paidFromAccount) return setError('Select a Paid From account.');
    const validLines = lines.filter((l) => l.account_id && (parseFloat(l.amount) || 0) > 0);
    if (validLines.length === 0) return setError('Add at least one expense line with a category and amount.');

    setSaving(true);
    try {
      const { data: expenseNumber, error: rpcErr } = await supabase.rpc('record_expense', {
        p_vendor_id: vendor.id,
        p_expense_date: expenseDate,
        p_payment_type: paymentType,
        p_payment_method: paymentType === 'paid_now' ? paymentMethod : null,
        p_paid_from_account_id: paymentType === 'paid_now' ? paidFromAccount!.id : null,
        p_reference: reference || null,
        p_memo: memo || null,
        p_created_by_name: currentUser.name,
        p_lines: validLines.map((l) => ({ account_id: l.account_id, description: l.description || null, amount: parseFloat(l.amount) })),
      });
      if (rpcErr) throw rpcErr;

      setSuccessNote(
        paymentType === 'bill'
          ? `Recorded ${expenseNumber} as a bill owed to ${vendor.display_name}.`
          : `Recorded ${expenseNumber} and posted to the ledger.`
      );
      resetForm();
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to record expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(expenseId: string) {
    setVoidingId(expenseId);
    try {
      const { error: voidErr } = await supabase.rpc('void_expense', { p_expense_id: expenseId });
      if (voidErr) throw voidErr;
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to void expense.');
    } finally {
      setVoidingId(null);
    }
  }

  const vendorOptions: ComboOption[] = useMemo(
    () => vendors.map((v) => ({ id: v.id, label: v.display_name, sublabel: v.company_name ?? undefined })),
    [vendors]
  );
  const expenseAccountOptions: ComboOption[] = useMemo(
    () =>
      [...expenseAccounts]
        .sort((a, b) => (a.subtype ?? '').localeCompare(b.subtype ?? '') || a.code.localeCompare(b.code))
        .map((a) => ({ id: a.id, label: a.name, sublabel: a.subtype ?? a.code })),
    [expenseAccounts]
  );
  const cashAccountOptions: ComboOption[] = useMemo(
    () => cashAccounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code })),
    [cashAccounts]
  );

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Record Expense" />

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
              <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Record Expense</h2>
              <p className="text-[10px] font-mono text-gray-400 mt-1">{previewNumber ? `${previewNumber} (next)` : ''}</p>
            </div>
          </div>

          {successNote && (
            <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">
              {successNote}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPaymentType('paid_now')}
              className={`flex-1 border rounded-lg px-4 py-3 text-left transition ${
                paymentType === 'paid_now' ? 'border-rowan-navy bg-rowan-bg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block text-xs font-bold text-rowan-navy uppercase">Paid Now</span>
              <span className="block text-[11px] text-gray-500 mt-0.5">Cash/bank leaves immediately</span>
            </button>
            <button
              onClick={() => setPaymentType('bill')}
              className={`flex-1 border rounded-lg px-4 py-3 text-left transition ${
                paymentType === 'bill' ? 'border-rowan-navy bg-rowan-bg' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="block text-xs font-bold text-rowan-navy uppercase">Bill (Pay Later)</span>
              <span className="block text-[11px] text-gray-500 mt-0.5">Adds to Accounts Payable, unpaid</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vendor *</label>
              <ComboBox
                options={vendorOptions}
                value={vendor ? { id: vendor.id, label: vendor.display_name } : null}
                placeholder="Select a vendor…"
                onSelect={(opt) => setVendor(opt ? vendors.find((v) => v.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setVendorSeed(text);
                  setShowVendorModal(true);
                }}
                createLabel="Add new vendor"
              />
            </div>
            {paymentType === 'paid_now' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Paid From *</label>
                <ComboBox
                  options={cashAccountOptions}
                  value={paidFromAccount ? { id: paidFromAccount.id, label: paidFromAccount.name, sublabel: paidFromAccount.code } : null}
                  placeholder="Select a cash/bank account…"
                  onSelect={(opt) => setPaidFromAccount(opt ? cashAccounts.find((a) => a.id === opt.id) ?? null : null)}
                  onCreateNew={(text) => {
                    setAccountSeed(text);
                    setShowAccountModal({ target: 'paidFrom' });
                  }}
                  createLabel="Add new account"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Expense Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            {paymentType === 'paid_now' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Method</label>
                <SearchableSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reference (optional)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Receipt / bill no."
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
          </div>

          <table className="w-full text-xs mb-2 border-collapse">
            <thead>
              <tr className="bg-rowan-navy text-white text-left">
                <th className="p-2 w-64">Category</th>
                <th className="p-2">Description</th>
                <th className="p-2 w-32 text-right">Amount</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className="border-b border-gray-200">
                  <td className="p-1">
                    <ComboBox
                      options={expenseAccountOptions}
                      value={
                        line.account_id
                          ? (() => {
                              const a = expenseAccounts.find((x) => x.id === line.account_id);
                              return a ? { id: a.id, label: a.name, sublabel: a.code } : null;
                            })()
                          : null
                      }
                      placeholder="Select category…"
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
                      placeholder="What was this for?"
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
                  <td className="p-2 text-right font-black text-rowan-navy">Total:</td>
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
              {paymentType === 'bill' ? 'Save Bill' : 'Save Expense'}
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-3">Recent Expenses</h3>
            {recentLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
            ) : recent.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No expenses recorded yet.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Number</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Vendor</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-mono">{r.expense_number}</td>
                      <td className="p-2">{new Date(r.expense_date).toLocaleDateString()}</td>
                      <td className="p-2">{r.vendors?.display_name ?? '—'}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.payment_type === 'bill' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                          {r.payment_type === 'bill' ? 'Bill' : 'Paid'}
                        </span>
                      </td>
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

      {showVendorModal && (
        <PartyModal
          kind="vendor"
          initial={{ display_name: vendorSeed }}
          onClose={() => setShowVendorModal(false)}
          onSave={handleCreateVendor}
        />
      )}
      {showAccountModal && (
        <AccountModal
          seedName={accountSeed}
          existing={showAccountModal.target === 'line' ? expenseAccounts : cashAccounts}
          onClose={() => setShowAccountModal(null)}
          onCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
