'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type TxnRow = {
  entry_id: string;
  entry_number: string;
  entry_date: string;
  memo: string | null;
  source_type: string;
  source_id: string | null;
  line_id: string;
  debit: number;
  credit: number;
  line_description: string | null;
  invoice_number: string | null;
  purchaser_name: string | null;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function sourceLink(row: TxnRow): string | null {
  if (!row.source_id) return null;
  if (row.source_type === 'invoice') return `/accounting/invoice?id=${row.source_id}`;
  if (row.source_type === 'manual') return `/accounting/journal-entry?id=${row.entry_id}`;
  return `/accounting/journal-entry?id=${row.entry_id}`;
}

function sourceLabel(row: TxnRow): string {
  if (row.source_type === 'invoice' && row.invoice_number) return row.invoice_number;
  return row.entry_number;
}

export type DrillDownTarget = {
  label: string;
  accountCodes: string[];
  /** revenue: normal balance is credit, so amount = credit - debit; expense: debit - credit */
  polarity: 'credit' | 'debit';
  start: string;
  end: string;
};

export function DrillDownModal({ target, onClose }: { target: DrillDownTarget | null; onClose: () => void }) {
  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: accounts, error: accErr } = await supabase
        .from('chart_of_accounts')
        .select('id, code')
        .in('code', target.accountCodes);
      if (accErr) throw accErr;
      const accountIds = (accounts ?? []).map((a) => a.id);
      if (accountIds.length === 0) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      const { data: lines, error: linesErr } = await supabase
        .from('journal_lines')
        .select('id, entry_id, debit, credit, description, journal_entries!inner(entry_number, entry_date, memo, source_type, source_id, status)')
        .in('account_id', accountIds)
        .eq('journal_entries.status', 'posted')
        .gte('journal_entries.entry_date', target.start)
        .lte('journal_entries.entry_date', target.end);
      if (linesErr) throw linesErr;

      const rawRows = (lines ?? []) as any[];

      const invoiceIds = Array.from(
        new Set(rawRows.filter((r) => r.journal_entries?.source_type === 'invoice' && r.journal_entries?.source_id).map((r) => r.journal_entries.source_id))
      );
      let invoiceMap = new Map<string, { invoice_number: string; purchaser_name: string }>();
      if (invoiceIds.length > 0) {
        const { data: invoices } = await supabase.from('invoices').select('id, invoice_number, purchaser_name').in('id', invoiceIds);
        invoiceMap = new Map((invoices ?? []).map((i: any) => [i.id, { invoice_number: i.invoice_number, purchaser_name: i.purchaser_name }]));
      }

      const built: TxnRow[] = rawRows.map((r) => {
        const je = r.journal_entries;
        const inv = je?.source_id ? invoiceMap.get(je.source_id) : undefined;
        return {
          entry_id: r.entry_id,
          entry_number: je?.entry_number ?? '—',
          entry_date: je?.entry_date ?? '',
          memo: je?.memo ?? null,
          source_type: je?.source_type ?? 'manual',
          source_id: je?.source_id ?? null,
          line_id: r.id,
          debit: Number(r.debit) || 0,
          credit: Number(r.credit) || 0,
          line_description: r.description ?? null,
          invoice_number: inv?.invoice_number ?? null,
          purchaser_name: inv?.purchaser_name ?? null,
        };
      });

      built.sort((a, b) => a.entry_date.localeCompare(b.entry_date));

      if (!cancelled) {
        setRows(built);
        setLoading(false);
      }
    })().catch((err) => {
      if (!cancelled) {
        setError(err?.message ?? 'Failed to load transaction detail.');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [target]);

  if (!target) return null;

  const total = rows.reduce((s, r) => s + (target.polarity === 'credit' ? r.credit - r.debit : r.debit - r.credit), 0);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Transaction Detail</div>
            <div className="text-lg font-black text-rowan-navy">{target.label}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-rowan-navy text-xl leading-none px-2">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-10 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-rowan-red">{error}</div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400 italic">No transactions in this period.</p>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-white border-b border-gray-200">
                <tr className="text-left text-gray-400 uppercase text-[9px]">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Transaction</th>
                  <th className="px-4 py-2">Customer / Memo</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const amount = target.polarity === 'credit' ? r.credit - r.debit : r.debit - r.credit;
                  const link = sourceLink(r);
                  return (
                    <tr key={r.line_id} className="border-b border-gray-100 hover:bg-rowan-bg/50">
                      <td className="px-4 py-2.5 text-gray-500">{r.entry_date ? fmtDate(r.entry_date) : '—'}</td>
                      <td className="px-4 py-2.5 font-bold text-rowan-navy">
                        {link ? (
                          <Link href={link} target="_blank" rel="noopener noreferrer" className="hover:text-rowan-red">
                            {sourceLabel(r)} ↗
                          </Link>
                        ) : (
                          sourceLabel(r)
                        )}
                        <div className="text-[9px] font-normal text-gray-400 uppercase">{r.source_type}</div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{r.purchaser_name ?? r.memo ?? r.line_description ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-700">{fmt(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && !error && rows.length > 0 && (
          <div className="p-4 border-t-2 border-rowan-navy flex justify-between items-center bg-rowan-bg/40">
            <span className="text-xs font-bold uppercase text-gray-500">{rows.length} transaction{rows.length === 1 ? '' : 's'}</span>
            <span className="text-sm font-black text-rowan-navy">Total: {fmt(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
