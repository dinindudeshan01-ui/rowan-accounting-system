'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AccountModal, Account as ModalAccount } from '@/components/AccountModal';
import { BalanceModal } from '@/components/BalanceModal';
import { PageHeader, StatTile, btnPrimary } from '@/components/PageHeader';
import { supabase } from '@/lib/supabase';
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

const TYPE_BADGE: Record<string, string> = {
  asset: 'bg-blue-50 text-blue-700',
  liability: 'bg-amber-50 text-amber-700',
  equity: 'bg-purple-50 text-purple-700',
  revenue: 'bg-green-50 text-green-700',
  expense: 'bg-red-50 text-red-700',
};

/** Posted balance for every account, on each account's normal side. */
async function loadBalances(accounts: Account[]): Promise<Record<string, number>> {
  const side: Record<string, 'debit' | 'credit'> = {};
  accounts.forEach((a) => (side[a.id] = normalSide(a.type as any)));
  const out: Record<string, number> = {};
  const PAGE = 1000;
  for (let from = 0; from < 200000; from += PAGE) {
    const { data, error } = await supabase
      .from('journal_lines')
      .select('account_id, debit, credit, journal_entries!inner(status)')
      .eq('journal_entries.status', 'posted')
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    for (const r of data as unknown as any[]) {
      const d = Number(r.debit) || 0;
      const c = Number(r.credit) || 0;
      const v = side[r.account_id] === 'credit' ? c - d : d - c;
      out[r.account_id] = (out[r.account_id] ?? 0) + v;
    }
    if (data.length < PAGE) break;
  }
  return out;
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'details' | 'ledger'>('ledger');

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
    setBalances(await loadBalances(data));
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
    const q = search.trim().toLowerCase();
    return accounts
      .filter((a) => showInactive || a.is_active)
      .filter((a) => typeFilter === 'all' || a.type === typeFilter)
      .filter(
        (a) =>
          !q ||
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.subtype ?? '').toLowerCase().includes(q)
      );
  }, [accounts, search, typeFilter, showInactive]);

  const grouped = useMemo(
    () => TYPE_ORDER.map((t) => ({ type: t, items: filtered.filter((a) => a.type === t) })).filter((g) => g.items.length > 0),
    [filtered]
  );

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    accounts.filter((a) => showInactive || a.is_active).forEach((a) => {
      c[a.type] = (c[a.type] ?? 0) + 1;
      c.all++;
    });
    return c;
  }, [accounts, showInactive]);

  const typeTotal = (t: string) =>
    accounts.filter((a) => a.type === t && a.is_active).reduce((s, a) => s + (balances[a.id] ?? 0), 0);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || tab !== 'ledger') return;
    setLedgerLoading(true);
    fetchAccountLedger(selected.id)
      .then(setLedger)
      .finally(() => setLedgerLoading(false));
  }, [selected, tab]);

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
    const all = await listAccounts();
    setAccounts(all);
    setBalances(await loadBalances(all));
    if (tab === 'ledger' && selected) {
      setLedgerLoading(true);
      fetchAccountLedger(selected.id)
        .then(setLedger)
        .finally(() => setLedgerLoading(false));
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [{ value: 'all', label: 'All' }, ...TYPE_ORDER.map((t) => ({ value: t as string, label: TYPE_LABEL[t] }))];

  return (
    <div className="min-h-full xl:h-full xl:flex xl:flex-col px-6 py-6">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Every account in your books, with its current balance"
        actions={
          <button onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus size={15} /> New Account
          </button>
        }
      />

      {toast && (
        <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded-lg shrink-0">{toast}</div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5 shrink-0">
        <StatTile label="Assets" value={`LKR ${fmt(typeTotal('asset'))}`} tone="navy" />
        <StatTile label="Liabilities" value={`LKR ${fmt(typeTotal('liability'))}`} tone="red" />
        <StatTile label="Revenue" value={`LKR ${fmt(typeTotal('revenue'))}`} tone="green" />
        <StatTile label="Expenses" value={`LKR ${fmt(typeTotal('expense'))}`} tone="gray" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_440px] xl:grid-rows-[minmax(0,1fr)] xl:flex-1 xl:min-h-0 gap-5 items-stretch">
        {/* Left: account table */}
        <div className="bg-white rounded-xl overflow-hidden flex flex-col xl:h-full xl:min-h-0">
          <div className="flex gap-1 px-3 pt-2 border-b border-gray-200 overflow-x-auto shrink-0">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  typeFilter === t.value ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{typeCounts[t.value] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="p-3 border-b border-gray-200 flex items-center gap-4 shrink-0">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code or type…"
                className="w-full pl-9 pr-3 py-2 text-[12px]"
              />
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold whitespace-nowrap">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              Show inactive
            </label>
          </div>

          <div className="overflow-auto flex-1 xl:min-h-0 max-h-[70vh] xl:max-h-none" style={{ minHeight: 260 }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2.5 w-20">Code</th>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Detail type</th>
                  <th className="px-3 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No accounts found.</td></tr>
                )}
                {grouped.map((g) => (
                  <React.Fragment key={g.type}>
                    <tr>
                      <td colSpan={4} className="px-3 py-1.5 bg-gray-50 border-y border-gray-200">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${TYPE_BADGE[g.type] ?? ''}`}>
                          {TYPE_LABEL[g.type]}
                        </span>
                      </td>
                    </tr>
                    {g.items.map((a) => {
                      const bal = balances[a.id] ?? 0;
                      return (
                        <tr
                          key={a.id}
                          onClick={() => setSelectedId(a.id)}
                          className={`cursor-pointer border-b border-gray-100 ${
                            selectedId === a.id ? 'bg-rowan-bg' : 'hover:bg-gray-50'
                          } ${!a.is_active ? 'opacity-40' : ''}`}
                        >
                          <td className={`px-3 py-2.5 font-mono text-gray-500 border-l-4 ${selectedId === a.id ? 'border-l-rowan-red' : 'border-l-transparent'}`}>{a.code}</td>
                          <td className="px-3 py-2.5 font-bold text-rowan-navy">{a.name}</td>
                          <td className="px-3 py-2.5 text-gray-500">{a.subtype ?? '—'}</td>
                          <td className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${Math.abs(bal) < 0.005 ? 'text-gray-300' : 'text-rowan-navy'}`}>
                            {fmt(bal)}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="bg-white rounded-xl overflow-hidden flex flex-col max-h-[85vh] xl:max-h-none xl:h-full xl:min-h-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-16">
              Select an account, or add a new one.
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-gray-200 shrink-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-gray-400">{selected.code}</p>
                    <h2 className="text-lg font-black text-rowan-navy leading-tight">{selected.name}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {TYPE_LABEL[selected.type as keyof typeof TYPE_LABEL]}
                      {selected.subtype ? ` • ${selected.subtype}` : ''}
                    </p>
                    {!selected.is_active && (
                      <span className="inline-block mt-1.5 bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Inactive</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Balance</span>
                    <span className="text-lg font-black text-rowan-navy">{fmt(balances[selected.id] ?? 0)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setBalanceTarget(selected)}
                    className="bg-rowan-navy text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-rowan-red transition-colors"
                  >
                    + Add Balance
                  </button>
                  <button
                    onClick={() => setEditTarget(selected)}
                    className="border border-gray-300 text-rowan-navy px-4 py-2 rounded-full text-xs font-bold hover:border-rowan-navy transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="flex gap-1 border-b border-gray-200 px-3 shrink-0">
                {(['ledger', 'details'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px transition ${
                      tab === t ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                    }`}
                  >
                    {t === 'ledger' ? 'Entries' : 'Details'}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto min-h-0">
                {tab === 'details' ? (
                  <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
                    <Field label="Account Type" value={TYPE_LABEL[selected.type as keyof typeof TYPE_LABEL]} />
                    <Field label="Detail type" value={selected.subtype} />
                    <Field label="Status" value={selected.is_active ? 'Active' : 'Inactive'} />
                    <Field label="Code" value={selected.code} />
                    <Field label="Description" value={selected.description} full />
                  </div>
                ) : ledgerLoading ? (
                  <div className="py-10 flex justify-center"><LoadingSpinner size="sm" /></div>
                ) : ledger.length === 0 ? (
                  <p className="text-[12px] text-gray-400 italic p-5">No entries yet.</p>
                ) : (
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Entry #</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100" title={r.description || r.memo || ''}>
                          <td className="px-3 py-2 whitespace-nowrap">{r.entry_date}</td>
                          <td className="px-3 py-2 font-bold text-rowan-navy whitespace-nowrap">
                            {r.entry_number}
                            {r.status !== 'posted' && <span className="ml-1 text-[9px] font-normal uppercase text-gray-400">{r.status}</span>}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">{r.debit ? fmt(r.debit) : ''}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">{r.credit ? fmt(r.credit) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {createOpen && <AccountModal existing={accounts} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
      {editTarget && (
        <AccountModal existing={accounts} editing={editTarget} onClose={() => setEditTarget(null)} onUpdated={handleUpdated} />
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
      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-rowan-navy">{value || '—'}</span>
    </div>
  );
}
