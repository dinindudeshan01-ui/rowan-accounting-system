'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PartyModal } from '@/components/PartyModal';
import { ItemModal } from '@/components/ItemModal';
import { AccountModal, Account } from '@/components/AccountModal';
import { Party, PartyDraft, createParty, InvoiceItem, ItemDraft, createItem, deleteItem } from '@/lib/parties';
import { ConfirmModal } from '@/components/ConfirmModal';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

const CLASSIFICATION_LABELS: Record<string, string> = {
  direct_material: 'Direct Material',
  direct_expense: 'Direct Other',
  indirect_material: 'Indirect Material',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StockPage() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showReceive, setShowReceive] = useState<InvoiceItem | null>(null);
  const [showIssue, setShowIssue] = useState<InvoiceItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<InvoiceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase.from('items').select('*').eq('is_active', true).eq('item_type', 'inventory').order('name');
    setItems((data as InvoiceItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreateItem(draft: ItemDraft) {
    await createItem({ ...draft, item_type: 'inventory' });
    setShowItemModal(false);
    setNote('Item added.');
    loadItems();
  }

  async function handleDeleteItem() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deleteItem(confirmDelete.id);
      setNote(`Deleted ${confirmDelete.name}.`);
      setConfirmDelete(null);
      loadItems();
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete item.');
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(
    () => items.filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const rawMaterials = filtered.filter((i) => !i.style_id);
  const finishedGoods = filtered.filter((i) => i.style_id);

  const stockValue = items.reduce((s, i) => s + i.quantity_on_hand * i.unit_cost, 0);
  const lowStockCount = items.filter((i) => i.reorder_level != null && i.quantity_on_hand <= i.reorder_level).length;

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
              <div className="mt-1"><RowanWordmark markSize={32} /></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowItemModal(true)} className="px-4 py-2 rounded-lg border border-rowan-navy text-rowan-navy font-bold text-xs hover:bg-gray-50">
                + New Item
              </button>
            </div>
          </div>

          <h1 className="text-xl font-black text-rowan-navy mb-4">Stock</h1>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase">Items Tracked</p>
              <p className="text-2xl font-black text-rowan-navy">{items.length}</p>
            </div>
            <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase">Stock Value (at cost)</p>
              <p className="text-2xl font-black text-rowan-navy">{fmt(stockValue)}</p>
            </div>
            <div className={`border rounded-lg p-4 ${lowStockCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-rowan-bg border-gray-200'}`}>
              <p className={`text-[11px] font-bold uppercase ${lowStockCount > 0 ? 'text-amber-700' : 'text-gray-500'}`}>Below Reorder Level</p>
              <p className={`text-2xl font-black ${lowStockCount > 0 ? 'text-amber-700' : 'text-rowan-navy'}`}>{lowStockCount}</p>
            </div>
          </div>

          {note && <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded mb-4">{note}</div>}
          {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-3 py-2 rounded mb-4">{error}</div>}

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 text-sm"
          />

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <>
              <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Raw Materials &amp; Consumables</h3>
              <StockTable rows={rawMaterials} onReceive={setShowReceive} onIssue={setShowIssue} onDelete={setConfirmDelete} showClassification />

              {finishedGoods.length > 0 && (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2 mt-8">Finished Goods (from Style)</h3>
                  <StockTable rows={finishedGoods} onReceive={setShowReceive} onIssue={setShowIssue} onDelete={setConfirmDelete} showClassification={false} />
                </>
              )}
            </>
          )}
        </div>
        <BrandRibbon />
      </div>

      {showItemModal && (
        <ItemModal onClose={() => setShowItemModal(false)} onSave={handleCreateItem} />
      )}
      {showReceive && (
        <ReceiveStockModal
          item={showReceive}
          onClose={() => setShowReceive(null)}
          onDone={(msg) => {
            setShowReceive(null);
            setNote(msg);
            loadItems();
          }}
          onError={setError}
        />
      )}
      {showIssue && (
        <IssueStockModal
          item={showIssue}
          onClose={() => setShowIssue(null)}
          onDone={(msg) => {
            setShowIssue(null);
            setNote(msg);
            loadItems();
          }}
          onError={setError}
        />
      )}
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Item"
        message={
          confirmDelete
            ? `Delete "${confirmDelete.name}"? Only allowed at zero balance — this can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteItem}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function StockTable({
  rows,
  onReceive,
  onIssue,
  onDelete,
  showClassification,
}: {
  rows: InvoiceItem[];
  onReceive: (i: InvoiceItem) => void;
  onIssue: (i: InvoiceItem) => void;
  onDelete: (i: InvoiceItem) => void;
  showClassification: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-gray-400 py-4 mb-4">Nothing here yet.</p>;
  }
  return (
    <table className="w-full text-xs border-collapse mb-4">
      <thead>
        <tr className="bg-rowan-navy text-white text-left">
          <th className="p-2">Code</th>
          <th className="p-2">Name</th>
          {showClassification && <th className="p-2">Classification</th>}
          <th className="p-2 text-right">On Hand</th>
          <th className="p-2 text-right">Unit Cost</th>
          <th className="p-2 text-right">Stock Value</th>
          <th className="p-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((i) => {
          const low = i.reorder_level != null && i.quantity_on_hand <= i.reorder_level;
          return (
            <tr key={i.id} className={`border-b border-gray-100 ${low ? 'bg-amber-50' : ''}`}>
              <td className="p-2 font-mono">{i.code}</td>
              <td className="p-2 font-semibold text-rowan-navy">
                {i.name}
                {low && <span className="ml-2 text-[9px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">Low stock</span>}
              </td>
              {showClassification && (
                <td className="p-2 text-gray-500">{i.material_classification ? CLASSIFICATION_LABELS[i.material_classification] : '—'}</td>
              )}
              <td className="p-2 text-right font-bold">{fmt(i.quantity_on_hand)}</td>
              <td className="p-2 text-right">{fmt(i.unit_cost)}</td>
              <td className="p-2 text-right font-bold">{fmt(i.quantity_on_hand * i.unit_cost)}</td>
              <td className="p-2 text-right space-x-3">
                <button type="button" onClick={() => onReceive(i)} className="text-rowan-navy font-bold hover:text-rowan-red">Receive</button>
                <button type="button" onClick={() => onIssue(i)} className="text-rowan-navy font-bold hover:text-rowan-red">Issue</button>
                <button type="button"
                  onClick={() => i.quantity_on_hand === 0 && onDelete(i)}
                  disabled={i.quantity_on_hand !== 0}
                  title={i.quantity_on_hand !== 0 ? 'Only items at zero balance can be deleted' : 'Delete item'}
                  className={i.quantity_on_hand === 0 ? 'text-gray-400 font-bold hover:text-rowan-red' : 'text-gray-200 font-bold cursor-not-allowed'}
                >
                  Delete
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ReceiveStockModal({
  item,
  onClose,
  onDone,
  onError,
}: {
  item: InvoiceItem;
  onClose: () => void;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [vendors, setVendors] = useState<Party[]>([]);
  const [vendor, setVendor] = useState<Party | null>(null);
  const [vendorSeed, setVendorSeed] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [paidFromAccount, setPaidFromAccount] = useState<Account | null>(null);
  const [accountSeed, setAccountSeed] = useState('');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [paymentType, setPaymentType] = useState<'paid_now' | 'bill'>('paid_now');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [qty, setQty] = useState('');
  const [unitCost, setUnitCost] = useState(String(item.unit_cost || ''));
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('vendors').select('*').eq('is_active', true).order('display_name').then(({ data }) => setVendors((data as Party[]) ?? []));
    supabase.from('chart_of_accounts').select('id, code, name, type').eq('is_active', true).eq('type', 'asset').order('code')
      .then(({ data }) => setCashAccounts((data as Account[]) ?? []));
  }, []);

  async function handleCreateVendor(draft: PartyDraft) {
    const created = await createParty('vendor', { ...draft, display_name: draft.display_name || vendorSeed });
    setVendors((prev) => [...prev, created]);
    setVendor(created);
    setShowVendorModal(false);
  }

  async function handleSubmit() {
    if (!vendor) return onError('Select a vendor.');
    if (paymentType === 'paid_now' && !paidFromAccount) return onError('Select a Paid From account.');
    const qtyNum = parseFloat(qty) || 0;
    const costNum = parseFloat(unitCost) || 0;
    if (qtyNum <= 0) return onError('Enter a quantity greater than zero.');
    if (costNum <= 0) return onError('Enter a unit cost greater than zero.');

    setSaving(true);
    try {
      const { data: entryNumber, error } = await supabase.rpc('receive_stock', {
        p_item_id: item.id,
        p_qty: qtyNum,
        p_unit_cost: costNum,
        p_vendor_id: vendor.id,
        p_payment_type: paymentType,
        p_payment_method: paymentType === 'paid_now' ? paymentMethod : null,
        p_paid_from_account_id: paymentType === 'paid_now' ? paidFromAccount!.id : null,
        p_reference: reference || null,
        p_memo: memo || null,
        p_created_by_name: currentUser.name,
      });
      if (error) throw error;
      onDone(`Received ${qtyNum} × ${item.name}. Posted as ${entryNumber}.`);
    } catch (e: any) {
      onError(e.message ?? 'Failed to receive stock.');
    } finally {
      setSaving(false);
    }
  }

  const vendorOptions: ComboOption[] = vendors.map((v) => ({ id: v.id, label: v.display_name }));
  const cashOptions: ComboOption[] = cashAccounts.map((a) => ({ id: a.id, label: a.name, sublabel: a.code }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-rowan-navy text-white px-5 py-3 rounded-t-lg sticky top-0">
          <h3 className="font-bold text-sm">Receive Stock — {item.name}</h3>
        </div>
        <div className="p-5 space-y-3 text-[12px]">
          <div className="flex gap-2">
            <button type="button" onClick={() => setPaymentType('paid_now')} className={`flex-1 border rounded-lg px-3 py-2 text-left ${paymentType === 'paid_now' ? 'border-rowan-navy bg-rowan-bg' : 'border-gray-200'}`}>
              <span className="block font-bold text-rowan-navy text-[11px]">Paid Now</span>
            </button>
            <button type="button" onClick={() => setPaymentType('bill')} className={`flex-1 border rounded-lg px-3 py-2 text-left ${paymentType === 'bill' ? 'border-rowan-navy bg-rowan-bg' : 'border-gray-200'}`}>
              <span className="block font-bold text-rowan-navy text-[11px]">Bill (Pay Later)</span>
            </button>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1">Vendor *</label>
            <ComboBox
              options={vendorOptions}
              value={vendor ? { id: vendor.id, label: vendor.display_name } : null}
              placeholder="Select a vendor…"
              onSelect={(opt) => setVendor(opt ? vendors.find((v) => v.id === opt.id) ?? null : null)}
              onCreateNew={(text) => { setVendorSeed(text); setShowVendorModal(true); }}
              createLabel="Add new vendor"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Quantity *</label>
              <input type="number" step="0.001" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Unit Cost *</label>
              <input type="number" step="0.01" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          {paymentType === 'paid_now' && (
            <>
              <div>
                <label className="block font-bold text-gray-500 mb-1">Paid From *</label>
                <ComboBox
                  options={cashOptions}
                  value={paidFromAccount ? { id: paidFromAccount.id, label: paidFromAccount.name, sublabel: paidFromAccount.code } : null}
                  placeholder="Select a cash/bank account…"
                  onSelect={(opt) => setPaidFromAccount(opt ? cashAccounts.find((a) => a.id === opt.id) ?? null : null)}
                  onCreateNew={(text) => { setAccountSeed(text); setShowAccountModal(true); }}
                  createLabel="Add new account"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-1">Payment Method</label>
                <SearchableSelect
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' },
                    { value: 'cheque', label: 'Cheque' },
                    { value: 'card', label: 'Card' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-gray-500 mb-1">Reference (optional)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="GRN / delivery note no." className="w-full border border-gray-300 rounded px-2 py-1.5" />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Memo (optional)</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg sticky bottom-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-rowan-navy">Cancel</button>
          <button type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-rowan-navy text-white px-5 py-2 rounded text-[11px] font-bold hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            Receive Stock
          </button>
        </div>
      </div>

      {showVendorModal && (
        <PartyModal kind="vendor" initial={{ display_name: vendorSeed }} onClose={() => setShowVendorModal(false)} onSave={handleCreateVendor} />
      )}
      {showAccountModal && (
        <AccountModal
          seedName={accountSeed}
          existing={cashAccounts}
          onClose={() => setShowAccountModal(false)}
          onCreated={(a) => { setCashAccounts((prev) => [...prev, a]); setPaidFromAccount(a); setShowAccountModal(false); }}
        />
      )}
    </div>
  );
}

function IssueStockModal({
  item,
  onClose,
  onDone,
  onError,
}: {
  item: InvoiceItem;
  onClose: () => void;
  onDone: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [qty, setQty] = useState('');
  const [memo, setMemo] = useState('');
  const [styles, setStyles] = useState<{ id: string; style_no: string; name: string }[]>([]);
  const [styleId, setStyleId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('styles').select('id, style_no, name').order('style_no').then(({ data }) => setStyles(data ?? []));
  }, []);

  async function handleSubmit() {
    const qtyNum = parseFloat(qty) || 0;
    if (qtyNum <= 0) return onError('Enter a quantity greater than zero.');
    if (qtyNum > item.quantity_on_hand) return onError(`Only ${item.quantity_on_hand} in stock.`);
    if (!item.expense_account_id) return onError('This item has no expense account set — edit the item first.');

    setSaving(true);
    try {
      const { data: entryNumber, error } = await supabase.rpc('issue_stock', {
        p_item_id: item.id,
        p_qty: qtyNum,
        p_style_id: styleId || null,
        p_memo: memo || null,
        p_created_by_name: currentUser.name,
      });
      if (error) throw error;
      onDone(`Issued ${qtyNum} × ${item.name}. Posted as ${entryNumber}.`);
    } catch (e: any) {
      onError(e.message ?? 'Failed to issue stock.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="bg-rowan-navy text-white px-5 py-3 rounded-t-lg">
          <h3 className="font-bold text-sm">Issue Stock — {item.name}</h3>
        </div>
        <div className="p-5 space-y-3 text-[12px]">
          <p className="text-gray-500">
            On hand: <strong>{item.quantity_on_hand}</strong> · Posts to expense at cost {item.unit_cost.toFixed(2)}/unit.
          </p>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Quantity *</label>
            <input type="number" step="0.001" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Style (optional — for traceability)</label>
            <SearchableSelect
              value={styleId}
              onChange={setStyleId}
              options={[{ value: '', label: 'Not linked to a style' }, ...styles.map((s) => ({ value: s.id, label: `${s.style_no} — ${s.name}` }))]}
            />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Reason / Memo</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} placeholder="e.g. Cutting for order #142" className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-rowan-navy">Cancel</button>
          <button type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-rowan-navy text-white px-5 py-2 rounded text-[11px] font-bold hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            Issue Stock
          </button>
        </div>
      </div>
    </div>
  );
}
