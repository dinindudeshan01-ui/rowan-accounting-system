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

type ScanStatus = 'pending' | 'attaching' | 'error';

type ScanItem = {
  id: string; // client-side id for this queued scan
  file: File;
  previewUrl: string;
  status: ScanStatus;
  error?: string;
};

function fmtMoney(n: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-LK').format(Math.round(n || 0));
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AttachScansPage() {
  const [missing, setMissing] = useState<MissingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'item_az' | 'item_za' | 'amount_asc' | 'amount_desc' | 'date_asc' | 'date_desc' | 'id_asc'>('id_asc');
  const [justAttached, setJustAttached] = useState(0);

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [bulkDropActive, setBulkDropActive] = useState(false);
  const [rowDropTarget, setRowDropTarget] = useState<string | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const rowFileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

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
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMissing();
  }, [loadMissing]);

  const customers = useMemo(() => {
    const set = new Set(missing.map((m) => m.customer).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [missing]);

  const rows = useMemo(() => {
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

  // ---- Queueing ---------------------------------------------------------

  function addFiles(files: FileList | File[]) {
    const items: ScanItem[] = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id: uid(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      }));
    if (!items.length) return;
    setScans((prev) => [...prev, ...items]);
  }

  function removeScan(scanId: string) {
    setScans((prev) => prev.filter((s) => s.id !== scanId));
  }

  // ---- Attaching ----------------------------------------------------------

  async function attachFile(invoice: MissingInvoice, file: File, scanId?: string) {
    if (scanId) setScans((prev) => prev.map((s) => (s.id === scanId ? { ...s, status: 'attaching' } : s)));

    try {
      const ext = file.name.split('.').pop() || 'webp';
      const idPart = invoice.legacyId ?? invoice.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '');
      const path = `${idPart}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'image/webp',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updErr } = await supabase.from('invoices').update({ image_url: pub.publicUrl }).eq('id', invoice.id);
      if (updErr) throw updErr;

      setMissing((prev) => prev.filter((m) => m.id !== invoice.id));
      setJustAttached((n) => n + 1);
      if (scanId) setScans((prev) => prev.filter((s) => s.id !== scanId));
    } catch (e: any) {
      if (scanId) {
        setScans((prev) => prev.map((s) => (s.id === scanId ? { ...s, status: 'error', error: e.message ?? 'Attach failed — try again' } : s)));
      }
    }
  }

  // ---- Drag and drop ------------------------------------------------------

  function handleBulkDrop(e: React.DragEvent) {
    e.preventDefault();
    setBulkDropActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function handleScanDragStart(e: React.DragEvent, scanId: string) {
    e.dataTransfer.setData('text/x-scan-id', scanId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleRowDrop(e: React.DragEvent, invoice: MissingInvoice) {
    e.preventDefault();
    setRowDropTarget(null);
    const scanId = e.dataTransfer.getData('text/x-scan-id');
    if (scanId) {
      const scan = scans.find((s) => s.id === scanId);
      if (scan) attachFile(invoice, scan.file, scan.id);
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) attachFile(invoice, file);
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
          <Link href="/accounting/invoices" className="text-sm font-semibold text-rowan-navy hover:text-rowan-red transition-colors">
            ← Back to Invoices
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          {/* LEFT: invoices without an attachment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-rowan-bgWhite">
              <span className="text-xs font-black text-rowan-navy uppercase tracking-wide">
                Invoices without an attachment — drop an image on a row to attach
              </span>
            </div>

            <div className="px-3 py-2 border-b border-gray-200 flex flex-wrap gap-2">
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
                  <option key={c} value={c}>
                    {c}
                  </option>
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

            <div className="max-h-[640px] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-16 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-400">
                  {missing.length === 0 ? '🎉 Every invoice has an attachment.' : 'No invoices match your search/filter.'}
                </div>
              ) : (
                rows.map((row) => (
                  <div
                    key={row.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setRowDropTarget(row.id);
                    }}
                    onDragLeave={() => setRowDropTarget((cur) => (cur === row.id ? null : cur))}
                    onDrop={(e) => handleRowDrop(e, row)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      rowDropTarget === row.id ? 'bg-rowan-navy/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 shrink-0 text-[11px] font-bold text-gray-400">#{row.legacyId ?? row.invoiceNumber}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-rowan-navy truncate">{row.item}</div>
                      <div className="text-xs text-gray-400 truncate">
                        {row.customer} · {row.date ?? 'no date'}
                      </div>
                    </div>
                    <div className="w-28 shrink-0 text-right text-sm font-black text-rowan-navy">{fmtMoney(row.total)}</div>
                    <button
                      onClick={() => rowFileInputRefs.current.get(row.id)?.click()}
                      className={`shrink-0 text-[11px] font-bold rounded-full border px-3 py-1.5 transition-colors ${
                        rowDropTarget === row.id
                          ? 'border-rowan-navy text-rowan-navy bg-white'
                          : 'border-gray-300 text-gray-400 hover:border-rowan-navy hover:text-rowan-navy'
                      }`}
                    >
                      drop here
                    </button>
                    <input
                      ref={(el) => {
                        if (el) rowFileInputRefs.current.set(row.id, el);
                        else rowFileInputRefs.current.delete(row.id);
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) attachFile(row, file);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: bulk drop + scan queue */}
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setBulkDropActive(true);
              }}
              onDragLeave={() => setBulkDropActive(false)}
              onDrop={handleBulkDrop}
              onClick={() => bulkFileInputRef.current?.click()}
              className={`bg-white rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                bulkDropActive ? 'border-rowan-navy bg-rowan-navy/5' : 'border-gray-300'
              }`}
            >
              <div className="text-sm font-bold text-rowan-navy">Drop invoice files here</div>
              <div className="text-xs text-gray-400 mt-1">or click to select — you can select many at once</div>
              <input
                ref={bulkFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <div className="px-4 py-2 border-b border-gray-200 bg-rowan-bgWhite">
                <span className="text-[11px] font-black text-rowan-navy uppercase tracking-wide">
                  {scans.length === 0 ? 'Scan queue' : `${scans.length} scan${scans.length === 1 ? '' : 's'} waiting`}
                </span>
              </div>
              {scans.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Uploaded scans will show up here — drag one onto its row to attach it.
                </div>
              ) : (
                <div className="max-h-[560px] overflow-y-auto divide-y divide-gray-100">
                  {scans.map((s) => (
                    <div
                      key={s.id}
                      draggable={s.status === 'pending'}
                      onDragStart={(e) => handleScanDragStart(e, s.id)}
                      className={`flex items-center gap-3 px-3 py-3 ${s.status === 'pending' ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    >
                      <img src={s.previewUrl} alt="" className="w-10 h-12 object-cover rounded border border-gray-200 shrink-0" />
                      <div className="flex-1 min-w-0">
                        {s.status === 'attaching' ? (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <LoadingSpinner size="sm" /> Attaching…
                          </div>
                        ) : s.status === 'error' ? (
                          <div className="text-[11px] text-red-600 leading-snug">{s.error}</div>
                        ) : (
                          <div className="text-[11px] text-gray-500 leading-snug truncate">{s.file.name}</div>
                        )}
                      </div>
                      {s.status === 'pending' && (
                        <button
                          onClick={() => removeScan(s.id)}
                          className="shrink-0 text-gray-300 hover:text-rowan-red transition-colors text-xs font-bold px-1"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
