'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ConfirmModal } from '@/components/ConfirmModal';
import { PageHeader, StatTile, btnPrimary, btnSecondary } from '@/components/PageHeader';
import { Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
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

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-500',
  issued: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  void: 'bg-red-100 text-red-600',
};

export default function InvoicesListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'number_asc' | 'number_desc' | 'date_desc' | 'date_asc'>('number_asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  function openDetail(id: string) {
    setSelectedId(id);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

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
    let { error } = await supabase.rpc('delete_invoice', { p_invoice_id: id });
    // If the delete_invoice function isn't in the database (or the API cache),
    // a draft has no ledger posting, so it can be removed directly.
    const rpcMissing = !!error && (error.code === 'PGRST202' || /schema cache|does not exist|could not find/i.test(error.message));
    if (rpcMissing && rows.find((r) => r.id === id)?.status === 'draft') {
      const res = await supabase.from('invoices').delete().eq('id', id);
      error = res.error;
    }
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

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cur = rows[0]?.currency ?? 'LKR';
    let unpaid = 0, unpaidN = 0, overdue = 0, overdueN = 0, paid = 0, paidN = 0, drafts = 0;
    const counts: Record<string, number> = { all: rows.length, draft: 0, issued: 0, paid: 0, void: 0 };
    for (const r of rows) {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
      const bal = r.total_amount - r.amount_paid;
      if (r.status === 'draft') drafts++;
      if (r.status === 'paid') { paid += r.total_amount; paidN++; }
      if (r.status === 'issued' && bal > 0.01) {
        unpaid += bal; unpaidN++;
        if (r.due_date && r.due_date < today) { overdue += bal; overdueN++; }
      }
    }
    return { cur, unpaid, unpaidN, overdue, overdueN, paid, paidN, drafts, counts };
  }, [rows]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="min-h-full xl:h-full xl:flex xl:flex-col px-6 py-6">
      <PageHeader
        title="Invoices"
        subtitle="Create, send and track customer invoices"
        actions={
          <>
            <Link href="/accounting/invoices/attach-scans" className={btnSecondary}>Attach missing files</Link>
            <Link href="/accounting/invoice" className={btnPrimary}><Plus size={15} /> New Invoice</Link>
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <StatTile label="Unpaid" value={`${stats.cur} ${fmtNum(stats.unpaid)}`} sub={`${stats.unpaidN} invoice${stats.unpaidN === 1 ? '' : 's'}`} tone="navy" />
        <StatTile label="Overdue" value={`${stats.cur} ${fmtNum(stats.overdue)}`} sub={`${stats.overdueN} past due date`} tone="red" />
        <StatTile label="Paid" value={`${stats.cur} ${fmtNum(stats.paid)}`} sub={`${stats.paidN} invoice${stats.paidN === 1 ? '' : 's'}`} tone="green" />
        <StatTile label="Drafts" value={String(stats.drafts)} sub="not yet issued" tone="gray" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[minmax(0,1fr)] xl:flex-1 xl:min-h-0 gap-5 items-stretch">
        {/* Left: list */}
        <div ref={listRef} className="bg-white rounded-xl overflow-hidden flex flex-col xl:h-full xl:min-h-0">
          {/* Status tabs */}
          <div className="flex gap-1 px-3 pt-2 border-b border-gray-200 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  statusFilter === t.value
                    ? 'border-rowan-red text-rowan-navy'
                    : 'border-transparent text-gray-400 hover:text-rowan-navy'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{stats.counts[t.value] ?? 0}</span>
              </button>
            ))}
          </div>

          {/* Search + sort */}
          <div className="p-3 border-b border-gray-200 flex gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice # or customer…"
                className="w-full pl-9 pr-3 py-2 text-[12px]"
              />
            </div>
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
              <div className="max-h-[70vh] min-h-[320px] overflow-auto xl:max-h-none xl:flex-1 xl:min-h-0">
                <table className="w-full text-[12px] whitespace-nowrap">
                  <thead>
                    <tr className="text-left">
                      <th className="px-3 py-2">Invoice #</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Date</th>
                      <th className="px-3 py-2 hidden md:table-cell">Due</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Balance Due</th>
                      <th className="px-3 py-2 text-right hidden sm:table-cell">Actions</th>
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
                          onClick={() => openDetail(r.id)}
                          onDoubleClick={() => router.push(`/accounting/invoice?id=${r.id}`)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            isSelected ? 'bg-rowan-bgWhite border-l-4 border-l-rowan-navy' : 'hover:bg-rowan-bg/50'
                          }`}
                        >
                          <td className="px-3 py-2.5 font-bold text-rowan-navy">{r.invoice_number}</td>
                          <td className="px-3 py-2.5 max-w-[92px] sm:max-w-[240px] truncate" title={r.purchaser_name}>{r.purchaser_name}</td>
                          <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{fmtDate(r.invoice_date)}</td>
                          <td className={`px-3 py-2.5 hidden md:table-cell ${r.status === 'issued' && balance > 0.01 && r.due_date && r.due_date < todayStr ? 'text-rowan-red font-bold' : 'text-gray-500'}`}>{fmtDate(r.due_date)}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isPartial ? 'bg-amber-100 text-amber-800' : STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {isPartial ? 'Partial' : r.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-600">
                            {r.status === 'draft' ? '—' : `${r.currency} ${fmtNum(balance)}`}
                          </td>
                          <td className="px-3 py-2.5 text-right hidden sm:table-cell" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <Link href={`/accounting/invoice?id=${r.id}`} title="Edit" className="p-1.5 rounded-md text-rowan-navy hover:bg-gray-100 hover:text-rowan-red">
                                <Pencil size={14} />
                              </Link>
                              <Link href={`/accounting/invoice/${r.id}/print`} title="Print" className="p-1.5 rounded-md text-rowan-navy hover:bg-gray-100 hover:text-rowan-red">
                                <Printer size={14} />
                              </Link>
                              <button
                                onClick={() => requestDelete(r.id, r.invoice_number)}
                                disabled={deletingId === r.id}
                                title="Delete"
                                className="p-1.5 rounded-md text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
          <div ref={detailRef} className="bg-white rounded-xl overflow-hidden max-h-[80vh] xl:max-h-none xl:h-full flex flex-col">
            {!selected ? (
              <div className="p-8 text-center text-sm text-gray-400">Select an invoice to preview it here.</div>
            ) : (
              <>
                <button
                  onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="xl:hidden text-left px-4 pt-3 text-xs font-bold text-rowan-navy hover:text-rowan-red"
                >
                  ↑ Back to list
                </button>
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
