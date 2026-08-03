'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { createStyle, emptyStyleDraft, suggestNextStyleNo, StyleDraft, StyleStatus } from '@/lib/styles';

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState('');

  function commit() {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  }

  return (
    <div>
      <label className="block font-bold text-gray-500 mb-1 text-[12px]">{label}</label>
      <div className="border border-gray-300 rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center">
        {values.map((v) => (
          <span key={v} className="bg-rowan-navy/10 text-rowan-navy text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-rowan-navy/50 hover:text-rowan-red">
              ✕
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="flex-1 min-w-[80px] text-[12px] outline-none py-0.5"
        />
      </div>
    </div>
  );
}

export default function NewStylePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <NewStyleForm />
    </Suspense>
  );
}

function NewStyleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTab = searchParams.get('returnTab');
  const [draft, setDraft] = useState<StyleDraft>(emptyStyleDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    suggestNextStyleNo().then((no) => setDraft((d) => ({ ...d, style_no: no })));
  }, []);

  function set<K extends keyof StyleDraft>(key: K, val: StyleDraft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function handleSave() {
    if (!draft.style_no.trim() || !draft.name.trim()) {
      setError('Style # and name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await createStyle(draft);
      router.push(returnTab ? `/style/${created.id}?tab=${returnTab}` : `/style/${created.id}`);
    } catch (e: any) {
      setError(e.message?.includes('duplicate') ? `Style # "${draft.style_no}" is already in use.` : e.message ?? 'Failed to create style.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-2xl mx-auto">
        <Link href={returnTab === 'bom' ? '/style/bom' : returnTab === 'costing' ? '/style/costing' : '/style'} className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← {returnTab === 'bom' ? 'Bill of Materials' : returnTab === 'costing' ? 'Product Costing' : 'Style Numbers'}</Link>
        <h1 className="text-xl font-black text-rowan-navy mt-1 mb-4">Create New Style</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4 text-sm">
          {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-3 py-2 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Style # *</label>
              <input value={draft.style_no} onChange={(e) => set('style_no', e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Status</label>
              <SearchableSelect
                value={draft.status}
                onChange={(v) => set('status', v as StyleStatus)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'sample', label: 'Sample' },
                  { value: 'discontinued', label: 'Discontinued' },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1 text-[12px]">Style Name *</label>
            <input autoFocus value={draft.name} onChange={(e) => set('name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" placeholder="e.g. Men's Crew Neck Tee" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Category</label>
              <input value={draft.category ?? ''} onChange={(e) => set('category', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" placeholder="e.g. T-Shirt, Polo, Trouser" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Season</label>
              <input value={draft.season ?? ''} onChange={(e) => set('season', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" placeholder="e.g. Summer 2026" />
            </div>
          </div>

          <TagInput label="Sizes" values={draft.sizes} onChange={(v) => set('sizes', v)} placeholder="Type a size and press Enter" />
          <TagInput label="Colourways" values={draft.colorways} onChange={(v) => set('colorways', v)} placeholder="Type a colour and press Enter" />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Labour Cost / Unit</label>
              <input type="number" value={draft.labor_cost_per_unit} onChange={(e) => set('labor_cost_per_unit', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Overhead Cost / Unit</label>
              <input type="number" value={draft.overhead_cost_per_unit} onChange={(e) => set('overhead_cost_per_unit', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block font-bold text-gray-500 mb-1 text-[12px]">Selling Price</label>
              <input type="number" value={draft.selling_price} onChange={(e) => set('selling_price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-500 mb-1 text-[12px]">Notes</label>
            <textarea value={draft.notes ?? ''} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link href={returnTab === 'bom' ? '/style/bom' : returnTab === 'costing' ? '/style/costing' : '/style'} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-rowan-navy">Cancel</Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <LoadingSpinner size="sm" />}
              Save Style — Continue to BOM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
