'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  attached: boolean;
};

type QueuedImage = {
  key: string;
  file: File;
  previewUrl: string;
  ocrStatus: 'scanning' | 'matched' | 'no-match' | 'skipped';
  suggestedLegacyId: number | null;
  attaching: boolean;
  attachedTo: MissingInvoice | null;
  error: string | null;
};

function fmtMoney(n: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-LK').format(Math.round(n || 0));
}

let ocrWorkerPromise: Promise<any> | null = null;
async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      await worker.setParameters({ tessedit_char_whitelist: '0123456789' });
      return worker;
    })();
  }
  return ocrWorkerPromise;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Best-effort only: crops the top-right corner (where the printed invoice
// # sits on these scans) and OCRs just that. Skips silently on any failure —
// this is a speed convenience, not something to block or retry on.
async function quickOcrInvoiceNumber(file: File): Promise<number | null> {
  try {
    const img = await loadImage(file);
    const cropX = img.width * 0.55;
    const cropW = img.width * 0.45;
    const cropH = img.height * 0.14;
    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, cropX, 0, cropW, cropH, 0, 0, cropW, cropH);

    const worker = await getOcrWorker();
    const ocr = worker.recognize(canvas);
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
    const result: any = await Promise.race([ocr, timeout]);
    if (!result) return null;

    const digits = result.data.text.match(/\d{2,4}/g)?.[0];
    return digits ? Number(digits) : null;
  } catch {
    return null;
  }
}

export default function AttachScansPage() {
  const [missing, setMissing] = useState<MissingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueuedImage[]>([]);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);
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
        attached: false,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMissing();
  }, [loadMissing]);

  function addFilesToQueue(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    const items: QueuedImage[] = arr.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      ocrStatus: 'scanning',
      suggestedLegacyId: null,
      attaching: false,
      attachedTo: null,
      error: null,
    }));
    setQueue((prev) => [...prev, ...items]);

    // Run OCR in the background per file, sequentially, best-effort.
    (async () => {
      for (const item of items) {
        const legacyId = await quickOcrInvoiceNumber(item.file);
        setQueue((prev) =>
          prev.map((q) =>
            q.key === item.key
              ? { ...q, ocrStatus: legacyId ? 'matched' : 'no-match', suggestedLegacyId: legacyId }
              : q
          )
        );
      }
    })();
  }

  async function attachImage(queueKey: string, target: MissingInvoice) {
    const item = queue.find((q) => q.key === queueKey);
    if (!item || item.attaching || item.attachedTo) return;

    setQueue((prev) => prev.map((q) => (q.key === queueKey ? { ...q, attaching: true, error: null } : q)));

    try {
      const ext = item.file.name.split('.').pop() || 'webp';
      const idPart = target.legacyId ?? target.invoiceNumber.replace(/[^a-zA-Z0-9-]/g, '');
      const path = `${idPart}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, item.file, {
        contentType: item.file.type || 'image/webp',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updErr } = await supabase
        .from('invoices')
        .update({ image_url: pub.publicUrl })
        .eq('id', target.id);
      if (updErr) throw updErr;

      setQueue((prev) => prev.map((q) => (q.key === queueKey ? { ...q, attaching: false, attachedTo: target } : q)));
      setMissing((prev) => prev.filter((m) => m.id !== target.id));
    } catch (e: any) {
      setQueue((prev) =>
        prev.map((q) => (q.key === queueKey ? { ...q, attaching: false, error: e.message ?? 'Attach failed' } : q))
      );
    }
  }

  function handleRowDrop(e: React.DragEvent, row: MissingInvoice) {
    e.preventDefault();
    setDragOverRowId(null);
    const key = e.dataTransfer.getData('text/plain');
    if (key) attachImage(key, row);
  }

  function handleZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropZoneActive(false);
    if (e.dataTransfer.files?.length) addFilesToQueue(e.dataTransfer.files);
  }

  const activeQueue = queue.filter((q) => !q.attachedTo);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <RowanWordmark markSize={36} />
            <div>
              <h1 className="text-xl font-black text-rowan-navy">Attach Invoice Scans</h1>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading…' : `${missing.length} invoice${missing.length === 1 ? '' : 's'} missing an attachment`}
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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* LEFT: larger panel, invoices missing a scan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-rowan-bgWhite">
              <h2 className="text-sm font-black text-rowan-navy uppercase tracking-wide">
                Invoices Without an Attachment — drop an image on a row to attach
              </h2>
            </div>
            {loading ? (
              <div className="p-16 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : missing.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">
                Every invoice has an attachment. Drop new images on the right to add new invoices.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[75vh] overflow-y-auto">
                {missing.map((row) => (
                  <div
                    key={row.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverRowId(row.id);
                    }}
                    onDragLeave={() => setDragOverRowId((id) => (id === row.id ? null : id))}
                    onDrop={(e) => handleRowDrop(e, row)}
                    className={`px-4 py-3 flex items-center gap-4 transition-colors ${
                      dragOverRowId === row.id ? 'bg-rowan-navy/10 ring-2 ring-inset ring-rowan-navy' : ''
                    }`}
                  >
                    <div className="w-16 text-xs font-bold text-gray-400">#{row.legacyId ?? row.invoiceNumber}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-rowan-navy truncate">{row.item}</div>
                      <div className="text-xs text-gray-400">
                        {row.customer} · {row.date ?? 'no date'}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-rowan-navy whitespace-nowrap">{fmtMoney(row.total)}</div>
                    <div className="w-28 text-center">
                      <span className="text-[11px] text-gray-400 border border-dashed border-gray-300 rounded-full px-2 py-1">
                        drop here
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: narrower, bulk drop zone + queue */}
          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDropZoneActive(true);
              }}
              onDragLeave={() => setDropZoneActive(false)}
              onDrop={handleZoneDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                dropZoneActive ? 'border-rowan-navy bg-rowan-navy/5' : 'border-gray-300'
              }`}
            >
              <div className="text-sm font-bold text-rowan-navy">Drop invoice files here</div>
              <div className="text-xs text-gray-400 mt-1">or click to select — you can select many at once</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addFilesToQueue(e.target.files)}
              />
            </div>

            {activeQueue.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
                {activeQueue.map((item) => {
                  const suggested = item.suggestedLegacyId
                    ? missing.find((m) => m.legacyId != null && m.legacyId === item.suggestedLegacyId)
                    : null;
                  return (
                    <div
                      key={item.key}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', item.key)}
                      className="p-3 flex gap-3 items-center cursor-grab active:cursor-grabbing"
                    >
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="w-12 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {item.attaching ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <LoadingSpinner size="sm" /> Attaching…
                          </div>
                        ) : item.ocrStatus === 'scanning' ? (
                          <div className="text-xs text-gray-400">Scanning for invoice #…</div>
                        ) : suggested ? (
                          <button
                            onClick={() => attachImage(item.key, suggested)}
                            className="text-xs font-bold text-white bg-rowan-navy hover:bg-rowan-red transition-colors px-2 py-1 rounded"
                          >
                            Attach to #{suggested.legacyId ?? suggested.invoiceNumber} →
                          </button>
                        ) : (
                          <div className="text-xs text-gray-400">
                            {item.ocrStatus === 'matched'
                              ? `Read #${item.suggestedLegacyId} but no open invoice matches — drag onto the correct row`
                              : 'No # detected — drag onto the correct row'}
                          </div>
                        )}
                        {item.error && <div className="text-[11px] text-red-600 mt-1">{item.error}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {queue.some((q) => q.attachedTo) && (
              <div className="bg-white rounded-xl shadow-sm border border-green-200 divide-y divide-gray-100">
                {queue
                  .filter((q) => q.attachedTo)
                  .map((item) => (
                    <div key={item.key} className="p-3 flex items-center gap-3">
                      <img src={item.previewUrl} alt="" className="w-10 h-12 object-cover rounded border border-gray-200" />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="text-green-700 font-bold">Attached ✓</span>{' '}
                        <span className="text-gray-500">#{item.attachedTo!.legacyId ?? item.attachedTo!.invoiceNumber}</span>
                      </div>
                      <Link
                        href={`/accounting/invoice?id=${item.attachedTo!.id}`}
                        target="_blank"
                        className="text-xs font-bold text-rowan-navy hover:text-rowan-red whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
