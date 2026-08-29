'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { AccountModal, Account } from '@/components/AccountModal';
import { Party } from '@/lib/parties';
import {
  BillAllocation,
  BillPaymentRow,
  OpenBill,
  listOpenBills,
  listRecentBillPayments,
  payBills,
  setBankAccountFlag,
  voidBillPayment,
} from '@/lib/bank';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayBillsPage() {
  const [vendors, setVendors] = useState<Party[]>([]);
  const [vendor, setVendor] = useState<Party | null>(null);

  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [bankAccount, setBankAccount] = useState<Account | null>(null);
  const [accountSeed, setAccountSeed] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');

  const [openBills, setOpenBills] = useState<OpenBill[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [applied, setApplied] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [recent, setRecent] = useState<BillPaymentRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('vendors').select('*').eq('is_active', true).order('display_name').then(({ data }) => setVendors((data as Party[]) ?? []));
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
    if (!vendor) {
      setOpenBills([]);
      setApplied({});
      return;
    }
    setBillsLoading(true);
    listOpenBills(vendor.id)
      .then((bills) => setOpenBills(bills))
      .finally(() => setBillsLoading(false));
    setApplied({});
  }, [vendor]);

  async function loadRecent() {
    setRecentLoading(true);
    setRecent(await listRecentBillPayments());
    setRecentLoading(false);
  }

  // Same auto-apply convenience as Receive Payment: distribute the
  // entered amount across open bills, oldest first.
  function handleAmountChange(value: string) {
    setAmount(value);
    const total = parseFloat(value) || 0;
    let remaining = total;
    const next: Record<string, string> = {};
    for (const bill of openBills) {
      const balance = bill.total_amount - bill.amount_paid;
      if (remaining <= 0) {
        next[bill.id] = '';
        continue;
      }
      const applyAmt = Math.min(balance, remaining);
      next[bill.id] = applyAmt > 0 ? applyAmt.toFixed(2) : '';
      remaining = +(remaining - applyAmt).toFixed(2);
    }
    setApplied(next);
  }

  function setLineApplied(billId: string, value: string) {
    setApplied((prev) => ({ ...prev, [billId]: value }));
  }

  const totalApplied = useMemo(() => Object.values(applied).reduce((s, v) => s + (parseFloat(v) || 0), 0), [applied]);
  const amountNum = parseFloat(amount) || 0;
  const unapplied = +(amountNum - totalApplied).toFixed(2);

  function handleAccountCreated(account: Account) {
    setBankAccountFlag(account.id, true).catch(() => {});
    setBankAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
    setBankAccount(account);
    setShowAccountModal(false);
  }

  function resetForm() {
    setVendor(null);
    setBankAccount(null);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount('');
    setReference('');
    setMemo('');
    setApplied({});
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!vendor) return setError('Select a vendor.');
    if (!bankAccount) return setError('Select a bank account to pay from.');
    if (amountNum <= 0) return setError('Enter an amount paid.');
    if (unapplied !== 0) {
      return setError(
        unapplied > 0 ? `${fmt(unapplied)} of this payment isn't applied to any bill yet.` : `You've applied ${fmt(totalApplied)}, more than the ${fmt(amountNum)} paid.`
      );
    }

    const allocations: BillAllocation[] = Object.entries(applied)
      .filter(([, v]) => (parseFloat(v) || 0) > 0)
      .map(([expense_id, v]) => ({ expense_id, amount: parseFloat(v) }));
    if (allocations.length === 0) return setError('Apply this payment to at least one bill.');

    setSaving(true);
    try {
      const number = await payBills({
        vendorId: vendor.id,
        paymentDate,
        amount: amountNum,
        bankAccountId: bankAccount.id,
        reference: reference || null,
        memo: memo || null,
        createdByName: currentUser.name,
        allocations,
      });
      setSuccessNote(`${number} recorded and posted to the ledger.`);
      resetForm();
      loadRecent();
    } catch (e: any) {
      setError(e.message ?? 'Failed to pay bills.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(billPaymentId: string) {
    setVoidingId(billPaymentId);
    try {
      await voidBillPayment(billPaymentId);
      loadRecent();
      if (vendor) listOpenBills(vendor.id).then(setOpenBills);
    } catch (e: any) {
      setError(e.message ?? 'Failed to void bill payment.');
    } finally {
      setVoidingId(null);
    }
  }

  const vendorOptions: ComboOption[] = useMemo(
    () => vendors.map((v) => ({ id: v.id, label: v.display_name, sublabel: v.company_name ?? undefined })),
    [vendors]
  );
  const bankAccountOptions: ComboOption[] = useMemo(() => bankAccounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code })), [bankAccounts]);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Pay Bills" />

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
            <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Pay Bills</h2>
          </div>

          {successNote && <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">{successNote}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Vendor *</label>
              <ComboBox
                options={vendorOptions}
                value={vendor ? { id: vendor.id, label: vendor.display_name } : null}
                placeholder="Select a vendor…"
                onSelect={(opt) => setVendor(opt ? vendors.find((v) => v.id === opt.id) ?? null : null)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pay From *</label>
              <ComboBox
                options={bankAccountOptions}
                value={bankAccount ? { id: bankAccount.id, label: bankAccount.name, sublabel: bankAccount.code } : null}
                placeholder="Select a bank account…"
                onSelect={(opt) => setBankAccount(opt ? bankAccounts.find((a) => a.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setAccountSeed(text);
                  setShowAccountModal(true);
                }}
                createLabel="Add new bank account"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Date</label>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount Paid</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-right"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reference (optional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Cheque / transfer no." className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Open Bills</h3>
          {!vendor ? (
            <p className="text-xs text-gray-400 py-4">Select a vendor to see their open bills.</p>
          ) : billsLoading ? (
            <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
          ) : openBills.length === 0 ? (
            <p className="text-xs text-gray-400 py-4">No open bills for this vendor.</p>
          ) : (
            <table className="w-full text-xs mb-2 border-collapse">
              <thead>
                <tr className="bg-rowan-navy text-white text-left">
                  <th className="p-2">Bill #</th>
                  <th className="p-2">Date</th>
                  <th className="p-2 text-right">Total</th>
                  <th className="p-2 text-right">Balance Owed</th>
                  <th className="p-2 w-32 text-right">Applied</th>
                </tr>
              </thead>
              <tbody>
                {openBills.map((bill) => {
                  const balance = bill.total_amount - bill.amount_paid;
                  return (
                    <tr key={bill.id} className="border-b border-gray-200">
                      <td className="p-2 font-mono">{bill.expense_number}</td>
                      <td className="p-2">{new Date(bill.expense_date).toLocaleDateString()}</td>
                      <td className="p-2 text-right">{fmt(bill.total_amount)}</td>
                      <td className="p-2 text-right font-bold">{fmt(balance)}</td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          value={applied[bill.id] ?? ''}
                          onChange={(e) => setLineApplied(bill.id, e.target.value)}
                          className="w-full border border-gray-300 rounded px-1 py-1 text-right"
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={unapplied !== 0 ? 'text-rowan-red' : 'text-green-600'}>
                  <td className="p-1 font-bold" colSpan={4}>Unapplied</td>
                  <td className="p-1 text-right font-bold">{fmt(unapplied)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          <div className="mb-6 mt-4">
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
              Save Bill Payment
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-3">Recent Bill Payments</h3>
            {recentLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
            ) : recent.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No bill payments recorded yet.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Number</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Vendor</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-mono">{r.payment_number}</td>
                      <td className="p-2">{new Date(r.payment_date).toLocaleDateString()}</td>
                      <td className="p-2">{r.vendors?.display_name ?? '—'}</td>
                      <td className="p-2 text-right font-bold">{fmt(r.amount)}</td>
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
        <AccountModal seedName={accountSeed} existing={bankAccounts} onClose={() => setShowAccountModal(false)} onCreated={handleAccountCreated} />
      )}
    </div>
  );
}
