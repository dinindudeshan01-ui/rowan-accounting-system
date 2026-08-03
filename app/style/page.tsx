'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { listStyles, Style } from '@/lib/styles';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  sample: 'bg-amber-100 text-amber-700',
  discontinued: 'bg-gray-200 text-gray-500',
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StyleListPage() {
  const [rows, setRows] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    listStyles()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.style_no.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.category ?? '').toLowerCase().includes(q) ||
        (r.season ?? '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
            <h1 className="text-xl font-black text-rowan-navy mt-1">Style Numbers</h1>
          </div>
          <Link href="/style/new" className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition">
            + Create New Style
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by style #, name, category, or season…"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px]"
            />
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-48"
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'sample', label: 'Sample' },
                { value: 'discontinued', label: 'Discontinued' },
              ]}
            />
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {rows.length === 0 ? 'No styles yet — create your first one.' : 'No styles match your search.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase text-left">
                  <th className="p-3">Style #</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Season</th>
                  <th className="p-3 text-right">Selling Price</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <td className="p-3">
                      <Link href={`/style/${s.id}`} className="font-bold text-rowan-navy hover:text-rowan-red">
                        {s.style_no}
                      </Link>
                    </td>
                    <td className="p-3">
                      <Link href={`/style/${s.id}`}>{s.name}</Link>
                    </td>
                    <td className="p-3 text-gray-500">{s.category || '—'}</td>
                    <td className="p-3 text-gray-500">{s.season || '—'}</td>
                    <td className="p-3 text-right">{fmt(s.selling_price)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
