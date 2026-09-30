'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Plus, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PartyModal } from '@/components/PartyModal';
import { PageHeader, StatTile, btnPrimary, btnSecondary } from '@/components/PageHeader';
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Posted balance per party: customers owe us (debit − credit), we owe vendors (credit − debit). */
async function loadBalances(kind: PartyKind): Promise<Record<string, number>> {
  const col = kind === 'vendor' ? 'vendor_id' : 'customer_id';
  const out: Record<string, number> = {};
  const PAGE = 1000;
  for (let from = 0; from < 100000; from += PAGE) {
    const { data, error } = await supabase
      .from('journal_lines')
      .select(`${col}, debit, credit, journal_entries!inner(status)`)
      .not(col, 'is', null)
      .eq('journal_entries.status', 'posted')
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    for (const r of data as unknown as any[]) {
      const id = r[col] as string;
      const d = Number(r.debit) || 0;
      const c = Number(r.credit) || 0;
      out[id] = (out[id] ?? 0) + (kind === 'vendor' ? c - d : d - c);
    }
    if (data.length < PAGE) break;
  }
  return out;
}

export function PartyCenter({ kind }: { kind: PartyKind }) {
  const label = kind === 'vendor' ? 'Vendor' : 'Customer';
  const [parties, setParties] = useState<Party[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Party | null>(null);
  const [tab, setTab] = useState<'transactions' | 'details'>('transactions');
  const [tx, setTx] = useState<TxRow[]>([]);
  const detailRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  function openDetail(id: string) {
    setSelectedId(id);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

  const [txLoading, setTxLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const [data, bal] = await Promise.all([listParties(kind), loadBalances(kind)]);
    setParties(data);
    setBalances(bal);
    setLoading(false);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parties
      .filter((p) => showInactive || p.is_active)
      .filter(
        (p) =>
          !q ||
          p.display_name.toLowerCase().includes(q) ||
          p.company_name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
  }, [parties, search, showInactive]);

  const selected = parties.find((p) => p.id === selectedId) ?? null;

  // Load the selected party's activity (used by both the tiles and the tab).
  useEffect(() => {
    if (!selected) return;
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
  }, [selected, kind]);

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

  const postedBalance = tx
    .filter((r) => r.status === 'posted')
    .reduce((s, r) => s + (kind === 'vendor' ? r.credit - r.debit : r.debit - r.credit), 0);
  const totalOutstanding = Object.values(balances).reduce((s, n) => s + (n > 0.005 ? n : 0), 0);
  const withBalance = Object.values(balances).filter((n) => n > 0.005).length;
  const activeCount = parties.filter((p) => p.is_active).length;

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isCustomer = kind === 'customer';

  return (
    <div className="min-h-full lg:h-full lg:flex lg:flex-col px-6 py-6">
      <PageHeader
        title={`${label} Center`}
        subtitle={isCustomer ? 'Everyone you sell to, with what they owe you' : 'Everyone you buy from, with what you owe them'}
        actions={
          <button onClick={() => setModalOpen(true)} className={btnPrimary}>
            <Plus size={15} /> New {label}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 shrink-0">
        <StatTile label={`${label}s`} value={String(activeCount)} sub="active" tone="navy" />
        <StatTile
          label={isCustomer ? 'Total owed to you' : 'Total you owe'}
          value={`LKR ${fmt(totalOutstanding)}`}
          sub={`${withBalance} with a balance`}
          tone="red"
        />
        <StatTile label="Selected" value={selected ? selected.display_name : '—'} sub={selected ? `LKR ${fmt(balances[selected.id] ?? 0)}` : `Pick a ${label.toLowerCase()}`} tone="gray" />
      </div>

      <div className="bg-white rounded-xl overflow-hidden flex flex-col lg:flex-row lg:flex-1 lg:min-h-0" style={{ minHeight: 420 }}>
        {/* Left: list */}
        <div ref={listRef} className="lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-[45vh] lg:max-h-none lg:min-h-0">
          <div className="p-3 border-b border-gray-200 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}s…`}
                className="w-full pl-9 pr-3 py-2 text-[12px]"
              />
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <p className="text-[12px] text-gray-400 italic p-4">No {label.toLowerCase()}s found.</p>
            )}
            {filtered.map((p) => {
              const bal = balances[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  onClick={() => openDetail(p.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 flex items-center gap-3 transition border-l-4 ${
                    selectedId === p.id ? 'bg-rowan-bg border-l-rowan-red' : 'border-l-transparent hover:bg-gray-50'
                  } ${!p.is_active ? 'opacity-40' : ''}`}
                >
                  <span className="w-8 h-8 rounded-full bg-rowan-navy text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {initials(p.display_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-bold text-rowan-navy truncate">{p.display_name}</span>
                    {p.company_name && <span className="block text-[10px] text-gray-400 truncate">{p.company_name}</span>}
                  </span>
                  {Math.abs(bal) > 0.005 && (
                    <span className={`text-[11px] font-bold shrink-0 ${bal > 0 ? 'text-rowan-red' : 'text-gray-500'}`}>{fmt(bal)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: detail */}
        <div ref={detailRef} className="flex-1 min-w-0 overflow-y-auto">
          {!selected ? (
            <div className="h-full min-h-[240px] flex items-center justify-center text-gray-400 text-sm">
              Select a {label.toLowerCase()} on the left, or add a new one.
            </div>
          ) : (
            <div className="p-6">
              <button
                              onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                              className="lg:hidden mb-3 text-xs font-bold text-rowan-navy hover:text-rowan-red"
                            >
                              ↑ Back to list
                            </button>
              {/* Header card */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div className="flex items-start gap-4 min-w-0">
                  <span className="w-14 h-14 rounded-full bg-rowan-navy text-white text-lg font-black flex items-center justify-center shrink-0">
                    {initials(selected.display_name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-rowan-navy leading-tight truncate">{selected.display_name}</h2>
                    {selected.company_name && <p className="text-sm text-gray-500">{selected.company_name}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-gray-500">
                      {selected.email && <span className="flex items-center gap-1"><Mail size={12} />{selected.email}</span>}
                      {selected.phone && <span className="flex items-center gap-1"><Phone size={12} />{selected.phone}</span>}
                      {selected.city && <span className="flex items-center gap-1"><MapPin size={12} />{selected.city}</span>}
                    </div>
                    {!selected.is_active && (
                      <span className="inline-block mt-2 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isCustomer ? (
                    <>
                      <Link href="/accounting/receive-payment" className={btnSecondary}>Receive Payment</Link>
                      <Link href="/accounting/invoice" className={btnPrimary}><Plus size={15} /> Invoice</Link>
                    </>
                  ) : (
                    <>
                      <Link href="/accounting/pay-bills" className={btnSecondary}>Pay Bills</Link>
                      <Link href="/accounting/record-expense" className={btnPrimary}><Plus size={15} /> Bill</Link>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="grid grid-cols-2 gap-4 flex-1 min-w-[280px] max-w-xl">
                  <StatTile
                    label={isCustomer ? 'Owes you' : 'You owe'}
                    value={`LKR ${fmt(txLoading ? balances[selected.id] ?? 0 : postedBalance)}`}
                    tone="red"
                  />
                  <StatTile label="Payment terms" value={termsLabel(selected.payment_terms)} tone="navy" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditTarget(selected)}
                    className="border border-rowan-navy text-rowan-navy px-4 py-2 rounded-full text-xs font-bold hover:bg-rowan-navy hover:text-white transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(selected)}
                    className="border border-gray-300 text-gray-500 px-4 py-2 rounded-full text-xs font-bold hover:border-rowan-red hover:text-rowan-red transition"
                  >
                    {selected.is_active ? 'Make Inactive' : 'Make Active'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200 mb-4">
                {(['transactions', 'details'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition ${
                      tab === t ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                    }`}
                  >
                    {t === 'transactions' ? 'Transactions' : 'Details'}
                    {t === 'transactions' && tx.length > 0 && (
                      <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{tx.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'details' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
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
              ) : txLoading ? (
                <div className="py-8 flex justify-center"><LoadingSpinner size="sm" /></div>
              ) : tx.length === 0 ? (
                <p className="text-[12px] text-gray-400 italic py-6">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Entry #</th>
                        <th className="px-3 py-2">Memo</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 whitespace-nowrap">{r.entry_date}</td>
                          <td className="px-3 py-2 font-bold text-rowan-navy whitespace-nowrap">{r.entry_number}</td>
                          <td className="px-3 py-2 text-gray-500">{r.memo ?? '—'}</td>
                          <td className="px-3 py-2 capitalize text-gray-500">{r.status}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">{r.debit ? fmt(r.debit) : ''}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">{r.credit ? fmt(r.credit) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && <PartyModal kind={kind} onClose={() => setModalOpen(false)} onSave={handleCreate} />}
      {editTarget && (
        <PartyModal kind={kind} initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdate} />
      )}
    </div>
  );
}

function Field({ label, value, full = false }: { label: string; value: string | null | undefined; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-rowan-navy">{value || '—'}</span>
    </div>
  );
}
