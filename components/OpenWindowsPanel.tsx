'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star, Clock, LayoutGrid, ChevronDown } from 'lucide-react';
import { useNavHistory } from '@/lib/navHistory';

// ------------------------------------------------------------------
// QuickBooks-style "Open Windows" dropdown: Recent / Favorites /
// Quick Reports tabs in one panel, triggered from the top nav bar.
// ------------------------------------------------------------------

const QUICK_REPORT_PATHS = [
  '/accounting/reports/center',
  '/accounting/reports',
  '/accounting/reports/trial-balance',
];

function fmtTime(ts: number) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function OpenWindowsPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'recent' | 'favorites' | 'quick'>('recent');
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { recent, favorites, isFavorite, toggleFavorite, labelFor } = useNavHistory();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const list = tab === 'recent' ? recent : tab === 'favorites' ? favorites : QUICK_REPORT_PATHS.map((p) => ({ path: p, label: labelFor(p), visitedAt: 0 }));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-bold text-rowan-navy hover:text-rowan-red px-2 py-1.5 rounded-md hover:bg-gray-100"
      >
        <LayoutGrid size={14} />
        Open Windows
        <ChevronDown size={12} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex border-b border-gray-100 text-[11px] font-bold uppercase tracking-wide">
            <button
              onClick={() => setTab('recent')}
              className={`flex-1 py-2 flex items-center justify-center gap-1 ${tab === 'recent' ? 'text-rowan-navy border-b-2 border-rowan-navy' : 'text-gray-400'}`}
            >
              <Clock size={12} /> Recent
            </button>
            <button
              onClick={() => setTab('favorites')}
              className={`flex-1 py-2 flex items-center justify-center gap-1 ${tab === 'favorites' ? 'text-rowan-navy border-b-2 border-rowan-navy' : 'text-gray-400'}`}
            >
              <Star size={12} /> Favorites
            </button>
            <button
              onClick={() => setTab('quick')}
              className={`flex-1 py-2 flex items-center justify-center gap-1 ${tab === 'quick' ? 'text-rowan-navy border-b-2 border-rowan-navy' : 'text-gray-400'}`}
            >
              Quick Reports
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto py-1">
            {list.length === 0 && (
              <p className="text-center text-xs text-gray-400 italic py-6 px-4">
                {tab === 'recent' ? 'Nothing visited yet.' : tab === 'favorites' ? 'Star a page to pin it here.' : 'No quick reports yet.'}
              </p>
            )}
            {list.map((entry) => (
              <div
                key={entry.path}
                className={`flex items-center justify-between px-3 py-2 hover:bg-gray-50 ${entry.path === pathname ? 'bg-gray-50' : ''}`}
              >
                <Link href={entry.path} onClick={() => setOpen(false)} className="text-xs font-semibold text-gray-700 hover:text-rowan-navy flex-1 truncate">
                  {entry.label}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {tab === 'recent' && entry.visitedAt > 0 && <span className="text-[10px] text-gray-400">{fmtTime(entry.visitedAt)}</span>}
                  {tab !== 'quick' && (
                    <button onClick={() => toggleFavorite(entry.path)} title={isFavorite(entry.path) ? 'Unstar' : 'Star'}>
                      <Star size={13} className={isFavorite(entry.path) ? 'fill-rowan-red text-rowan-red' : 'text-gray-300'} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
