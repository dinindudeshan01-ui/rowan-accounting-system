'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ConfirmModal } from '@/components/ConfirmModal';
import { supabase } from '@/lib/supabase';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  currency: string;
  status: string;
  purchaser_name: string;
  total_amount: number;
  amount_paid: number;
  image_url: string | null;
};

function fmtDate(d: string | null) {
  return d ?? '—';
}

/** Natural sort for invoice numbers like "LJ-9" vs "LJ-10" — splits into
 *  the non-numeric prefix and the numeric tail, comparing the number as
 *  an integer so 2 sorts before 10, not after. */
function invoiceNumberParts(s: string): [string, number] {
  const m = s.match(/^(.*?)(\d+)\s*$/);
  if (!m) return [s, 0];
  return [m[1], parseInt(m[2], 10)];
}
function compareInvoiceNumbers(a: string, b: string) {
  const [prefixA, numA] = invoiceNumberParts(a);
  const [prefixB, numB] = invoiceNumberParts(b);
  if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
  return numA - numB;
}

function fmtMoney(currency: string, n: number) {
  return `${currency} ${n.toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-500',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-600',
};

export default function InvoicesListPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'date_desc' | 'date_asc'>('number_asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; number: string } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function requestDelete(id: string, invoiceNumber: string) {
    setDeleteError(null);
    setPendingDelete({ id, number: invoiceNumber });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeletingId(id);
    const { error } = await supabase.rpc('delete_invoice', { p_invoice_id: id });
    setDeletingId(null);
    if (error) {
      setDeleteError(error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    setPendingDelete(null);
  }

  useEffect(() => {
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, currency, status, purchaser_name, total_amount, amount_paid, image_url')
      .order('invoice_date', { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as InvoiceRow[];
        setRows(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      const matchesSearch = !q || r.invoice_number.toLowerCase().includes(q) || r.purchaser_name.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const sorted = [...list];
    switch (sortBy) {
      case 'number_asc':
        sorted.sort((a, b) => compareInvoiceNumbers(a.invoice_number, b.invoice_number));
        break;
      case 'number_desc':
        sorted.sort((a, b) => compareInvoiceNumbers(b.invoice_number, a.invoice_number));
        break;
      case 'date_asc':
        sorted.sort((a, b) => a.invoice_date.localeCompare(b.invoice_date));
        break;
      case 'date_desc':
      default:
        sorted.sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
        break;
    }
    return sorted;
  }, [rows, search, statusFilter, sortBy]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
            <h1 className="text-xl font-black text-rowan-navy mt-1">Invoices</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/accounting/invoices/attach-scans" className="text-xs font-bold text-rowan-navy hover:text-rowan-red transition-colors">
              Attach missing files →
            </Link>
            <Link href="/accounting/invoice" className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition">
              + New Invoice
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
          {/* Left: list */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice # or customer…"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-[12px]"
              />
              <SearchableSelect
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-48"
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'issued', label: 'Issued' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'void', label: 'Void' },
                ]}
              />
              <SearchableSelect
                value={sortBy}
                onChange={(v) => setSortBy(v as typeof sortBy)}
                className="w-56"
                options={[
                  { value: 'number_asc', label: 'Invoice # (1, 2, 3…)' },
                  { value: 'number_desc', label: 'Invoice # (…3, 2, 1)' },
                  { value: 'date_desc', label: 'Date (Newest first)' },
                  { value: 'date_asc', label: 'Date (Oldest first)' },
                ]}
              />
            </div>

            {loading ? (
              <div className="p-10 flex justify-center"><LoadingSpinner size="lg" /></div>
            ) : filtered.length === 0 ? (
              <p className="p-8 text-center text-[12px] text-gray-400 italic">No invoices found.</p>
            ) : (
              <div className="max-h-[78vh] overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-left text-gray-400 uppercase text-[9px] border-b border-gray-200">
                      <th className="px-4 py-2">Invoice #</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Due</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Balance Due</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const balance = r.total_amount - r.amount_paid;
                      const isPartial = r.status === 'issued' && r.amount_paid > 0 && balance > 0.01;
                      const isSelected = r.id === selectedId;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedId(r.id)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            isSelected ? 'bg-rowan-bgWhite border-l-4 border-l-rowan-navy' : 'hover:bg-rowan-bg/50'
                          }`}
                        >
                          <td className="px-4 py-2.5 font-bold text-rowan-navy">{r.invoice_number}</td>
                          <td className="px-4 py-2.5">{r.purchaser_name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{fmtDate(r.invoice_date)}</td>
                          <td className="px-4 py-2.5 text-gray-500">{fmtDate(r.due_date)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isPartial ? 'bg-amber-100 text-amber-800' : STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {isPartial ? 'Partial' : r.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-600">
                            {r.status === 'draft' ? '—' : `${r.currency} ${balance.toFixed(2)}`}
                          </td>
                          <td className="px-4 py-2.5 text-right space-x-3" onClick={(e) => e.stopPropagation()}>
                            <Link href={`/accounting/invoice?id=${r.id}`} className="font-bold text-rowan-navy hover:text-rowan-red">Edit</Link>
                            <Link href={`/accounting/invoice/${r.id}/print`} className="font-bold text-rowan-navy hover:text-rowan-red">Print</Link>
                            <button
                              onClick={() => requestDelete(r.id, r.invoice_number)}
                              disabled={deletingId === r.id}
                              className="font-bold text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                              {deletingId === r.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: sticky detail panel */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-6 max-h-[78vh] flex flex-col">
            {!selected ? (
              <div className="p-8 text-center text-sm text-gray-400">Select an invoice to preview it here.</div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-black text-rowan-navy">{selected.invoice_number}</div>
                    <div className="text-xs text-gray-400">{selected.purchaser_name}</div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[selected.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {selected.status}
                  </span>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase">Date</div>
                      <div className="font-semibold text-gray-700">{fmtDate(selected.invoice_date)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase">Due</div>
                      <div className="font-semibold text-gray-700">{fmtDate(selected.due_date)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase">Total</div>
                      <div className="font-bold text-rowan-navy">{fmtMoney(selected.currency, selected.total_amount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-[10px] uppercase">Balance Due</div>
                      <div className="font-bold text-rowan-navy">
                        {selected.status === 'draft' ? '—' : fmtMoney(selected.currency, selected.total_amount - selected.amount_paid)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 text-[12px] font-bold">
                    <Link href={`/accounting/invoice?id=${selected.id}`} className="text-rowan-navy hover:text-rowan-red">Edit</Link>
                    <Link href={`/accounting/invoice/${selected.id}/print`} className="text-rowan-navy hover:text-rowan-red">Print</Link>
                    <button
                      onClick={() => requestDelete(selected.id, selected.invoice_number)}
                      disabled={deletingId === selected.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-40"
                    >
                      {deletingId === selected.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>

                  <div>
                    <div className="text-gray-400 text-[10px] uppercase mb-2">Attached document</div>
                    {selected.image_url ? (
                      <img
                        src={selected.image_url}
                        alt={`Invoice ${selected.invoice_number} scan`}
                        className="w-full rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                        No scanned image attached
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete invoice"
        message={
          pendingDelete
            ? `Delete invoice ${pendingDelete.number}? This also removes its ledger posting. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deletingId === pendingDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />

      {deleteError && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
            <h3 className="text-sm font-bold text-rowan-red uppercase tracking-wide mb-3">Delete failed</h3>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-5">{deleteError}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteError(null)}
                className="px-4 py-2 rounded-lg text-[12px] font-bold text-white bg-rowan-navy hover:bg-rowan-navyLight transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
