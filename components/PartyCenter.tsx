'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PartyModal } from '@/components/PartyModal';
import { supabase } from '@/lib/supabase';
import {
  Party,
  PartyDraft,
  PartyKind,
  createParty,
  deactivateParty,
  listParties,
  termsLabel,
  updateParty,
} from '@/lib/parties';

type TxRow = {
  id: string;
  entry_date: string;
  entry_number: string;
  memo: string | null;
  debit: number;
  credit: number;
  status: string;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PartyCenter({ kind }: { kind: PartyKind }) {
  const label = kind === 'vendor' ? 'Vendor' : 'Customer';
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Party | null>(null);
  const [tab, setTab] = useState<'details' | 'transactions'>('details');
  const [tx, setTx] = useState<TxRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await listParties(kind);
    setParties(data);
    setLoading(false);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const filtered = useMemo(() => {
    return parties
      .filter((p) => showInactive || p.is_active)
      .filter((p) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          p.display_name.toLowerCase().includes(q) ||
          p.company_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
        );
      });
  }, [parties, search, showInactive]);

  const selected = parties.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || tab !== 'transactions') return;
    setTxLoading(true);
    const col = kind === 'vendor' ? 'vendor_id' : 'customer_id';
    supabase
      .from('journal_lines')
      .select('id, debit, credit, journal_entries!inner(entry_date, entry_number, memo, status)')
      .eq(col, selected.id)
      .then(({ data }) => {
        const rows: TxRow[] = (data ?? []).map((r: any) => ({
          id: r.id,
          debit: r.debit,
          credit: r.credit,
          entry_date: r.journal_entries.entry_date,
          entry_number: r.journal_entries.entry_number,
          memo: r.journal_entries.memo,
          status: r.journal_entries.status,
        }));
        rows.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
        setTx(rows);
        setTxLoading(false);
      });
  }, [selected, tab, kind]);

  async function handleCreate(draft: PartyDraft) {
    const created = await createParty(kind, draft);
    setParties((prev) => [...prev, created].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    setSelectedId(created.id);
    setModalOpen(false);
  }

  async function handleUpdate(draft: PartyDraft) {
    if (!editTarget) return;
    const updated = await updateParty(kind, editTarget.id, draft);
    setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditTarget(null);
  }

  async function toggleActive(p: Party) {
    await deactivateParty(kind, p.id, !p.is_active);
    setParties((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !x.is_active } : x)));
  }

  const balance = tx.reduce((s, r) => s + (kind === 'vendor' ? r.credit - r.debit : r.debit - r.credit), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href={kind === 'vendor' ? '/accounting/vendors' : '/accounting/customers'} className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
              ← {kind === 'vendor' ? 'Vendors' : 'Customers'}
            </Link>
            <h1 className="text-xl font-black text-rowan-navy mt-1">{label} Center</h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition"
          >
            + New {label}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex" style={{ minHeight: '70vh' }}>
          {/* Left: list */}
          <div className="w-72 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 space-y-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}s…`}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
              />
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            </div>
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 && (
                <p className="text-[11px] text-gray-400 italic p-4">No {label.toLowerCase()}s found.</p>
              )}
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setTab('details');
                  }}
                  className={`w-full text-left px-4 py-2.5 border-b border-gray-100 text-[12px] hover:bg-rowan-bg transition ${
                    selectedId === p.id ? 'bg-rowan-bg border-l-4 border-l-rowan-red' : ''
                  } ${!p.is_active ? 'opacity-40' : ''}`}
                >
                  <div className="font-bold text-rowan-navy">{p.display_name}</div>
                  {p.company_name && <div className="text-gray-400 text-[10px]">{p.company_name}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Right: detail */}
          <div className="flex-1 p-6">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Select a {label.toLowerCase()} on the left, or add a new one.
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-black text-rowan-navy">{selected.display_name}</h2>
                    {selected.company_name && <p className="text-xs text-gray-500">{selected.company_name}</p>}
                    {!selected.is_active && (
                      <span className="inline-block mt-1 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditTarget(selected)}
                      className="border border-rowan-navy text-rowan-navy px-3 py-1.5 rounded text-[11px] font-bold hover:bg-rowan-navy hover:text-white transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(selected)}
                      className="border border-gray-300 text-gray-500 px-3 py-1.5 rounded text-[11px] font-bold hover:border-rowan-red hover:text-rowan-red transition"
                    >
                      {selected.is_active ? 'Make Inactive' : 'Make Active'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-1 border-b border-gray-200 mb-4">
                  {(['details', 'transactions'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wide border-b-2 -mb-px transition ${
                        tab === t ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                      }`}
                    >
                      {t === 'details' ? 'Details' : 'Transactions'}
                    </button>
                  ))}
                </div>

                {tab === 'details' ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[12px]">
                    <Field label="Contact Person" value={selected.contact_person} />
                    <Field label="Email" value={selected.email} />
                    <Field label="Phone" value={selected.phone} />
                    <Field label="City" value={selected.city} />
                    <Field label="TIN / VAT No." value={selected.tin_vat} />
                    <Field label="Payment Terms" value={termsLabel(selected.payment_terms)} />
                    <Field label="Opening Balance" value={fmt(selected.opening_balance)} />
                    <Field label="Address" value={selected.address} full />
                    <Field label="Notes" value={selected.notes} full />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[11px] text-gray-400">Posted journal activity linked to this {label.toLowerCase()}.</p>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Balance</span>
                        <span className="text-sm font-black text-rowan-navy">{fmt(balance)}</span>
                      </div>
                    </div>
                    {txLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : tx.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No transactions yet.</p>
                    ) : (
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-left text-gray-400 uppercase text-[9px] border-b border-gray-200">
                            <th className="py-1.5">Date</th>
                            <th className="py-1.5">Entry #</th>
                            <th className="py-1.5">Memo</th>
                            <th className="py-1.5">Status</th>
                            <th className="py-1.5 text-right">Debit</th>
                            <th className="py-1.5 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tx.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100">
                              <td className="py-1.5">{r.entry_date}</td>
                              <td className="py-1.5 font-bold text-rowan-navy">{r.entry_number}</td>
                              <td className="py-1.5 text-gray-500">{r.memo ?? '—'}</td>
                              <td className="py-1.5 capitalize text-gray-500">{r.status}</td>
                              <td className="py-1.5 text-right">{r.debit ? fmt(r.debit) : ''}</td>
                              <td className="py-1.5 text-right">{r.credit ? fmt(r.credit) : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <PartyModal kind={kind} onClose={() => setModalOpen(false)} onSave={handleCreate} />
      )}
      {editTarget && (
        <PartyModal
          kind={kind}
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}

function Field({ label, value, full = false }: { label: string; value: string | null | undefined; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-rowan-navy">{value || '—'}</span>
    </div>
  );
}
