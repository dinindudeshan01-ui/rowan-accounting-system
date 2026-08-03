'use client';

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { supabase } from '@/lib/supabase';
import { ItemDraft, ItemType, MaterialClassification, emptyItemDraft } from '@/lib/parties';

const CLASSIFICATION_OPTIONS: { value: MaterialClassification; label: string; hint: string; accountSubtype: string }[] = [
  {
    value: 'direct_material',
    label: 'Direct Material',
    hint: 'Becomes part of the product (fabric, trims, packing) — traced to a style via its BOM.',
    accountSubtype: 'Direct Materials',
  },
  {
    value: 'direct_expense',
    label: 'Direct Other (Direct Expense)',
    hint: 'Traceable to a specific job but not a material itself (subcontract work, job-specific freight).',
    accountSubtype: 'Direct Expenses',
  },
  {
    value: 'indirect_material',
    label: 'Indirect Material',
    hint: "Consumed in the factory but not traced to one product (thread waste, machine oil, cleaning supplies) — Manufacturing Overhead, not Direct Materials.",
    accountSubtype: 'Manufacturing Overhead',
  },
];

export function ItemModal({
  initialName = '',
  onClose,
  onSave,
}: {
  initialName?: string;
  onClose: () => void;
  onSave: (draft: ItemDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ItemDraft>({ ...emptyItemDraft(), name: initialName });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expenseAccounts, setExpenseAccounts] = useState<{ id: string; name: string; code: string; subtype: string | null }[]>([]);

  useEffect(() => {
    supabase
      .from('chart_of_accounts')
      .select('id, name, code, subtype')
      .eq('is_active', true)
      .eq('type', 'expense')
      .order('code')
      .then(({ data }) => setExpenseAccounts(data ?? []));
  }, []);

  function set<K extends keyof ItemDraft>(key: K, val: ItemDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  const isStockTracked = draft.item_type === 'inventory';
  const matchingAccounts = draft.material_classification
    ? expenseAccounts.filter((a) => a.subtype === CLASSIFICATION_OPTIONS.find((c) => c.value === draft.material_classification)?.accountSubtype)
    : expenseAccounts;

  async function handleSave() {
    if (!draft.name.trim() || !draft.code.trim()) {
      setError('Item code and name are required.');
      return;
    }
    if (isStockTracked && draft.material_classification && !draft.expense_account_id) {
      setError('Select which expense account this posts to when issued from stock.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-rowan-navy text-white px-5 py-3 rounded-t-lg flex justify-between items-center sticky top-0">
          <h3 className="font-bold text-sm">New Item / Service</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-3 text-[12px]">
          {error && <div className="bg-red-50 text-rowan-red text-[11px] font-bold px-3 py-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Code *</label>
              <input value={draft.code} onChange={(e) => set('code', e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded px-2 py-1.5" placeholder="e.g. SVC-002" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Type</label>
              <SearchableSelect
                value={draft.item_type}
                onChange={(v) => set('item_type', v as ItemType)}
                options={[
                  { value: 'service', label: 'Service' },
                  { value: 'inventory', label: 'Inventory (stock-tracked)' },
                  { value: 'non_inventory', label: 'Non-inventory' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1">Name *</label>
            <input autoFocus value={draft.name} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1">Description</label>
            <textarea value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Default Unit Price</label>
              <input type="number" value={draft.unit_price} onChange={(e) => set('unit_price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Unit Cost</label>
              <input type="number" value={draft.unit_cost} onChange={(e) => set('unit_cost', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" placeholder="For materials in a BOM" />
            </div>
          </div>

          {isStockTracked && (
            <>
              <div>
                <label className="block font-bold text-gray-500 mb-1">Reorder Level (optional)</label>
                <input
                  type="number"
                  value={draft.reorder_level ?? ''}
                  onChange={(e) => set('reorder_level', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5"
                  placeholder="Flag low stock below this quantity"
                />
              </div>

              <div className="border-t border-gray-200 pt-3">
                <label className="block font-bold text-gray-500 mb-1.5">Cost Classification</label>
                <div className="space-y-1.5">
                  {CLASSIFICATION_OPTIONS.map((c) => (
                    <label
                      key={c.value}
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${
                        draft.material_classification === c.value ? 'border-rowan-navy bg-rowan-bg' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        className="mt-0.5"
                        checked={draft.material_classification === c.value}
                        onChange={() => set('material_classification', c.value)}
                      />
                      <span>
                        <span className="block font-bold text-rowan-navy">{c.label}</span>
                        <span className="block text-gray-500 text-[11px] mt-0.5">{c.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {draft.material_classification && (
                <div>
                  <label className="block font-bold text-gray-500 mb-1">Posts to (when issued from stock) *</label>
                  <SearchableSelect
                    value={draft.expense_account_id ?? ''}
                    onChange={(v) => set('expense_account_id', v || null)}
                    options={matchingAccounts.map((a) => ({ value: a.id, label: a.name, sublabel: a.code }))}
                    emptyMessage="No accounts in this category yet — add one in Journal Entry or Record Expense."
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-rowan-navy">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-rowan-navy text-white px-5 py-2 rounded text-[11px] font-bold hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}
