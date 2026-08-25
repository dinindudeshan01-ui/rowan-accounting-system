'use client';

import React, { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'lady-j-invoices';
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

type Props = {
  imageUrl: string | null;
  invoiceId: string | null;
  onReplaced: (newUrl: string) => void;
};

export function InvoiceImagePanel({ imageUrl, invoiceId, onReplaced }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clampZoom(z: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  }

  function zoomIn() {
    setZoom((z) => clampZoom(z + ZOOM_STEP));
  }
  function zoomOut() {
    setZoom((z) => {
      const nz = clampZoom(z - ZOOM_STEP);
      if (nz === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return nz;
    });
  }
  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(e: React.WheelEvent) {
    if (!imageUrl) return;
    e.preventDefault();
    setZoom((z) => {
      const next = clampZoom(z + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (zoom <= 1) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }
  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }
  function handleMouseUp() {
    setDragging(false);
  }

  async function handleReplaceFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !invoiceId) return;

    setUploading(true);
    setUploadErr(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${invoiceId}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const newUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from('invoices')
        .update({ image_url: newUrl })
        .eq('id', invoiceId);
      if (updErr) throw updErr;

      resetView();
      onReplaced(newUrl);
    } catch (err: any) {
      setUploadErr(err.message ?? 'Failed to replace image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="text-xs font-black text-rowan-navy uppercase">Scanned Document</div>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={!imageUrl || zoom <= MIN_ZOOM}
            title="Zoom out"
            className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:border-rowan-navy hover:text-rowan-navy disabled:opacity-30 text-sm font-bold"
          >
            −
          </button>
          <div className="text-[10px] font-bold text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</div>
          <button
            onClick={zoomIn}
            disabled={!imageUrl || zoom >= MAX_ZOOM}
            title="Zoom in"
            className="w-7 h-7 rounded border border-gray-300 text-gray-600 hover:border-rowan-navy hover:text-rowan-navy disabled:opacity-30 text-sm font-bold"
          >
            +
          </button>
          <button
            onClick={resetView}
            disabled={!imageUrl || (zoom === 1 && pan.x === 0 && pan.y === 0)}
            title="Reset zoom / position"
            className="ml-1 px-2 h-7 rounded border border-gray-300 text-gray-600 hover:border-rowan-navy hover:text-rowan-navy disabled:opacity-30 text-[10px] font-bold uppercase"
          >
            Reset
          </button>
        </div>
      </div>

      <div
        className={`relative flex-1 overflow-hidden bg-gray-100 ${
          zoom > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        style={{ minHeight: 320 }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Scanned invoice"
            draggable={false}
            className="w-full h-full object-contain select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.08s ease-out',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm p-8 text-center">
            No scanned image attached
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-200 space-y-2">
        {uploadErr && <div className="text-[10px] font-bold text-rowan-red">{uploadErr}</div>}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!invoiceId || uploading}
          className="w-full border border-gray-300 text-gray-600 px-3 py-2 rounded-lg font-bold text-xs hover:border-rowan-navy hover:text-rowan-navy transition disabled:opacity-40"
        >
          {uploading ? 'Uploading…' : imageUrl ? 'Replace Image' : 'Attach Image'}
        </button>
        {!invoiceId && (
          <div className="text-[10px] text-gray-400 text-center">Save the invoice first to attach a scan.</div>
        )}
        <div className="text-[9px] text-gray-400 text-center leading-tight">
          Scroll to zoom · drag to pan while zoomed in
        </div>
      </div>
    </div>
  );
}
