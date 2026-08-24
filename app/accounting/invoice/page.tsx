'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { RowanMark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PartyModal } from '@/components/PartyModal';
import { ItemModal } from '@/components/ItemModal';
import { InvoiceImagePanel } from '@/components/InvoiceImagePanel';
import { supabase } from '@/lib/supabase';
import {
  Party,
  PartyDraft,
  TERMS_OPTIONS,
  PartyTerms,
  listParties,
  createParty,
  InvoiceItem,
  ItemDraft,
  listItems,
  createItem,
} from '@/lib/parties';

type InvoiceLine = {
  key: string;
  item_id: string | null;
  code: string;
  description: string;
  qty: string;
  unit_price: string;
};

const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AUD'];

const emptyLine = (): InvoiceLine => ({
  key: crypto.randomUUID(),
  item_id: null,
  code: '',
  description: '',
  qty: '1',
  unit_price: '',
});

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <InvoiceForm />
    </Suspense>
  );
}

function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('(next)');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [terms, setTerms] = useState<PartyTerms>('net_30');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [status, setStatus] = useState<'draft' | 'issued' | 'paid' | 'void'>('draft');
  const [amountPaid, setAmountPaid] = useState(0);

  const [customers, setCustomers] = useState<Party[]>([]);
  const [customer, setCustomer] = useState<Party | null>(null);
  const [purchaserAddress, setPurchaserAddress] = useState('');
  const [purchaserTin, setPurchaserTin] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSeed, setCustomerSeed] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [showItemModal, setShowItemModal] = useState<{ lineKey: string; seed: string } | null>(null);

  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccName, setBankAccName] = useState('');
  const [bankAccNo, setBankAccNo] = useState('');
  const [memo, setMemo] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [vatRate, setVatRate] = useState('18');
  const [scllRate, setScllRate] = useState('2.5');
  const [ssclRegistered, setSsclRegistered] = useState(false);

  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine(), emptyLine(), emptyLine()]);

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ledgerNote, setLedgerNote] = useState<{ ok: boolean; message: string } | null>(null);

  // ---------- initial data load ----------
  useEffect(() => {
    listParties('customer').then(setCustomers).catch(() => {});
    listItems().then(setItems).catch(() => {});
    supabase.from('tax_settings').select('sscl_registered').single().then(({ data }) => {
      if (data) setSsclRegistered(data.sscl_registered);
    });
    if (!editId) {
      supabase.rpc('next_invoice_number_preview').then(({ data }) => {
        if (data) setInvoiceNumber(`${data} (next)`);
      });
    }
  }, [editId]);

  // ---------- load existing invoice for edit ----------
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data: inv } = await supabase.from('invoices').select('*').eq('id', editId).single();
      const { data: ls } = await supabase.from('invoice_lines').select('*').eq('invoice_id', editId).order('line_no');
      if (inv) {
        setInvoiceId(inv.id);
        setInvoiceNumber(inv.invoice_number);
        setInvoiceDate(inv.invoice_date);
        setDueDate(inv.due_date ?? '');
        setCurrency(inv.currency);
        setStatus(inv.status);
        setAmountPaid(inv.amount_paid ?? 0);
        setPurchaserAddress(inv.purchaser_address ?? '');
        setPurchaserTin(inv.purchaser_tin ?? '');
        setBankName(inv.bank_name ?? '');
        setBankBranch(inv.bank_branch ?? '');
        setBankAccName(inv.bank_acc_name ?? '');
        setBankAccNo(inv.bank_acc_no ?? '');
        setMemo(inv.memo ?? '');
        setVatRate(String(inv.vat_rate));
        setScllRate(String(inv.sscl_rate));
        setImageUrl(inv.image_url ?? null);
        if (inv.customer_id) {
          const c = await supabase.from('customers').select('*').eq('id', inv.customer_id).single();
          if (c.data) setCustomer(c.data as Party);
        }
      }
      if (ls && ls.length) {
        setLines(
          ls.map((l: any) => ({
            key: crypto.randomUUID(),
            item_id: l.item_id,
            code: l.code ?? '',
            description: l.description,
            qty: String(l.qty),
            unit_price: String(l.unit_price),
          }))
        );
      }
      setLoading(false);
    })();
  }, [editId]);

  function selectCustomer(c: Party | null) {
    setCustomer(c);
    if (c) {
      setPurchaserAddress([c.address, c.city].filter(Boolean).join(', '));
      setPurchaserTin(c.tin_vat ?? '');
      setTerms(c.payment_terms);
      const termDef = TERMS_OPTIONS.find((t) => t.value === c.payment_terms);
      if (termDef?.days != null) setDueDate(addDays(invoiceDate, termDef.days));
    }
  }

  function changeTerms(t: PartyTerms) {
    setTerms(t);
    const def = TERMS_OPTIONS.find((o) => o.value === t);
    if (def?.days != null) setDueDate(addDays(invoiceDate, def.days));
  }

  function changeInvoiceDate(d: string) {
    setInvoiceDate(d);
    const def = TERMS_OPTIONS.find((o) => o.value === terms);
    if (def?.days != null) setDueDate(addDays(d, def.days));
  }

  async function handleCreateCustomer(draft: PartyDraft) {
    const created = await createParty('customer', { ...draft, display_name: draft.display_name || customerSeed });
    setCustomers((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    selectCustomer(created);
    setShowCustomerModal(false);
  }

  function updateLine(key: string, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function selectLineItem(key: string, opt: ComboOption | null) {
    if (!opt) {
      updateLine(key, { item_id: null });
      return;
    }
    const item = items.find((i) => i.id === opt.id);
    if (item) {
      updateLine(key, {
        item_id: item.id,
        code: item.code,
        description: item.description || item.name,
        unit_price: item.unit_price ? String(item.unit_price) : '',
      });
    }
  }
  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }
  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  async function handleCreateItem(draft: ItemDraft) {
    if (!showItemModal) return;
    const created = await createItem(draft);
    setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    selectLineItem(showItemModal.lineKey, { id: created.id, label: created.name });
    setShowItemModal(null);
  }

  const lineTotals = lines.map((l) => (parseFloat(l.qty) || 0) * (parseFloat(l.unit_price) || 0));
  const subtotal = lineTotals.reduce((s, n) => s + n, 0);
  const scllAmt = ssclRegistered ? subtotal * ((parseFloat(scllRate) || 0) / 100) : 0;
  const exclVat = subtotal + scllAmt;
  const vatAmt = exclVat * ((parseFloat(vatRate) || 0) / 100);
  const grandTotal = exclVat + vatAmt;
  const balanceDue = grandTotal - amountPaid;
  const isLocked = status === 'void' || amountPaid > 0;

  const itemOptions: ComboOption[] = useMemo(
    () => items.map((i) => ({ id: i.id, label: i.name, sublabel: i.code })),
    [items]
  );
  const customerOptions: ComboOption[] = useMemo(
    () => customers.map((c) => ({ id: c.id, label: c.display_name, sublabel: c.company_name ?? undefined })),
    [customers]
  );

  async function handleSave(nextStatus: 'draft' | 'issued', goToPrint = false) {
    setError(null);
    if (!customer) {
      setError('Select a customer.');
      return;
    }
    const usableLines = lines.filter((l) => l.description.trim());
    if (usableLines.length === 0) {
      setError('Add at least one invoice line.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoice_date: invoiceDate,
        due_date: dueDate || null,
        currency,
        customer_id: customer.id,
        purchaser_name: customer.display_name,
        purchaser_address: purchaserAddress || null,
        purchaser_tin: purchaserTin || null,
        bank_name: bankName || null,
        bank_branch: bankBranch || null,
        bank_acc_name: bankAccName || null,
        bank_acc_no: bankAccNo || null,
        payment_terms: TERMS_OPTIONS.find((t) => t.value === terms)?.label ?? terms,
        vat_rate: parseFloat(vatRate) || 0,
        sscl_rate: parseFloat(scllRate) || 0,
        subtotal,
        sscl_amount: scllAmt,
        vat_amount: vatAmt,
        total_amount: grandTotal,
        memo: memo || null,
        status: nextStatus,
      };

      let id = invoiceId;
      let number = invoiceNumber;

      if (id) {
        const { error: updErr } = await supabase.from('invoices').update(payload).eq('id', id);
        if (updErr) throw updErr;
        await supabase.from('invoice_lines').delete().eq('invoice_id', id);
      } else {
        const { data: inv, error: invErr } = await supabase.from('invoices').insert(payload).select().single();
        if (invErr) throw invErr;
        id = inv.id;
        number = inv.invoice_number;
      }

      const rows = usableLines.map((l, idx) => ({
        invoice_id: id,
        line_no: idx + 1,
        item_id: l.item_id,
        code: l.code || null,
        description: l.description,
        qty: parseFloat(l.qty) || 0,
        unit_price: parseFloat(l.unit_price) || 0,
      }));
      const { error: lineErr } = await supabase.from('invoice_lines').insert(rows);
      if (lineErr) throw lineErr;

      setInvoiceId(id);
      setInvoiceNumber(number);
      setSavedId(id);
      setStatus(nextStatus);
      setLedgerNote(null);

      if (nextStatus === 'issued' && id) {
        const { data: entryNumber, error: postErr } = await supabase.rpc('post_invoice_to_ledger', {
          p_invoice_id: id,
        });
        if (postErr) {
          // The invoice itself saved fine — only the GL posting failed.
          // Surface this loudly rather than letting it fail silently,
          // since that silence is exactly what caused the P&L/customer
          // balance to never reflect issued invoices before.
          setLedgerNote({ ok: false, message: `Invoice saved, but posting to the ledger failed: ${postErr.message}` });
        } else {
          setLedgerNote({ ok: true, message: `Posted to the ledger as ${entryNumber}.` });
        }
      }

      if (goToPrint && id) router.push(`/accounting/invoice/${id}/print`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-[1500px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
            <div className="flex items-center gap-2 mt-1">
              <RowanMark size={26} />
              <h1 className="text-xl font-black text-rowan-navy">{invoiceId ? 'Edit Invoice' : 'New Invoice'}</h1>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : status === 'void'
                    ? 'bg-red-100 text-red-600'
                    : status === 'issued'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/accounting/invoices" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
              All Invoices
            </Link>
          </div>
        </div>

        {isLocked && (
          <div className="mb-4 bg-blue-50 border border-blue-300 text-blue-800 text-sm px-4 py-2 rounded">
            {status === 'void'
              ? 'This invoice is void and locked for editing.'
              : `This invoice has ${fmt(amountPaid)} ${currency} applied against it and is locked for editing — amounts can't change once a payment has been recorded. To fix a mistake, void the payment in Receive Payment first.`}
          </div>
        )}

        {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-4 py-2 rounded mb-3">{error}</div>}
        {savedId && !error && (
          <div className="bg-green-50 text-green-700 text-xs font-bold px-4 py-2 rounded mb-3 flex justify-between items-center">
            <span>Saved as {invoiceNumber}.</span>
            <Link href={`/accounting/invoice/${savedId}/print`} className="underline">View / Print →</Link>
          </div>
        )}
        {ledgerNote && (
          <div
            className={`text-xs font-bold px-4 py-2 rounded mb-3 ${
              ledgerNote.ok ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'
            }`}
          >
            {ledgerNote.message}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer *</label>
              <ComboBox
                options={customerOptions}
                value={customer ? { id: customer.id, label: customer.display_name } : null}
                placeholder="Select a customer…"
                onSelect={(opt) => selectCustomer(opt ? customers.find((c) => c.id === opt.id) ?? null : null)}
                onCreateNew={(text) => {
                  setCustomerSeed(text);
                  setShowCustomerModal(true);
                }}
                createLabel="Add new customer"
              />
              {customer && (
                <div className="mt-2 text-[11px] text-gray-500 leading-tight space-y-1">
                  <textarea
                    value={purchaserAddress}
                    onChange={(e) => setPurchaserAddress(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded px-2 py-1 resize-none"
                    placeholder="Billing address"
                  />
                  <div className="flex items-center gap-1">
                    <span className="font-bold">TIN/VAT:</span>
                    <input
                      value={purchaserTin}
                      onChange={(e) => setPurchaserTin(e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice No.</label>
                <div className="border border-gray-200 rounded px-2 py-1.5 bg-gray-50 text-gray-500">{invoiceNumber}</div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Currency</label>
                <SearchableSelect
                  value={currency}
                  onChange={setCurrency}
                  options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Invoice Date</label>
                <input type="date" value={invoiceDate} onChange={(e) => changeInvoiceDate(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Terms</label>
                <SearchableSelect
                  value={terms}
                  onChange={(v) => changeTerms(v as PartyTerms)}
                  options={TERMS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={terms !== 'custom'}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <table className="w-full text-[11px] mb-2 border-collapse">
            <thead>
              <tr className="bg-rowan-navy text-white">
                <th className="p-2 text-left w-56">Item</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right w-16">Qty</th>
                <th className="p-2 text-right w-24">Rate</th>
                <th className="p-2 text-right w-28">Amount</th>
                <th className="p-2 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => (
                <tr key={l.key} className="border-b border-gray-100">
                  <td className="px-1 py-1.5">
                    <ComboBox
                      options={itemOptions}
                      value={l.item_id ? { id: l.item_id, label: items.find((i) => i.id === l.item_id)?.name ?? l.code } : null}
                      placeholder="Select item…"
                      onSelect={(opt) => selectLineItem(l.key, opt)}
                      onCreateNew={(text) => setShowItemModal({ lineKey: l.key, seed: text })}
                      createLabel="Add new item"
                    />
                  </td>
                  <td className="px-1"><input value={l.description} onChange={(e) => updateLine(l.key, { description: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px]" /></td>
                  <td className="px-1"><input value={l.qty} onChange={(e) => updateLine(l.key, { qty: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] text-right" /></td>
                  <td className="px-1"><input value={l.unit_price} onChange={(e) => updateLine(l.key, { unit_price: e.target.value })} className="w-full border border-gray-200 rounded px-2 py-1.5 text-[11px] text-right" placeholder="0.00" /></td>
                  <td className="px-1 text-right font-semibold">{fmt(lineTotals[idx])}</td>
                  <td className="px-1 text-center">
                    <button onClick={() => removeLine(l.key)} className="text-gray-300 hover:text-rowan-red">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addLine} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6">+ Add line</button>

          {/* Bottom section */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3 text-[11px]">
              <div className="border border-gray-200 rounded p-3">
                <h3 className="font-bold text-rowan-navy uppercase text-[10px] mb-2">Bank Details</h3>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <input placeholder="Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                  <input placeholder="Branch" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                  <input placeholder="A/C Name" value={bankAccName} onChange={(e) => setBankAccName(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                  <input placeholder="A/C No" value={bankAccNo} onChange={(e) => setBankAccNo(e.target.value)} className="border border-gray-200 rounded px-2 py-1" />
                </div>
              </div>
              <div className="border border-gray-200 rounded p-3">
                <h3 className="font-bold text-rowan-navy uppercase text-[10px] mb-2">Memo / Notes</h3>
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className="w-full border border-gray-200 rounded px-2 py-1 resize-none" placeholder="Internal memo (not printed unless added to terms)" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">VAT %</label>
                  <input value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1" />
                </div>
                {ssclRegistered && (
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">SSCL %</label>
                    <input value={scllRate} onChange={(e) => setScllRate(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <table className="w-full text-[12px]">
                <tbody>
                  <tr><td className="p-1.5 text-right text-gray-500">Subtotal:</td><td className="text-right p-1.5 font-bold">{fmt(subtotal)}</td></tr>
                  {ssclRegistered && (
                    <tr><td className="p-1.5 text-right text-gray-500">SSCL ({scllRate}%):</td><td className="text-right p-1.5 font-bold">{fmt(scllAmt)}</td></tr>
                  )}
                  <tr><td className="p-1.5 text-right font-bold text-rowan-navy">Total (Excl. VAT):</td><td className="text-right p-1.5 border-t border-gray-200 font-bold">{fmt(exclVat)}</td></tr>
                  <tr><td className="p-1.5 text-right text-gray-500">VAT ({vatRate}%):</td><td className="text-right p-1.5 font-bold">{fmt(vatAmt)}</td></tr>
                  <tr className="bg-rowan-bg"><td className="p-2 text-right font-black text-rowan-navy">Invoice Total:</td><td className="text-right p-2 font-black text-rowan-navy text-base">{currency} {fmt(grandTotal)}</td></tr>
                  {amountPaid > 0 && (
                    <>
                      <tr><td className="p-1.5 text-right text-gray-500">Amount Paid:</td><td className="text-right p-1.5 font-bold text-green-700">{fmt(amountPaid)}</td></tr>
                      <tr className="bg-rowan-bg"><td className="p-2 text-right font-black text-rowan-navy">Balance Due:</td><td className="text-right p-2 font-black text-rowan-navy text-base">{currency} {fmt(balanceDue)}</td></tr>
                    </>
                  )}
                </tbody>
              </table>

              {!isLocked && (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => handleSave(status as 'draft' | 'issued', true)}
                    disabled={saving}
                    className="bg-rowan-navy text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {saving && <LoadingSpinner size="sm" />}
                    Save & Preview / Print
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave('draft')} disabled={saving} className="flex-1 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold text-xs hover:border-rowan-navy hover:text-rowan-navy transition disabled:opacity-50">
                      Save as Draft
                    </button>
                    <button onClick={() => handleSave('issued')} disabled={saving} className="flex-1 border border-rowan-navy text-rowan-navy px-4 py-2 rounded-lg font-bold text-xs hover:bg-rowan-navy hover:text-white transition disabled:opacity-50">
                      Save & Issue
                    </button>
                  </div>
                </div>
              )}
              {isLocked && invoiceId && (
                <Link
                  href={`/accounting/invoice/${invoiceId}/print`}
                  className="mt-4 block text-center bg-rowan-navy text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-rowan-red transition"
                >
                  View / Print
                </Link>
              )}
            </div>
          </div>
        </div>

        <InvoiceImagePanel imageUrl={imageUrl} invoiceId={invoiceId} onReplaced={setImageUrl} />
        </div>
      </div>

      {showCustomerModal && (
        <PartyModal
          kind="customer"
          initial={{ display_name: customerSeed }}
          onClose={() => setShowCustomerModal(false)}
          onSave={handleCreateCustomer}
        />
      )}
      {showItemModal && (
        <ItemModal
          initialName={showItemModal.seed}
          onClose={() => setShowItemModal(null)}
          onSave={handleCreateItem}
        />
      )}
    </div>
  );
}
