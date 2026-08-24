'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getLadyJInvoices, LadyJInvoice } from '@/lib/ladyJInvoices';

const STATUS_STYLES: Record<string, string> = {
  OK: 'bg-green-100 text-green-700',
  MISMATCH: 'bg-red-100 text-red-600',
  'N/A': 'bg-gray-200 text-gray-500',
};

function fmtMoney(n: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-LK').format(Math.round(n || 0));
}

export default function LadyJInvoicesPage() {
  const [invoices, setInvoices] = useState<LadyJInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    getLadyJInvoices().then((data) => {
      setInvoices(data);
      setSelectedId((prev) => prev ?? data[0]?.id ?? null);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        String(inv.id).includes(q) ||
        inv.lines.some((l) => l.item.toLowerCase().includes(q)) ||
        inv.customer.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const selected: LadyJInvoice | undefined = invoices.find((i) => i.id === selectedId);

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <RowanWordmark markSize={36} />
            <div>
              <h1 className="text-xl font-black text-rowan-navy">Lady J Invoices — Scanned Originals</h1>
              <p className="text-sm text-gray-500">
                {invoices.length} invoices · every source photo attached and verified
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-rowan-navy hover:text-rowan-red transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Left: list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice #, item, customer…"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-rowan-navy/30"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-2 text-sm rounded-lg border border-gray-300"
              >
                <option value="all">All</option>
                <option value="OK">OK</option>
                <option value="MISMATCH">Mismatch</option>
                <option value="N/A">N/A</option>
              </select>
            </div>
            <div className="overflow-y-auto max-h-[75vh] divide-y divide-gray-100">
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => setSelectedId(inv.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-rowan-bgWhite transition-colors ${
                    inv.id === selectedId ? 'bg-rowan-bgWhite border-l-4 border-rowan-navy' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">#{inv.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[inv.status] ?? STATUS_STYLES['N/A']
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-rowan-navy truncate">
                    {inv.lines[0]?.item ?? 'Unspecified'}
                    {inv.lines.length > 1 ? ` +${inv.lines.length - 1} more` : ''}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{inv.date ?? 'No date'}</span>
                    <span className="text-sm font-bold text-rowan-navy">{fmtMoney(inv.total)}</span>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-400">No invoices match.</div>
              )}
            </div>
          </div>

          {/* Right: detail + image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!selected ? (
              <div className="text-gray-400 text-sm">Select an invoice to view details.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-black text-rowan-navy">Invoice #{selected.id}</h2>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        STATUS_STYLES[selected.status] ?? STATUS_STYLES['N/A']
                      }`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    Customer: <span className="text-gray-800 font-medium">{selected.customer}</span>
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Date: <span className="text-gray-800 font-medium">{selected.date ?? '—'}</span>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-200">
                        <th className="py-2 pr-2">Item</th>
                        <th className="py-2 pr-2">Code</th>
                        <th className="py-2 pr-2 text-right">Qty</th>
                        <th className="py-2 pr-2 text-right">Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.lines.map((l, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 pr-2">{l.item}</td>
                          <td className="py-2 pr-2 text-gray-400">{l.code}</td>
                          <td className="py-2 pr-2 text-right">{l.qty}</td>
                          <td className="py-2 pr-2 text-right">{fmtMoney(l.price)}</td>
                          <td className="py-2 text-right font-semibold">{fmtMoney(l.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end mt-3">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Total</div>
                      <div className="text-xl font-black text-rowan-navy">{fmtMoney(selected.total)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase font-bold text-gray-400 mb-2">Source Document</div>
                  {selected.imageUrl ? (
                    <img
                      src={selected.imageUrl}
                      alt={`Invoice #${selected.id} scan`}
                      className="w-full rounded-lg border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                      No scanned image attached
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
