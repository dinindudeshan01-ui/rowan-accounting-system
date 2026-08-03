'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloatingPanel } from './FloatingPanel';

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  group?: string;
  /** Pinned "action" style option, e.g. "+ Add new account..." */
  action?: boolean;
};

/**
 * Drop-in replacement for a native <select>: same value/onChange shape,
 * but adds a search box (filters by label + sublabel) and a short,
 * scrollable options list instead of a long native dropdown. Supports
 * optgroup-style grouping and a pinned "action" option (e.g. "+ Add new...").
 */
export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  disabled = false,
  className = '',
  emptyMessage = 'No matches',
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setQuery('');
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.action || o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
    );
  }, [options, query]);

  const groupedEntries = useMemo(() => {
    const order: (string | undefined)[] = [];
    const map = new Map<string | undefined, SelectOption[]>();
    for (const o of filtered) {
      if (!map.has(o.group)) {
        map.set(o.group, []);
        order.push(o.group);
      }
      map.get(o.group)!.push(o);
    }
    return order.map((g) => [g, map.get(g)!] as const);
  }, [filtered]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setTimeout(() => searchRef.current?.focus(), 0);
        }}
        className={`w-full flex items-center justify-between border rounded px-2 py-1.5 text-left bg-white text-[11px] ${
          disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'hover:border-rowan-navy cursor-pointer'
        } ${open ? 'border-rowan-navy ring-1 ring-rowan-navy' : 'border-gray-300'}`}
      >
        <span className={`truncate ${selected ? 'text-rowan-navy font-semibold' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="text-gray-400 ml-2 text-[9px] shrink-0">▾</span>
      </button>

      <FloatingPanel
        anchorRef={rootRef}
        open={open && !disabled}
        ref={panelRef}
        minWidth={200}
        className="bg-white border border-gray-300 rounded shadow-lg overflow-hidden"
      >
        <div className="p-1.5 border-b border-gray-100">
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full outline-none text-[11px] border border-gray-200 rounded px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-[11px] text-gray-400 italic">{emptyMessage}</div>
          )}
          {groupedEntries.map(([group, items]) => (
            <div key={group ?? '__ungrouped__'}>
              {group && (
                <div className="px-3 pt-1.5 pb-0.5 text-[9px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50 sticky top-0">
                  {group}
                </div>
              )}
              {items.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-rowan-bg block border-b border-gray-50 last:border-b-0 ${
                    o.action
                      ? 'font-bold text-rowan-red'
                      : value === o.value
                      ? 'font-semibold text-rowan-navy bg-rowan-bg'
                      : 'text-gray-700'
                  }`}
                >
                  {o.label}
                  {o.sublabel && <span className="text-gray-400 ml-1">{o.sublabel}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </FloatingPanel>
    </div>
  );
}
