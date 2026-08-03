'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloatingPanel } from './FloatingPanel';

export type ComboOption = { id: string; label: string; sublabel?: string };

export function ComboBox({
  options,
  value,
  placeholder = 'Search…',
  onSelect,
  onCreateNew,
  createLabel = 'Add new',
  disabled = false,
  className = '',
}: {
  options: ComboOption[];
  value: ComboOption | null;
  placeholder?: string;
  onSelect: (opt: ComboOption | null) => void;
  onCreateNew?: (typedText: string) => void;
  createLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setOpen(true)}
        className={`flex items-center justify-between border rounded px-2 py-1.5 text-[11px] bg-white cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-rowan-navy'
        } ${open ? 'border-rowan-navy ring-1 ring-rowan-navy' : 'border-gray-300'}`}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full outline-none text-[11px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={value ? 'text-rowan-navy font-semibold' : 'text-gray-400'}>
            {value ? value.label : placeholder}
          </span>
        )}
        <span className="text-gray-400 ml-1 text-[9px]">▾</span>
      </div>

      <FloatingPanel
        anchorRef={rootRef}
        open={open && !disabled}
        ref={panelRef}
        minWidth={220}
        className="bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-auto"
      >
        {value && (
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery('');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-[10px] text-gray-400 hover:bg-gray-50 border-b"
          >
            ✕ Clear selection
          </button>
        )}
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-[11px] text-gray-400 italic">No matches</div>
        )}
        {filtered.map((o) => (
          <button
            type="button"
            key={o.id}
            onClick={() => {
              onSelect(o);
              setQuery('');
              setOpen(false);
            }}
            className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-rowan-bg block"
          >
            <span className="font-semibold text-rowan-navy">{o.label}</span>
            {o.sublabel && <span className="text-gray-400 ml-1">{o.sublabel}</span>}
          </button>
        ))}
        {onCreateNew && (
          <button
            type="button"
            onClick={() => {
              onCreateNew(query);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[11px] font-bold text-rowan-red hover:bg-rowan-bg border-t"
          >
            + {createLabel}{query ? `: "${query}"` : ''}
          </button>
        )}
      </FloatingPanel>
    </div>
  );
}
