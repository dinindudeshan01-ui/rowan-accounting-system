'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { SearchableSelect } from '@/components/SearchableSelect';
import { AccountModal, Account as ModalAccount } from '@/components/AccountModal';
import { BalanceModal } from '@/components/BalanceModal';
import {
  Account,
  LedgerRow,
  TYPE_LABEL,
  TYPE_ORDER,
  fetchAccountLedger,
  listAccounts,
  normalSide,
} from '@/lib/accounts';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'details' | 'ledger'>('details');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Account | null>(null);
  const [balanceTarget, setBalanceTarget] = useState<Account | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    const data = await listAccounts();
    setAccounts(data);
    setLoading(false);
    if (!selectedId && data.length) setSelectedId(data[0].id);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    return accounts
      .filter((a) => showInactive || a.is_active)
      .filter((a) => typeFilter === 'all' || a.type === typeFilter)
      .filter((a) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.subtype ?? '').toLowerCase().includes(q)
        );
      });
  }, [accounts, search, typeFilter, showInactive]);

  const grouped = useMemo(() => {
    return TYPE_ORDER.map((t) => ({ type: t, items: filtered.filter((a) => a.type === t) })).filter(
      (g) => g.items.length > 0
    );
  }, [filtered]);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || tab !== 'ledger') return;
    setLedgerLoading(true);
    fetchAccountLedger(selected.id)
      .then(setLedger)
      .finally(() => setLedgerLoading(false));
  }, [selected, tab]);

  const balance = useMemo(() => {
    if (!selected) return 0;
    const side = normalSide(selected.type);
    return ledger.reduce((s, r) => s + (side === 'debit' ? r.debit - r.credit : r.credit - r.debit), 0);
  }, [ledger, selected]);

  function handleCreated(modalAccount: ModalAccount) {
    const account = modalAccount as unknown as Account;
    setAccounts((prev) => [...prev, account].sort((a, b) => a.code.localeCompare(b.code)));
    setSelectedId(account.id);
    setCreateOpen(false);
    setToast(`Account ${account.code} — ${account.name} created.`);
  }

  function handleUpdated(modalAccount: ModalAccount) {
    const account = modalAccount as unknown as Account;
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)).sort((a, b) => a.code.localeCompare(b.code)));
    setEditTarget(null);
    setToast(`Account ${account.code} — ${account.name} updated.`);
  }

  async function handleBalancePosted(result: { entryNumber: string; offsetAccountCreated: boolean; offsetAccount: Account }) {
    setBalanceTarget(null);
    if (result.offsetAccountCreated) {
      setAccounts((prev) => [...prev, result.offsetAccount].sort((a, b) => a.code.localeCompare(b.code)));
    }
    setToast(`Balance posted as ${result.entryNumber}.`);
    if (tab === 'ledger' && selected) {
      setLedgerLoading(true);
      fetchAccountLedger(selected.id)
        .then(setLedger)
        .finally(() => setLedgerLoading(false));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Chart of Accounts" />

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href="/accounting/ledger" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Back</Link>
            <h1 className="text-xl font-black text-rowan-navy mt-1">Chart of Accounts</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition"
          >
            + New Account
          </button>
        </div>

        {toast && (
          <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">
            {toast}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex" style={{ minHeight: '70vh' }}>
          {/* Left: account list */}
          <div className="w-80 border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 space-y-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px]"
              />
              <SearchableSelect
                value={typeFilter}
                onChange={setTypeFilter}
                className="text-[12px]"
                options={[
                  { value: 'all', label: 'All types' },
                  ...TYPE_ORDER.map((t) => ({ value: t, label: TYPE_LABEL[t] })),
                ]}
              />
              <label className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold">
                <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
                Show inactive
              </label>
            </div>
            <div className="flex-1 overflow-auto">
              {filtered.length === 0 && (
                <p className="text-[11px] text-gray-400 italic p-4">No accounts found.</p>
              )}
              {grouped.map((g) => (
                <div key={g.type}>
                  <div className="px-4 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 sticky top-0">
                    {TYPE_LABEL[g.type]}
                  </div>
                  {g.items.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedId(a.id);
                        setTab('details');
                      }}
                      className={`w-full text-left px-4 py-2.5 border-b border-gray-100 text-[12px] hover:bg-rowan-bg transition ${
                        selectedId === a.id ? 'bg-rowan-bg border-l-4 border-l-rowan-red' : ''
                      } ${!a.is_active ? 'opacity-40' : ''}`}
                    >
                      <div className="font-bold text-rowan-navy">{a.name}</div>
                      {a.subtype && <div className="text-gray-400 text-[10px]">{a.subtype}</div>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right: detail */}
          <div className="flex-1 p-6">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Select an account on the left, or add a new one.
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-black text-rowan-navy">{selected.name}</h2>
                    <p className="text-xs text-gray-500">
                      {TYPE_LABEL[selected.type as keyof typeof TYPE_LABEL]}
                      {selected.subtype ? ` • ${selected.subtype}` : ''}
                    </p>
                    {!selected.is_active && (
                      <span className="inline-block mt-1 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBalanceTarget(selected)}
                      className="border border-rowan-navy text-rowan-navy px-3 py-1.5 rounded text-[11px] font-bold hover:bg-rowan-navy hover:text-white transition"
                    >
                      + Add Balance
                    </button>
                    <button
                      onClick={() => setEditTarget(selected)}
                      className="border border-gray-300 text-gray-500 px-3 py-1.5 rounded text-[11px] font-bold hover:border-rowan-navy hover:text-rowan-navy transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="flex gap-1 border-b border-gray-200 mb-4">
                  {(['details', 'ledger'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wide border-b-2 -mb-px transition ${
                        tab === t ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                      }`}
                    >
                      {t === 'details' ? 'Details' : 'Entries (Ledger)'}
                    </button>
                  ))}
                </div>

                {tab === 'details' ? (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[12px]">
                    <Field label="Account Type" value={TYPE_LABEL[selected.type as keyof typeof TYPE_LABEL]} />
                    <Field label="Subtype" value={selected.subtype} />
                    <Field label="Status" value={selected.is_active ? 'Active' : 'Inactive'} />
                    <Field label="Description" value={selected.description} full />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[11px] text-gray-400">All journal activity posted against this account.</p>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Balance</span>
                        <span className="text-sm font-black text-rowan-navy">{fmt(balance)}</span>
                      </div>
                    </div>
                    {ledgerLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : ledger.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No entries yet.</p>
                    ) : (
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-left text-gray-400 uppercase text-[9px] border-b border-gray-200">
                            <th className="py-1.5">Date</th>
                            <th className="py-1.5">Entry #</th>
                            <th className="py-1.5">Description</th>
                            <th className="py-1.5">Status</th>
                            <th className="py-1.5 text-right">Debit</th>
                            <th className="py-1.5 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledger.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100">
                              <td className="py-1.5">{r.entry_date}</td>
                              <td className="py-1.5 font-bold text-rowan-navy">{r.entry_number}</td>
                              <td className="py-1.5 text-gray-500">{r.description || r.memo || '—'}</td>
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

      {createOpen && (
        <AccountModal existing={accounts} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      )}
      {editTarget && (
        <AccountModal
          existing={accounts}
          editing={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
        />
      )}
      {balanceTarget && (
        <BalanceModal
          account={balanceTarget}
          accounts={accounts}
          currentUserName={currentUser.name}
          onClose={() => setBalanceTarget(null)}
          onPosted={handleBalancePosted}
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
