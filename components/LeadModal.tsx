'use client';

import React, { useState } from 'react';
import { LeadDraft, STAGE_OPTIONS, emptyLeadDraft } from '@/lib/crm';

export function LeadModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Partial<LeadDraft>;
  onClose: () => void;
  onSave: (draft: LeadDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<LeadDraft>({ ...emptyLeadDraft(), ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LeadDraft>(key: K, val: LeadDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function handleSave() {
    if (!draft.company_name.trim()) {
      setError('Company name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save lead.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="bg-rowan-navy text-white px-5 py-3 rounded-t-lg flex justify-between items-center">
          <h3 className="font-bold text-sm">{initial ? 'Edit Lead' : 'New Lead'}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-3 text-[12px]">
          {error && <div className="bg-red-50 text-rowan-red text-[11px] font-bold px-3 py-2 rounded">{error}</div>}

          <div>
            <label className="block font-bold text-gray-500 mb-1">Company Name *</label>
            <input
              autoFocus
              value={draft.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
              placeholder="e.g. Andre Lifestyle Clothing"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Contact Person</label>
              <input value={draft.contact_person ?? ''} onChange={(e) => set('contact_person', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Source</label>
              <input
                value={draft.source ?? ''}
                onChange={(e) => set('source', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
                placeholder="Referral, website, trade show…"
              />
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-500 mb-1">Stage</label>
              <select value={draft.stage} onChange={(e) => set('stage', e.target.value as LeadDraft['stage'])} className="w-full border border-gray-300 rounded px-2 py-1.5">
                {STAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1">Estimated Value</label>
              <input
                type="number"
                value={draft.estimated_value}
                onChange={(e) => set('estimated_value', Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
              />
            </div>
          </div>

          {draft.stage === 'lost' && (
            <div>
              <label className="block font-bold text-gray-500 mb-1">Lost Reason</label>
              <input value={draft.lost_reason ?? ''} onChange={(e) => set('lost_reason', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          )}

          <div>
            <label className="block font-bold text-gray-500 mb-1">Notes</label>
            <textarea
              value={draft.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold bg-rowan-navy text-white hover:bg-rowan-red transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
