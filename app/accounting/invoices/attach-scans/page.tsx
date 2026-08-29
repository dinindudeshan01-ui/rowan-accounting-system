'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';

const BUCKET = 'lady-j-invoices';

type MissingInvoice = {
  id: string; // uuid
  legacyId: number | null; // only set for legacy Lady J imports; null otherwise
  invoiceNumber: string;
  date: string | null;
  customer: string;
  item: string;
  total: number;
};

function fmtMoney(n: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-LK').format(Math.round(n || 0));
}

export default function AttachScansPage() {
  const [missing, setMissing] = useState<MissingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'item_az' | 'item_za' | 'amount_asc' | 'amount_desc' | 'date_asc' | 'date_desc' | 'id_asc'>('id_asc');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dropActive, setDropActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [justAttached, setJustAttached] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMissing = useCallback(async () => {
    setLoading(true);
    // Every invoice missing a *real* attachment, regardless of source.
    // Two cases count as "missing": image_url is NULL, or it's one of the
    // placeholder URLs left over from the 401-450 import (sql/031), which
    // used a literal 'SUPABASE_PROJECT' template domain that was never
    // swapped for the real project ref — those files were never actually
    // uploaded, so the URL 404s even though the column isn't null.
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, legacy_id, invoice_number, invoice_date, purchaser_name, total_amount, image_url')
      .or('image_url.is.null,image_url.ilike.%SUPABASE_PROJECT%')
      .order('invoice_date', { ascending: true });

    if (error || !invoices) {
      setMissing([]);
      setLoading(false);
      return;
    }

    const ids = invoices.map((i) => i.id);
    const { data: lines } = await supabase
      .from('invoice_lines')
      .select('invoice_id, description')
      .in('invoice_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

    const itemByInvoice = new Map<string, string>();
    for (const l of lines ?? []) {
      if (!itemByInvoice.has(l.invoice_id)) itemByInvoice.set(l.invoice_id, l.description);
    }

    setMissing(
      invoices.map((inv) => ({
        id: inv.id,
        legacyId: inv.legacy_id ?? null,
        invoiceNumber: inv.invoice_number,
        date: inv.invoice_date,
        customer: inv.purchaser_name,
        item: itemByInvoice.get(inv.id) ?? '—',
        total: Number(inv.total_amount) || 0,
      }))
    );
    setCurrentIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMissing();
  }, [loadMissing]);

  const customers = useMemo(() => {
    const set = new Set(missing.map((m) => m.customer).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [missing]);

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = missing.filter((row) => {
      const matchesSearch =
        !q ||
        row.item.toLowerCase().includes(q) ||
        row.customer.toLowerCase().includes(q) ||
        String(row.legacyId ?? '').includes(q) ||
        row.invoiceNumber.toLowerCase().includes(q);
      const matchesCustomer = customerFilter === 'all' || row.customer === customerFilter;
      return matchesSearch && matchesCustomer;
    });
    list = [...list];
    switch (sortBy) {
      case 'item_az':
        list.sort((a, b) => a.item.localeCompare(b.item));
        break;
      case 'item_za':
        list.sort((a, b) => b.item.localeCompare(a.item));
        break;
      case 'amount_asc':
        list.sort((a, b) => a.total - b.total);
        break;
      case 'amount_desc':
        list.sort((a, b) => b.total - a.total);
        break;
      case 'date_asc':
        list.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
        break;
      case 'date_desc':
        list.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
        break;
      case 'id_asc':
      default:
        list.sort((a, b) => (a.legacyId ?? 0) - (b.legacyId ?? 0));
        break;
    }
    return list;
  }, [missing, search, customerFilter, sortBy]);

  // Filtering/sorting can shift the current invoice out from under us —
  // clamp back into range rather than showing a blank state.
  useEffect(() => {
    if (currentIndex >= queue.length) setCurrentIndex(0);
  }, [queue.length, currentIndex]);

  const current = queue[currentIndex] ?? null;

  function pickFile() {
    if (!current || uploading) return;
    fileInputRef.current?.click();
  }

  async function attachFile(file: File) {
    if (!current || uploading) return;
    setUploading(true);
    setUploadErr(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const ext = file.name.split('.').pop() || 'webp';
      const idPart = current.legacyId ?? current.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '');
      const path = `${idPart}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'image/webp',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updErr } = await supabase
        .from('invoices')
        .update({ image_url: pub.publicUrl })
        .eq('id', current.id);
      if (updErr) throw updErr;

      // Remove it from the working list — the next invoice slides into
      // the same position automatically.
      setMissing((prev) => prev.filter((m) => m.id !== current.id));
      setJustAttached((n) => n + 1);
      setPreviewUrl(null);
    } catch (e: any) {
      setUploadErr(e.message ?? 'Attach failed — please try again.');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) attachFile(file);
  }

  function skip() {
    if (queue.length === 0) return;
    setCurrentIndex((i) => (i + 1) % queue.length);
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <RowanWordmark markSize={36} />
            <div>
              <h1 className="text-xl font-black text-rowan-navy">Attach Invoice Scans</h1>
              <p className="text-sm text-gray-500">
                {loading
                  ? 'Loading…'
                  : missing.length === 0
                  ? 'Every invoice has an attachment'
                  : `${missing.length} invoice${missing.length === 1 ? '' : 's'} missing an attachment${
                      justAttached > 0 ? ` · ${justAttached} attached this session` : ''
                    }`}
              </p>
            </div>
          </div>
          <Link
            href="/accounting/invoices"
            className="text-sm font-semibold text-rowan-navy hover:text-rowan-red transition-colors"
          >
            ← Back to Invoices
          </Link>
        </div>

        {/* Search / filter / sort */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 mb-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, customer, or invoice #…"
            className="flex-1 min-w-[180px] border border-gray-300 rounded px-3 py-1.5 text-[12px]"
          />
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-[12px] text-gray-700"
          >
            <option value="all">All customers</option>
            {customers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border border-gray-300 rounded px-2 py-1.5 text-[12px] text-gray-700"
          >
            <option value="id_asc">Invoice # (low → high)</option>
            <option value="item_az">Item (A → Z)</option>
            <option value="item_za">Item (Z → A)</option>
            <option value="amount_asc">Amount (low → high)</option>
            <option value="amount_desc">Amount (high → low)</option>
            <option value="date_asc">Date (oldest first)</option>
            <option value="date_desc">Date (newest first)</option>
          </select>
        </div>

        {/* One invoice at a time */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-xl mx-auto">
          {loading ? (
            <div className="p-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : missing.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-400">
              🎉 Every invoice has an attachment.
            </div>
          ) : !current ? (
            <div className="p-12 text-center text-sm text-gray-400">
              No invoices match your search/filter.
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-gray-200 bg-rowan-bgWhite flex items-center justify-between">
                <span className="text-xs font-black text-rowan-navy uppercase tracking-wide">
                  Invoice {currentIndex + 1} of {queue.length}
                </span>
                <button
                  onClick={skip}
                  className="text-xs font-bold text-gray-400 hover:text-rowan-navy transition-colors"
                >
                  Skip →
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <div className="text-[10px] uppercase text-gray-400 font-bold">
                    #{current.legacyId ?? current.invoiceNumber}
                  </div>
                  <div className="text-lg font-black text-rowan-navy">{current.item}</div>
                  <div className="text-sm text-gray-500">
                    {current.customer} · {current.date ?? 'no date'}
                  </div>
                  <div className="text-xl font-bold text-rowan-navy mt-1">{fmtMoney(current.total)}</div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropActive(true);
                  }}
                  onDragLeave={() => setDropActive(false)}
                  onDrop={handleDrop}
                  onClick={pickFile}
                  className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                    dropActive ? 'border-rowan-navy bg-rowan-navy/5' : 'border-gray-300'
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      {previewUrl && (
                        <img src={previewUrl} alt="" className="w-24 h-32 object-cover rounded border border-gray-200" />
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <LoadingSpinner size="sm" /> Attaching…
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-rowan-navy">Drop this invoice's file here</div>
                      <div className="text-xs text-gray-400 mt-1">or click to select a file</div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) attachFile(file);
                    }}
                  />
                </div>

                {uploadErr && <div className="text-[11px] text-red-600 text-center">{uploadErr}</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
