'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { PartyDraft, PartyKind, TERMS_OPTIONS, emptyPartyDraft } from '@/lib/parties';

export function PartyModal({
  kind,
  initial,
  onClose,
  onSave,
}: {
  kind: PartyKind;
  initial?: Partial<PartyDraft>;
  onClose: () => void;
  onSave: (draft: PartyDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PartyDraft>({ ...emptyPartyDraft(), ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = kind === 'vendor' ? 'Vendor' : 'Customer';

  function set<K extends keyof PartyDraft>(key: K, val: PartyDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function handleSave() {
    if (!draft.display_name.trim()) {
      setError('Display name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e: any) {
      setError(e.message ?? `Failed to save ${label.toLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="bg-rowan-navy text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="font-bold text-sm">New {label}</h3>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-3 text-[12px]">
          {error && <div className="bg-red-50 text-rowan-red text-[11px] font-bold px-3 py-2 rounded">{error}</div>}

          <div>
            <label className="block font-bold text-gray-500 mb-1">Display Name *</label>
            <input
              autoFocus
              value={draft.display_name}
              onChange={(e) => set('display_name', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
              placeholder={kind === 'vendor' ? 'e.g. Ceylon Fabrics (Pvt) Ltd' : 'e.g. Andre Lifestyle Clothing'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Company Name</label>
              <input value={draft.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Contact Person</label>
              <input value={draft.contact_person ?? ''} onChange={(e) => set('contact_person', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Email</label>
              <input value={draft.email ?? ''} onChange={(e) => set('email', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Phone</label>
              <input value={draft.phone ?? ''} onChange={(e) => set('phone', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1">Address</label>
            <textarea value={draft.address ?? ''} onChange={(e) => set('address', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">City</label>
              <input value={draft.city ?? ''} onChange={(e) => set('city', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">TIN / VAT No.</label>
              <input value={draft.tin_vat ?? ''} onChange={(e) => set('tin_vat', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Payment Terms</label>
              <SearchableSelect
                value={draft.payment_terms}
                onChange={(v) => set('payment_terms', v as any)}
                options={TERMS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Opening Balance</label>
              <input
                type="number"
                value={draft.opening_balance}
                onChange={(e) => set('opening_balance', parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1">Notes</label>
            <textarea value={draft.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-gray-50 rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-bold text-gray-500 hover:text-rowan-navy">Cancel</button>
          <button type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-rowan-navy text-white px-5 py-2 rounded text-[11px] font-bold hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <LoadingSpinner size="sm" />}
            Save {label}
          </button>
        </div>
      </div>
    </div>
  );
}
