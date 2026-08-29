'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type Row = {
  legacyId: number;
  file: File | null;
  previewUrl: string | null;
  date: string;
  code: string;
  customer: string;
  item: string;
  qty: string;
  price: string;
  total: string; // circled/written total from the paper invoice — editable, defaults to qty*price
  cancelled: boolean;
  result: 'idle' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
};

function newRow(legacyId: number): Row {
  return {
    legacyId,
    file: null,
    previewUrl: null,
    date: '',
    code: 'N/A',
    customer: 'Lady J, Maharagama',
    item: '',
    qty: '',
    price: '',
    total: '',
    cancelled: false,
    result: 'idle',
  };
}

export default function LadyJUploadPage() {
  const [secret, setSecret] = useState('');
  const [secretSaved, setSecretSaved] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [nextId, setNextId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('ladyJUploadSecret') : null;
    if (saved) {
      setSecret(saved);
      setSecretSaved(true);
    }
  }, []);

  async function fetchNextId(currentSecret: string) {
    try {
      const res = await fetch(`/api/lady-j/upload?secret=${encodeURIComponent(currentSecret)}`);
      const json = await res.json();
      if (res.ok) {
        setNextId(json.nextId);
        setRows((prev) => (prev.length === 0 ? [newRow(json.nextId)] : prev));
      }
    } catch {
      // ignore — user can still type legacy IDs manually
    }
  }

  function handleSaveSecret() {
    sessionStorage.setItem('ladyJUploadSecret', secret);
    setSecretSaved(true);
    fetchNextId(secret);
  }

  function addRow() {
    const last = rows[rows.length - 1];
    const id = last ? last.legacyId + 1 : nextId ?? 1;
    setRows((prev) => [...prev, newRow(id)]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function handleFileChange(idx: number, file: File | null) {
    const previewUrl = file ? URL.createObjectURL(file) : null;
    updateRow(idx, { file, previewUrl });
  }

  function autoTotal(idx: number, qty: string, price: string) {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    updateRow(idx, { qty, price, total: q && p ? String(Math.round(q * p * 100) / 100) : rows[idx].total });
  }

  function matchStatusFor(row: Row): 'OK' | 'MISMATCH' | 'N/A' {
    if (row.cancelled) return 'N/A';
    const q = parseFloat(row.qty) || 0;
    const p = parseFloat(row.price) || 0;
    const t = parseFloat(row.total) || 0;
    if (!q || !p || !t) return 'N/A';
    return Math.round(q * p * 100) / 100 === Math.round(t * 100) / 100 ? 'OK' : 'MISMATCH';
  }

  async function submitRow(idx: number) {
    const row = rows[idx];
    updateRow(idx, { result: 'uploading' });

    const form = new FormData();
    form.set('secret', secret);
    form.set('legacyId', String(row.legacyId));
    form.set('date', row.date);
    form.set('code', row.code || 'N/A');
    form.set('customer', row.customer);
    form.set('item', row.item);
    form.set('qty', row.qty || '0');
    form.set('price', row.price || '0');
    form.set('total', row.total || '0');
    form.set('matchStatus', matchStatusFor(row));
    form.set('cancelled', String(row.cancelled));
    if (row.file) form.set('image', row.file);

    try {
      const res = await fetch('/api/lady-j/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      updateRow(idx, { result: 'done' });
      return true;
    } catch (e: any) {
      updateRow(idx, { result: 'error', errorMsg: e.message });
      return false;
    }
  }

  async function submitAll() {
    setSubmitting(true);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].result === 'done') continue;
      await submitRow(i);
    }
    setSubmitting(false);
  }

  const doneCount = rows.filter((r) => r.result === 'done').length;

  if (!secretSaved) {
    return (
      <div className="min-h-screen bg-rowan-bg flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-sm w-full">
          <RowanWordmark markSize={32} />
          <h1 className="text-lg font-black text-rowan-navy mt-3 mb-1">Upload Invoices</h1>
          <p className="text-sm text-gray-500 mb-4">
            Enter the upload secret (set as <code className="text-xs bg-gray-100 px-1 rounded">LADY_J_UPLOAD_SECRET</code> in
            Vercel) to continue.
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Upload secret"
            className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
          />
          <button
            onClick={handleSaveSecret}
            disabled={!secret}
            className="w-full bg-rowan-navy text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-rowan-red transition disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <RowanWordmark markSize={36} />
            <div>
              <h1 className="text-xl font-black text-rowan-navy">Upload New Invoice Scans</h1>
              <p className="text-sm text-gray-500">
                Next free invoice # is <span className="font-bold">{nextId ?? '…'}</span> · {doneCount}/{rows.length}{' '}
                uploaded this session
              </p>
            </div>
          </div>
          <Link
            href="/accounting/lady-j-invoices"
            className="text-sm font-semibold text-rowan-navy hover:text-rowan-red transition-colors"
          >
            ← Back to Lady J Invoices
          </Link>
        </div>

        <div className="space-y-4">
          {rows.map((row, idx) => {
            const status = matchStatusFor(row);
            return (
              <div
                key={idx}
                className={`bg-white rounded-xl shadow-sm border p-4 grid grid-cols-1 md:grid-cols-[140px_1fr_auto] gap-4 ${
                  row.result === 'done'
                    ? 'border-green-300'
                    : row.result === 'error'
                    ? 'border-red-300'
                    : 'border-gray-200'
                }`}
              >
                {/* Image */}
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1">#{row.legacyId}</div>
                  <div
                    onClick={() => fileInputRefs.current[idx]?.click()}
                    className="w-full aspect-[3/4] rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs cursor-pointer overflow-hidden bg-gray-50"
                  >
                    {row.previewUrl ? (
                      <img src={row.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      'Click to add photo'
                    )}
                  </div>
                  <input
                    ref={(el) => {
                      fileInputRefs.current[idx] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(idx, e.target.files?.[0] ?? null)}
                  />
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="text-xs col-span-2 sm:col-span-1">
                    Date
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(idx, { date: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs">
                    Code
                    <input
                      value={row.code}
                      onChange={(e) => updateRow(idx, { code: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs">
                    Customer
                    <select
                      value={row.customer}
                      onChange={(e) => updateRow(idx, { customer: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    >
                      <option>Lady J, Maharagama</option>
                      <option>Lady J, Borella</option>
                      <option>Andre Life Style Clothing (Pvt) Ltd</option>
                    </select>
                  </label>
                  <label className="text-xs col-span-2 sm:col-span-3">
                    Item description
                    <input
                      value={row.item}
                      onChange={(e) => updateRow(idx, { item: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs">
                    Qty
                    <input
                      type="number"
                      value={row.qty}
                      onChange={(e) => autoTotal(idx, e.target.value, row.price)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs">
                    Unit Price
                    <input
                      type="number"
                      value={row.price}
                      onChange={(e) => autoTotal(idx, row.qty, e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs">
                    Written Total
                    <input
                      type="number"
                      value={row.total}
                      onChange={(e) => updateRow(idx, { total: e.target.value })}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 mt-0.5"
                    />
                  </label>
                  <label className="text-xs col-span-2 sm:col-span-3 flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      checked={row.cancelled}
                      onChange={(e) => updateRow(idx, { cancelled: e.target.checked })}
                    />
                    Cancelled / voided on the paper invoice
                  </label>
                  {!row.cancelled && (
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full inline-block w-fit col-span-2 sm:col-span-3 ${
                        status === 'OK'
                          ? 'bg-green-100 text-green-700'
                          : status === 'MISMATCH'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {status}
                      {status === 'MISMATCH' && ' — qty × price ≠ written total, check the scan'}
                    </div>
                  )}
                  {row.result === 'error' && (
                    <div className="text-xs text-red-600 col-span-2 sm:col-span-3">{row.errorMsg}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end justify-between gap-2">
                  <button onClick={() => removeRow(idx)} className="text-xs text-gray-400 hover:text-rowan-red">
                    Remove
                  </button>
                  <button
                    onClick={() => submitRow(idx)}
                    disabled={row.result === 'uploading' || row.result === 'done' || !row.item}
                    className="px-3 py-1.5 rounded-lg bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red transition disabled:opacity-40 inline-flex items-center gap-2"
                  >
                    {row.result === 'uploading' && <LoadingSpinner size="sm" />}
                    {row.result === 'done' ? 'Uploaded ✓' : 'Upload'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={addRow}
            className="px-4 py-2 rounded-lg border border-rowan-navy text-rowan-navy text-sm font-bold hover:bg-white transition"
          >
            + Add Invoice
          </button>
          <button
            onClick={submitAll}
            disabled={submitting || rows.length === 0}
            className="px-4 py-2 rounded-lg bg-rowan-navy text-white text-sm font-bold hover:bg-rowan-red transition disabled:opacity-40 inline-flex items-center gap-2"
          >
            {submitting && <LoadingSpinner size="sm" />}
            Upload All Remaining
          </button>
        </div>
      </div>
    </div>
  );
}
