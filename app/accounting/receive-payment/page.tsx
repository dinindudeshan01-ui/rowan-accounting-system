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

type OpenInvoice = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
};

type PaymentRow = {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  status: 'posted' | 'void';
  customers: { display_name: string } | null;
};

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'card', label: 'Card' },
  { value: 'other', label: 'Other' },
];

const currentUser = { id: 'demo-user', name: 'Dinindu' };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReceivePaymentPage() {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [customer, setCustomer] = useState<Party | null>(null);
  const [customerSeed, setCustomerSeed] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [depositAccount, setDepositAccount] = useState<Account | null>(null);
  const [accountSeed, setAccountSeed] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [previewNumber, setPreviewNumber] = useState<string | null>(null);

  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [applied, setApplied] = useState<Record<string, string>>({}); // invoice_id -> amount string

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  const [recentPayments, setRecentPayments] = useState<PaymentRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('customers').select('*').eq('is_active', true).order('display_name').then(({ data }) => {
      setCustomers((data as Party[]) ?? []);
    });
    supabase
      .from('chart_of_accounts')
      .select('id, code, name, type')
      .eq('is_active', true)
      .eq('type', 'asset')
      .order('code')
      .then(({ data }) => setAccounts((data as Account[]) ?? []));
    fetchPreviewNumber();
    loadRecentPayments();
  }, []);

  async function fetchPreviewNumber() {
    const { data } = await supabase.rpc('next_payment_number_preview');
    if (typeof data === 'string') setPreviewNumber(data);
  }

  async function loadRecentPayments() {
    setRecentLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('id, payment_number, payment_date, amount, payment_method, status, customers(display_name)')
      .order('created_at', { ascending: false })
      .limit(25);
    setRecentPayments((data as any) ?? []);
    setRecentLoading(false);
  }

  useEffect(() => {
    if (!customer) {
      setOpenInvoices([]);
      setApplied({});
      return;
    }
    setInvoicesLoading(true);
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, total_amount, amount_paid')
      .eq('customer_id', customer.id)
      .in('status', ['issued', 'paid'])
      .order('invoice_date', { ascending: true })
      .then(({ data }) => {
        const rows = ((data as OpenInvoice[]) ?? []).filter((r) => r.total_amount - r.amount_paid > 0.01);
        setOpenInvoices(rows);
        setApplied({});
        setInvoicesLoading(false);
      });
  }, [customer]);

  // Auto-apply: distribute the entered amount across open invoices,
  // oldest first, same convenience QuickBooks' Receive Payments gives you.
  // Manual edits to individual line amounts are respected afterward —
  // this only runs when the top-level "Amount Received" changes.
  function handleAmountChange(value: string) {
    setAmount(value);
    const total = parseFloat(value) || 0;
    let remaining = total;
    const next: Record<string, string> = {};
    for (const inv of openInvoices) {
      const balance = inv.total_amount - inv.amount_paid;
      if (remaining <= 0) {
        next[inv.id] = '';
        continue;
      }
      const applyAmt = Math.min(balance, remaining);
      next[inv.id] = applyAmt > 0 ? applyAmt.toFixed(2) : '';
      remaining = +(remaining - applyAmt).toFixed(2);
    }
    setApplied(next);
  }

  function setLineApplied(invoiceId: string, value: string) {
    setApplied((prev) => ({ ...prev, [invoiceId]: value }));
  }

  const totalApplied = useMemo(
    () => Object.values(applied).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [applied]
  );
  const amountNum = parseFloat(amount) || 0;
  const unapplied = +(amountNum - totalApplied).toFixed(2);

  async function handleCreateCustomer(draft: PartyDraft) {
    const created = await createParty('customer', { ...draft, display_name: draft.display_name || customerSeed });
    setCustomers((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    setCustomer(created);
    setShowCustomerModal(false);
  }

  function handleAccountCreated(account: Account) {
    setAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
    setDepositAccount(account);
    setShowAccountModal(false);
  }

  function resetForm() {
    setCustomer(null);
    setDepositAccount(null);
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAmount('');
    setPaymentMethod('bank_transfer');
    setReference('');
    setMemo('');
    setApplied({});
    setError(null);
    fetchPreviewNumber();
  }

  async function handleSubmit() {
    setError(null);
    if (!customer) return setError('Select a customer.');
    if (!depositAccount) return setError('Select a Deposit To account.');
    if (amountNum <= 0) return setError('Enter an amount received greater than zero.');
    if (unapplied !== 0) {
      return setError(
        unapplied > 0
          ? `${fmt(unapplied)} of this payment isn't applied to any invoice yet.`
          : `You've applied ${fmt(totalApplied)}, which is more than the ${fmt(amountNum)} received.`
      );
    }

    const allocations = Object.entries(applied)
      .filter(([, v]) => (parseFloat(v) || 0) > 0)
      .map(([invoice_id, v]) => ({ invoice_id, amount: parseFloat(v) }));

    if (allocations.length === 0) return setError('Apply this payment to at least one invoice.');

    setSaving(true);
    try {
      const { data: paymentNumber, error: rpcErr } = await supabase.rpc('receive_payment', {
        p_customer_id: customer.id,
        p_payment_date: paymentDate,
        p_amount: amountNum,
        p_payment_method: paymentMethod,
        p_deposit_account_id: depositAccount.id,
        p_reference: reference || null,
        p_memo: memo || null,
        p_created_by_name: currentUser.name,
        p_allocations: allocations,
      });
      if (rpcErr) throw rpcErr;

      setSuccessNote(`Recorded ${paymentNumber} and posted to the ledger.`);
      resetForm();
      loadRecentPayments();
    } catch (e: any) {
      setError(e.message ?? 'Failed to record payment.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(paymentId: string) {
    setVoidingId(paymentId);
    try {
      const { error: voidErr } = await supabase.rpc('void_payment', { p_payment_id: paymentId });
      if (voidErr) throw voidErr;
      loadRecentPayments();
      if (customer) {
        // refresh open invoices in case the voided payment reopened one
        const { data } = await supabase
          .from('invoices')
          .select('id, invoice_number, invoice_date, due_date, total_amount, amount_paid')
          .eq('customer_id', customer.id)
          .in('status', ['issued', 'paid']);
        const rows = ((data as OpenInvoice[]) ?? []).filter((r) => r.total_amount - r.amount_paid > 0.01);
        setOpenInvoices(rows);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to void payment.');
    } finally {
      setVoidingId(null);
    }
  }

  const customerOptions: ComboOption[] = useMemo(
    () => customers.map((c) => ({ id: c.id, label: c.display_name, sublabel: c.company_name ?? undefined })),
    [customers]
  );
  const accountOptions: ComboOption[] = useMemo(
    () => accounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code })),
    [accounts]
  );

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Receive Payment" />

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/accounting/customers" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Back</Link>
              <div className="flex items-center gap-2 mt-1">
                <RowanWordmark />
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Receive Payment</h2>
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

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer *</label>
              <ComboBox
                options={customerOptions}
                value={customer ? { id: customer.id, label: customer.display_name } : null}
                placeholder="Select a customer…"
                onSelect={(opt) => setCustomer(opt ? customers.find((c) => c.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setCustomerSeed(text);
                  setShowCustomerModal(true);
                }}
                createLabel="Add new customer"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deposit To *</label>
              <ComboBox
                options={accountOptions}
                value={depositAccount ? { id: depositAccount.id, label: depositAccount.name, sublabel: depositAccount.code } : null}
                placeholder="Select a cash/bank account…"
                onSelect={(opt) => setDepositAccount(opt ? accounts.find((a) => a.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setAccountSeed(text);
                  setShowAccountModal(true);
                }}
                createLabel="Add new account"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount Received *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment Method</label>
              <SearchableSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reference (optional)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Cheque no. / txn ref"
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
          </div>

          {customer && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Outstanding Invoices</h3>
              {invoicesLoading ? (
                <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
              ) : openInvoices.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No open invoices for this customer.</p>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-rowan-navy text-white text-left">
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Due</th>
                      <th className="p-2 text-right">Original Amount</th>
                      <th className="p-2 text-right">Balance Due</th>
                      <th className="p-2 text-right w-32">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openInvoices.map((inv) => {
                      const balance = inv.total_amount - inv.amount_paid;
                      return (
                        <tr key={inv.id} className="border-b border-gray-200">
                          <td className="p-2 font-mono">{inv.invoice_number}</td>
                          <td className="p-2">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                          <td className="p-2">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                          <td className="p-2 text-right">{fmt(inv.total_amount)}</td>
                          <td className="p-2 text-right font-bold">{fmt(balance)}</td>
                          <td className="p-1">
                            <input
                              type="number"
                              step="0.01"
                              value={applied[inv.id] ?? ''}
                              onChange={(e) => setLineApplied(inv.id, e.target.value)}
                              className="w-full border border-gray-300 rounded px-1 py-1 text-right"
                              placeholder="0.00"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div className="flex justify-end mb-6">
            <table className="text-xs w-72">
              <tbody>
                <tr>
                  <td className="p-1 text-gray-500">Amount Received</td>
                  <td className="p-1 text-right font-bold">{fmt(amountNum)}</td>
                </tr>
                <tr>
                  <td className="p-1 text-gray-500">Applied to Invoices</td>
                  <td className="p-1 text-right font-bold">{fmt(totalApplied)}</td>
                </tr>
                <tr className={unapplied !== 0 ? 'text-rowan-red' : 'text-green-600'}>
                  <td className="p-1 font-bold">Unapplied</td>
                  <td className="p-1 text-right font-bold">{fmt(unapplied)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Memo (optional)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              disabled={saving}
              onClick={handleSubmit}
              className="px-6 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving && <LoadingSpinner size="sm" />}
              Save Payment
            </button>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-3">Recent Payments</h3>
            {recentLoading ? (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" label="Loading..." /></div>
            ) : recentPayments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Payment #</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Method</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-2 font-mono">{p.payment_number}</td>
                      <td className="p-2">{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td className="p-2">{p.customers?.display_name ?? '—'}</td>
                      <td className="p-2 capitalize">{p.payment_method.replace('_', ' ')}</td>
                      <td className="p-2 text-right font-bold">{fmt(p.amount)}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'void' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {p.status === 'posted' && (
                          <button
                            disabled={voidingId === p.id}
                            onClick={() => handleVoid(p.id)}
                            className="text-rowan-red font-bold hover:underline disabled:opacity-50"
                          >
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

      {showCustomerModal && (
        <PartyModal
          kind="customer"
          initial={{ display_name: customerSeed }}
          onClose={() => setShowCustomerModal(false)}
          onSave={handleCreateCustomer}
        />
      )}
      {showAccountModal && (
        <AccountModal
          seedName={accountSeed}
          existing={accounts}
          onClose={() => setShowAccountModal(false)}
          onCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
