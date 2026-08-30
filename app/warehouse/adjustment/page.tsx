'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Toast } from '@/components/Toast';
import { InvoiceItem } from '@/lib/parties';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function StockAdjustmentPage() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemId, setItemId] = useState('');
  const [direction, setDirection] = useState<'short' | 'over'>('short');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .eq('item_type', 'inventory')
      .order('name')
      .then(({ data }) => setItems((data as InvoiceItem[]) ?? []));
  }, []);

  const selected = items.find((i) => i.id === itemId) ?? null;
  const qtyNum = parseFloat(qty) || 0;
  const signedQty = direction === 'short' ? -qtyNum : qtyNum;
  const newBalance = selected ? selected.quantity_on_hand + signedQty : null;

  async function handleSubmit() {
    if (!selected) return setError('Select an item.');
    if (qtyNum <= 0) return setError('Enter a quantity greater than zero.');
    if (!reason.trim()) return setError('A reason is required.');
    if (newBalance !== null && newBalance < 0) return setError(`That would take ${selected.name} below zero.`);

    setSaving(true);
    setError(null);
    try {
      const { data: entryNumber, error: rpcErr } = await supabase.rpc('adjust_stock', {
        p_item_id: selected.id,
        p_qty_change: signedQty,
        p_reason: reason.trim(),
        p_created_by_name: currentUser.name,
      });
      if (rpcErr) throw rpcErr;
      setNote(`Adjusted ${selected.name} by ${signedQty > 0 ? '+' : ''}${signedQty}. ${entryNumber}.`);
      setItems((prev) => prev.map((i) => (i.id === selected.id ? { ...i, quantity_on_hand: i.quantity_on_hand + signedQty } : i)));
      setItemId('');
      setQty('');
      setReason('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to post adjustment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <Link href="/warehouse" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Warehouse</Link>
          <div className="mt-1 mb-1"><RowanWordmark markSize={32} /></div>
          <h1 className="text-xl font-black text-rowan-navy mb-1">Stock Adjustment</h1>
          <p className="text-[11px] text-gray-400 mb-6">
            Correct a mismatch between a physical count and what the books show. Posts a proper GL entry against
            Stock Adjustments / Write-offs — this isn't a silent quantity edit.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[11px]">Item</label>
              <SearchableSelect
                value={itemId}
                onChange={setItemId}
                options={items.map((i) => ({
                  value: i.id,
                  label: `${i.code} — ${i.name} (on hand: ${i.quantity_on_hand})`,
                }))}
                placeholder="Search by name or code…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[11px]">Direction</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden text-[12px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDirection('short')}
                    className={`flex-1 py-2 transition ${direction === 'short' ? 'bg-rowan-red text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    Short (−)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('over')}
                    className={`flex-1 py-2 transition ${direction === 'over' ? 'bg-rowan-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    Over (+)
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[11px]">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px]"
                  placeholder="0"
                />
              </div>
            </div>

            {selected && qtyNum > 0 && (
              <p className="text-[11px] text-gray-500 bg-rowan-bg rounded px-3 py-2">
                {selected.name}: {selected.quantity_on_hand} → <span className="font-bold text-rowan-navy">{newBalance}</span> on hand
              </p>
            )}

            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[11px]">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Physical count on 30 Aug — found 3 short in the cutting room"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px]"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-rowan-navy text-white py-3 rounded-lg font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50"
            >
              {saving ? 'Posting…' : 'Post Adjustment'}
            </button>
          </div>
        </div>
      </div>

      {note && <Toast message={note} kind="success" onClose={() => setNote(null)} />}
      {error && <Toast message={error} kind="error" onClose={() => setError(null)} />}
    </div>
  );
}
