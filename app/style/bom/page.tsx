'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { listStyles, listAllBomLines, bomLineCost, Style, BomLine } from '@/lib/styles';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BomHubPage() {
  const router = useRouter();
  const [styles, setStyles] = useState<Style[]>([]);
  const [bomLines, setBomLines] = useState<BomLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [jumpTo, setJumpTo] = useState<ComboOption | null>(null);

  useEffect(() => {
    Promise.all([listStyles(), listAllBomLines()])
      .then(([s, b]) => {
        setStyles(s);
        setBomLines(b);
      })
      .finally(() => setLoading(false));
  }, []);

  const summaryByStyle = useMemo(() => {
    const map = new Map<string, { count: number; cost: number }>();
    for (const l of bomLines) {
      const prev = map.get(l.style_id) ?? { count: 0, cost: 0 };
      map.set(l.style_id, { count: prev.count + 1, cost: prev.cost + bomLineCost(l) });
    }
    return map;
  }, [bomLines]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return styles.filter(
      (s) =>
        !q ||
        s.style_no.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.category ?? '').toLowerCase().includes(q)
    );
  }, [styles, search]);

  const styleOptions: ComboOption[] = styles.map((s) => ({ id: s.id, label: `${s.style_no} — ${s.name}`, sublabel: s.category ?? undefined }));

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
            <h1 className="text-2xl font-black text-rowan-navy mt-1">Bill of Materials</h1>
            <p className="text-xs text-gray-500 mt-0.5">Every style's material breakdown, in one place.</p>
          </div>
          <Link href="/style/new?returnTab=bom" className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition whitespace-nowrap">
            + New Style &amp; BOM
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-6 flex gap-3 items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by style #, name, or category…"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm"
            autoFocus
          />
          <div className="w-72">
            <ComboBox
              options={styleOptions}
              value={jumpTo}
              placeholder="Jump to an existing style's BOM…"
              onSelect={(opt) => {
                if (opt) router.push(`/style/${opt.id}?tab=bom`);
                setJumpTo(null);
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg py-16 text-center text-gray-400 text-sm">
            {styles.length === 0 ? 'No styles yet — create your first one.' : 'No styles match your search.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const summary = summaryByStyle.get(s.id);
              const hasBom = !!summary && summary.count > 0;
              return (
                <Link
                  key={s.id}
                  href={`/style/${s.id}?tab=bom`}
                  className="bg-white rounded-lg shadow hover:shadow-lg border border-transparent hover:border-rowan-navy transition p-4 block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-mono text-[11px] text-gray-400">{s.style_no}</p>
                      <p className="font-bold text-rowan-navy leading-tight">{s.name}</p>
                    </div>
                    {!hasBom && (
                      <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        No BOM yet
                      </span>
                    )}
                  </div>
                  {s.category && <p className="text-[11px] text-gray-400 mb-3">{s.category}</p>}
                  {hasBom ? (
                    <div className="flex justify-between items-baseline border-t border-gray-100 pt-2">
                      <span className="text-[11px] text-gray-500">{summary!.count} material{summary!.count === 1 ? '' : 's'}</span>
                      <span className="font-bold text-rowan-navy">{fmt(summary!.cost)} / unit</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-2">Click to add materials →</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
