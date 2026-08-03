'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
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
};

function fmtDate(d: string | null) {
  return d ?? '—';
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

  useEffect(() => {
    supabase
      .from('invoices')
      .select('id, invoice_number, invoice_date, due_date, currency, status, purchaser_name, total_amount, amount_paid')
      .order('invoice_date', { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as InvoiceRow[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || r.invoice_number.toLowerCase().includes(q) || r.purchaser_name.toLowerCase().includes(q);
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
            <h1 className="text-xl font-black text-rowan-navy mt-1">Invoices</h1>
          </div>
          <Link href="/accounting/invoice" className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition">
            + New Invoice
          </Link>
        </div>

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
          </div>

          {loading ? (
            <div className="p-10 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-[12px] text-gray-400 italic">No invoices found.</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
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
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-rowan-bg/50">
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
                      <td className="px-4 py-2.5 text-right space-x-3">
                        <Link href={`/accounting/invoice?id=${r.id}`} className="font-bold text-rowan-navy hover:text-rowan-red">Edit</Link>
                        <Link href={`/accounting/invoice/${r.id}/print`} className="font-bold text-rowan-navy hover:text-rowan-red">Print</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
