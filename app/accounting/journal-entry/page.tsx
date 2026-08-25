'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';

type Account = { id: string; code: string; name: string; type: string };

type Line = {
  key: string;
  account_id: string;
  debit: string;
  credit: string;
  description: string;
  name: string;
  className: string;
  location: string;
  attachment_url: string;
  autoFilled: boolean; // true if debit/credit was set by the auto-balance helper, not typed by the user
};

type RecentEntry = {
  id: string;
  entry_number: string;
  entry_date: string;
  memo: string | null;
  status: 'draft' | 'posted' | 'void';
};

const emptyLine = (): Line => ({
  key: crypto.randomUUID(),
  account_id: '',
  debit: '',
  credit: '',
  description: '',
  name: '',
  className: '',
  location: '',
  attachment_url: '',
  autoFilled: false,
});

const CLASS_OPTIONS = ['Head Office', 'Retail Outlet', 'Online Store', 'Production'];
const LOCATION_OPTIONS = ['Colombo', 'Negombo', 'Kandy', 'Warehouse'];
const RECENT_PERIODS = ['This Month', 'Last Month', 'This Quarter', 'This Fiscal Year', 'All'] as const;

// Formats a raw numeric string as "10,000.00". Empty/invalid input passes through
// unchanged so the field can still show a blank box or a partial value while typing.
function formatMoney(raw: string): string {
  if (raw === '' || raw === null || raw === undefined) return '';
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return raw;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Strips commas back out so we can parse/store a plain numeric string.
function unformatMoney(display: string): string {
  return display.replace(/,/g, '');
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expenses',
};

function groupAccountsByType(accounts: Account[]) {
  const groups: { label: string; items: Account[] }[] = [];
  const order = ['asset', 'liability', 'equity', 'revenue', 'expense'];
  for (const type of order) {
    const items = accounts.filter((a) => a.type === type);
    if (items.length) groups.push({ label: ACCOUNT_TYPE_LABELS[type] ?? type, items });
  }
  // Catch any type not in the known order, just in case.
  const known = new Set(order);
  const leftovers = accounts.filter((a) => !known.has(a.type));
  if (leftovers.length) groups.push({ label: 'Other', items: leftovers });
  return groups;
}

function periodBounds(period: string): { start?: string; end?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'This Month') {
    return { start: toISO(new Date(y, m, 1)), end: toISO(new Date(y, m + 1, 0)) };
  }
  if (period === 'Last Month') {
    return { start: toISO(new Date(y, m - 1, 1)), end: toISO(new Date(y, m, 0)) };
  }
  if (period === 'This Quarter') {
    const qStartMonth = Math.floor(m / 3) * 3;
    return { start: toISO(new Date(y, qStartMonth, 1)), end: toISO(new Date(y, qStartMonth + 3, 0)) };
  }
  if (period === 'This Fiscal Year') {
    const fyStartYear = m >= 3 ? y : y - 1;
    return { start: toISO(new Date(fyStartYear, 3, 1)), end: toISO(new Date(fyStartYear + 1, 2, 31)) };
  }
  return {};
}

export default function JournalEntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryNumber, setEntryNumber] = useState<string | null>(null);
  const [entryStatus, setEntryStatus] = useState<RecentEntry['status'] | null>(null);
  const [previewNumber, setPreviewNumber] = useState<string | null>(null);

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [memo, setMemo] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);

  const [saving, setSaving] = useState(false);
  const [reversing, setReversing] = useState(false);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recentPeriod, setRecentPeriod] = useState<string>('Last Month');
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [newAccountLineKey, setNewAccountLineKey] = useState<string | null>(null);
  const [newAccountCode, setNewAccountCode] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState('asset');
  const [newAccountSubtype, setNewAccountSubtype] = useState('');
  const [newAccountSaving, setNewAccountSaving] = useState(false);
  const [newAccountError, setNewAccountError] = useState<string | null>(null);

  // Which "<lineKey>-debit" / "<lineKey>-credit" cell currently has focus, so we
  // can show the raw number while typing and the "10,000.00" formatted version
  // the rest of the time.
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const currentUser = { id: 'demo-user', name: 'Dinindu' };
  const isLocked = entryStatus === 'posted';

  useEffect(() => {
    supabase
      .from('chart_of_accounts')
      .select('id, code, name, type')
      .eq('is_active', true)
      .order('code')
      .then(({ data }) => setAccounts(data ?? []));

    fetchPreviewNumber();
  }, []);

  useEffect(() => {
    loadRecentEntries(recentPeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentPeriod]);

  async function fetchPreviewNumber() {
    const { data } = await supabase.rpc('next_je_number_preview');
    if (typeof data === 'string') setPreviewNumber(data);
  }

  async function loadRecentEntries(period: string) {
    setRecentLoading(true);
    const { start, end } = periodBounds(period);
    let query = supabase
      .from('journal_entries')
      .select('id, entry_number, entry_date, memo, status')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000);
    if (start) query = query.gte('entry_date', start);
    if (end) query = query.lte('entry_date', end);
    const { data } = await query;
    setRecentEntries((data as RecentEntry[]) ?? []);
    setRecentLoading(false);
  }

  async function loadEntryIntoForm(id: string) {
    setError(null);
    setSavedNumber(null);
    const { data: entry } = await supabase.from('journal_entries').select('*').eq('id', id).single();
    const { data: entryLines } = await supabase
      .from('journal_lines')
      .select('*')
      .eq('entry_id', id)
      .order('line_no');
    if (!entry) return;

    setEntryId(entry.id);
    setEntryNumber(entry.entry_number);
    setEntryStatus(entry.status);
    setEntryDate(entry.entry_date);
    setReference(entry.reference ?? '');
    setMemo(entry.memo ?? '');
    setIsRecurring(entry.is_recurring);
    setRecurringInterval(entry.recurring_interval ?? 'monthly');
    setIsAdjusting(entry.is_adjusting ?? false);
    setLines(
      (entryLines ?? []).map((l: any) => ({
        key: crypto.randomUUID(),
        account_id: l.account_id,
        debit: l.debit ? String(l.debit) : '',
        credit: l.credit ? String(l.credit) : '',
        description: l.description ?? '',
        name: '',
        className: l.class ?? '',
        location: l.location ?? '',
        attachment_url: l.attachment_url ?? '',
        autoFilled: false,
      }))
    );
  }

  function resetForm() {
    setEntryId(null);
    setEntryNumber(null);
    setEntryStatus(null);
    setEntryDate(new Date().toISOString().slice(0, 10));
    setReference('');
    setMemo('');
    setIsRecurring(false);
    setRecurringInterval('monthly');
    setIsAdjusting(false);
    setLines([emptyLine(), emptyLine()]);
    setSavedNumber(null);
    setError(null);
    fetchPreviewNumber();
  }

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const credit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
    return { debit, credit, diff: +(debit - credit).toFixed(2) };
  }, [lines]);

  const isBalanced = totals.diff === 0 && totals.debit > 0;

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((prev) => {
      let next = prev.map((l) => (l.key === key ? { ...l, ...patch } : l));

      const touchedAmount = 'debit' in patch || 'credit' in patch;
      if (touchedAmount) {
        const editedIndex = next.findIndex((l) => l.key === key);
        const nextLine = next[editedIndex + 1];

        // Only auto-fill the line immediately below the one being edited, and
        // only while that line hasn't been hand-typed by the user (it's either
        // still empty, or its current value was itself set by this auto-fill).
        // The moment the user types into it directly, autoFilled is cleared
        // (see the debit/credit input handlers below) and this stops touching it.
        const nextLineIsFair = nextLine && (nextLine.autoFilled || (!nextLine.debit && !nextLine.credit));
        if (nextLineIsFair) {
          const totalDebit = next.reduce((s, l, i) => (i === editedIndex + 1 ? s : s + (parseFloat(l.debit) || 0)), 0);
          const totalCredit = next.reduce((s, l, i) => (i === editedIndex + 1 ? s : s + (parseFloat(l.credit) || 0)), 0);
          const diff = +(totalDebit - totalCredit).toFixed(2);

          next = next.map((l, i) => {
            if (i !== editedIndex + 1) return l;
            if (diff === 0) return { ...l, debit: l.autoFilled ? '' : l.debit, credit: l.autoFilled ? '' : l.credit, autoFilled: false };
            return diff > 0
              ? { ...l, credit: diff.toFixed(2), debit: '', autoFilled: true }
              : { ...l, debit: (-diff).toFixed(2), credit: '', autoFilled: true };
          });
        }
      }

      return next;
    });
  }

  function suggestNextCode(type: string) {
    const bases: Record<string, number> = {
      asset: 1000,
      liability: 2000,
      equity: 3000,
      revenue: 4000,
      expense: 5000,
    };
    const base = bases[type] ?? 1000;
    const used = new Set(accounts.map((a) => a.code));
    // Tightly pack: base+1, base+2, base+3... (matches sql/007_renumber_accounts.sql)
    for (let c = base + 1; c < base + 1000; c++) {
      const code = String(c).padStart(4, '0');
      if (!used.has(code)) return code;
    }
    return '';
  }

  function openNewAccountModal(lineKey: string) {
    setNewAccountLineKey(lineKey);
    setNewAccountCode(suggestNextCode('asset'));
    setNewAccountName('');
    setNewAccountType('asset');
    setNewAccountSubtype('');
    setNewAccountError(null);
  }

  function closeNewAccountModal() {
    setNewAccountLineKey(null);
  }

  async function createNewAccount() {
    setNewAccountError(null);
    const codeTrimmed = newAccountCode.trim();
    if (!codeTrimmed || !newAccountName.trim()) {
      setNewAccountError('Code and name are required.');
      return;
    }
    const existing = accounts.find((a) => a.code === codeTrimmed);
    if (existing) {
      setNewAccountError(`Account code ${codeTrimmed} is already used by "${existing.name}". Please use a different code.`);
      return;
    }
    setNewAccountSaving(true);
    try {
      const { data, error: insertErr } = await supabase
        .from('chart_of_accounts')
        .insert({
          code: codeTrimmed,
          name: newAccountName.trim(),
          type: newAccountType,
          subtype: newAccountSubtype.trim() || null,
          is_active: true,
        })
        .select('id, code, name, type')
        .single();
      if (insertErr) {
        // Fallback in case of a race (someone else created the same code between
        // our check above and this insert) - the DB's unique constraint will
        // reject it, so translate that into the same friendly message.
        if (insertErr.code === '23505' || /duplicate key|unique constraint/i.test(insertErr.message)) {
          throw new Error(`Account code ${codeTrimmed} is already in use. Please use a different code.`);
        }
        throw insertErr;
      }

      setAccounts((prev) => [...prev, data as Account].sort((a, b) => a.code.localeCompare(b.code)));
      if (newAccountLineKey) {
        updateLine(newAccountLineKey, { account_id: data.id });
      }
      setNewAccountLineKey(null);
    } catch (e: any) {
      setNewAccountError(e.message ?? 'Failed to create account.');
    } finally {
      setNewAccountSaving(false);
    }
  }

  function fillMemoDefault(key: string, currentDescription: string) {
    if (!currentDescription && memo) {
      updateLine(key, { description: memo });
    }
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.key !== key) : prev));
  }

  async function handleSave(post: boolean) {
    setError(null);
    const validLines = lines.filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));

    if (validLines.length < 2) {
      setError('Add at least two lines with an account and an amount.');
      return;
    }
    if (post && !isBalanced) {
      setError(`Entry is not balanced. Difference: ${formatMoney(totals.diff.toFixed(2))}`);
      return;
    }

    setSaving(true);
    try {
      let entry: any;

      if (entryId) {
        const { data: updated, error: updateErr } = await supabase
          .from('journal_entries')
          .update({
            entry_date: entryDate,
            reference,
            memo,
            is_recurring: isRecurring,
            recurring_interval: isRecurring ? recurringInterval : null,
            is_adjusting: isAdjusting,
          })
          .eq('id', entryId)
          .select()
          .single();
        if (updateErr) throw updateErr;
        entry = updated;

        const { error: delErr } = await supabase.from('journal_lines').delete().eq('entry_id', entryId);
        if (delErr) throw delErr;
      } else {
        const { data: inserted, error: entryErr } = await supabase
          .from('journal_entries')
          .insert({
            entry_date: entryDate,
            reference,
            memo,
            status: 'draft',
            source_type: 'manual',
            is_recurring: isRecurring,
            recurring_interval: isRecurring ? recurringInterval : null,
            is_adjusting: isAdjusting,
            created_by_name: currentUser.name,
          })
          .select()
          .single();
        if (entryErr) throw entryErr;
        entry = inserted;
      }

      const lineRows = validLines.map((l, idx) => ({
        entry_id: entry.id,
        line_no: idx + 1,
        account_id: l.account_id,
        debit: parseFloat(l.debit) || 0,
        credit: parseFloat(l.credit) || 0,
        description: l.description || null,
        class: l.className || null,
        location: l.location || null,
        attachment_url: l.attachment_url || null,
      }));

      const { error: linesErr } = await supabase.from('journal_lines').insert(lineRows);
      if (linesErr) throw linesErr;

      if (post) {
        const { error: postErr } = await supabase.from('journal_entries').update({ status: 'posted' }).eq('id', entry.id);
        if (postErr) throw postErr;
      }

      setSavedNumber(entry.entry_number);
      resetForm();
      loadRecentEntries(recentPeriod);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save journal entry.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReverse() {
    if (!entryId || entryStatus !== 'posted') return;
    setError(null);
    setReversing(true);
    try {
      const { data: origLines } = await supabase
        .from('journal_lines')
        .select('*')
        .eq('entry_id', entryId)
        .order('line_no');
      if (!origLines || origLines.length === 0) throw new Error('Could not load original entry lines.');

      const { data: newEntry, error: entryErr } = await supabase
        .from('journal_entries')
        .insert({
          entry_date: new Date().toISOString().slice(0, 10),
          reference,
          memo: `Reversal of ${entryNumber}`,
          status: 'draft',
          source_type: 'manual',
          source_id: entryId,
          is_recurring: false,
          is_adjusting: isAdjusting,
          created_by_name: currentUser.name,
        })
        .select()
        .single();
      if (entryErr) throw entryErr;

      const reversedLineRows = origLines.map((l: any, idx: number) => ({
        entry_id: newEntry.id,
        line_no: idx + 1,
        account_id: l.account_id,
        debit: l.credit,
        credit: l.debit,
        description: l.description,
        class: l.class,
        location: l.location,
        attachment_url: l.attachment_url,
      }));
      const { error: linesErr } = await supabase.from('journal_lines').insert(reversedLineRows);
      if (linesErr) throw linesErr;

      // NOTE: this used to auto-post the reversal immediately, which locked
      // the form (isLocked = entryStatus === 'posted') before you ever got to
      // look at it - it just appeared frozen/unreadable. Leave it as a draft
      // so you land on an editable entry and post it yourself when ready.
      setSavedNumber(newEntry.entry_number);
      loadEntryIntoForm(newEntry.id);
      loadRecentEntries(recentPeriod);
    } catch (e: any) {
      setError(e.message ?? 'Failed to reverse entry.');
    } finally {
      setReversing(false);
    }
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Journal Entry" />

      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <RowanWordmark />
            <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Journal Entry</h2>
          </div>

          {savedNumber && (
            <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">
              Saved as <strong>{savedNumber}</strong>.
            </div>
          )}
          {isLocked && (
            <div className="mb-4 bg-blue-50 border border-blue-300 text-blue-800 text-sm px-4 py-2 rounded">
              This entry is posted and locked for editing. Use <strong>Reverse</strong> to correct it.
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-800 text-sm px-4 py-2 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-5 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-1">Journal Date</label>
              <input
                type="date"
                value={entryDate}
                disabled={isLocked}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-1">Journal No.</label>
              <input
                disabled
                value={entryNumber ?? (previewNumber ? `${previewNumber} (next)` : 'Loading...')}
                className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-gray-500 font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-500 text-xs font-bold mb-1">Reference No. (optional)</label>
              <input
                value={reference}
                disabled={isLocked}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. PO-1042, adjustment ref"
                className="w-full border border-gray-300 rounded px-2 py-1.5 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <input
                  type="checkbox"
                  checked={isAdjusting}
                  disabled={isLocked}
                  onChange={(e) => setIsAdjusting(e.target.checked)}
                />
                Adjusting Entry
              </label>
            </div>
          </div>

          <table className="w-full text-xs mb-2 border-collapse">
            <thead>
              <tr className="bg-rowan-navy text-white text-left">
                <th className="p-2 w-56">Account</th>
                <th className="p-2">Description</th>
                <th className="p-2 w-32 text-right">Debit</th>
                <th className="p-2 w-32 text-right">Credit</th>
                <th className="p-2 w-32">Name (optional)</th>
                <th className="p-2 w-28">Class (optional)</th>
                <th className="p-2 w-28">Location (optional)</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className="border-b border-gray-200">
                  <td className="p-1">
                    <SearchableSelect
                      value={line.account_id}
                      disabled={isLocked}
                      onChange={(v) => {
                        if (v === '__add_new__') {
                          openNewAccountModal(line.key);
                          return;
                        }
                        updateLine(line.key, { account_id: v });
                      }}
                      placeholder="Select account..."
                      options={[
                        { value: '__add_new__', label: '+ Add new account...', action: true },
                        ...groupAccountsByType(accounts).flatMap((group) =>
                          group.items.map((a) => ({
                            value: a.id,
                            label: `${a.code} — ${a.name}`,
                            group: group.label,
                          }))
                        ),
                      ]}
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={line.description}
                      disabled={isLocked}
                      onFocus={() => fillMemoDefault(line.key, line.description)}
                      onChange={(e) => updateLine(line.key, { description: e.target.value })}
                      className="w-full border border-gray-300 rounded px-1 py-1 disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="Line memo"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={focusedField === `${line.key}-debit` ? line.debit : formatMoney(line.debit)}
                      disabled={isLocked}
                      onFocus={() => setFocusedField(`${line.key}-debit`)}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        const raw = unformatMoney(e.target.value);
                        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                        updateLine(line.key, { debit: raw, credit: raw ? '' : line.credit, autoFilled: false });
                      }}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-right disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={focusedField === `${line.key}-credit` ? line.credit : formatMoney(line.credit)}
                      disabled={isLocked}
                      onFocus={() => setFocusedField(`${line.key}-credit`)}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        const raw = unformatMoney(e.target.value);
                        if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                        updateLine(line.key, { credit: raw, debit: raw ? '' : line.debit, autoFilled: false });
                      }}
                      className="w-full border border-gray-300 rounded px-1 py-1 text-right disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      value={line.name}
                      disabled={isLocked}
                      onChange={(e) => updateLine(line.key, { name: e.target.value })}
                      className="w-full border border-gray-300 rounded px-1 py-1 disabled:bg-gray-50 disabled:text-gray-400"
                      placeholder="Customer/Vendor"
                    />
                  </td>
                  <td className="p-1">
                    <SearchableSelect
                      value={line.className}
                      disabled={isLocked}
                      onChange={(v) => updateLine(line.key, { className: v })}
                      placeholder="—"
                      options={[{ value: '', label: '—' }, ...CLASS_OPTIONS.map((c) => ({ value: c, label: c }))]}
                    />
                  </td>
                  <td className="p-1">
                    <SearchableSelect
                      value={line.location}
                      disabled={isLocked}
                      onChange={(v) => updateLine(line.key, { location: v })}
                      placeholder="—"
                      options={[{ value: '', label: '—' }, ...LOCATION_OPTIONS.map((l) => ({ value: l, label: l }))]}
                    />
                  </td>
                  <td className="p-1 text-center">
                    {!isLocked && (
                      <button onClick={() => removeLine(line.key)} className="text-gray-400 hover:text-rowan-red" title="Remove line">
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLocked && (
            <button onClick={addLine} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6">
              + Add line
            </button>
          )}

          <div className="flex justify-end mb-6">
            <table className="text-xs w-72">
              <tbody>
                <tr>
                  <td className="p-1 text-gray-500">Total Debit</td>
                  <td className="p-1 text-right font-bold">{formatMoney(totals.debit.toFixed(2))}</td>
                </tr>
                <tr>
                  <td className="p-1 text-gray-500">Total Credit</td>
                  <td className="p-1 text-right font-bold">{formatMoney(totals.credit.toFixed(2))}</td>
                </tr>
                <tr className={totals.diff !== 0 ? 'text-rowan-red' : 'text-green-600'}>
                  <td className="p-1 font-bold">Difference</td>
                  <td className="p-1 text-right font-bold">{formatMoney(totals.diff.toFixed(2))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-gray-500 text-xs font-bold mb-1">Memo (optional)</label>
              <textarea
                value={memo}
                disabled={isLocked}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-2 py-1.5 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="Reason for this entry"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-1">
                <input type="checkbox" checked={isRecurring} disabled={isLocked} onChange={(e) => setIsRecurring(e.target.checked)} />
                Make this a recurring entry
              </label>
              {isRecurring && (
                <SearchableSelect
                  value={recurringInterval}
                  disabled={isLocked}
                  onChange={setRecurringInterval}
                  className="mt-1"
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-3">
            <div>
              {entryId && (
                <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50">
                  + New Entry
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {isLocked && (
                <button
                  disabled={reversing}
                  onClick={handleReverse}
                  className="px-5 py-2 rounded-lg border border-rowan-red text-rowan-red font-bold text-sm hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {reversing && <LoadingSpinner size="sm" />}
                  Reverse
                </button>
              )}
              <button
                disabled={saving || isLocked}
                onClick={() => handleSave(false)}
                className="px-5 py-2 rounded-lg border border-rowan-navy text-rowan-navy font-bold text-sm hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <LoadingSpinner size="sm" />}
                Save as Draft
              </button>
              <button
                disabled={saving || !isBalanced || isLocked}
                onClick={() => handleSave(true)}
                className="px-5 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-40 inline-flex items-center gap-2"
                title={!isBalanced ? 'Entry must balance before posting' : ''}
              >
                {saving && <LoadingSpinner size="sm" />}
                Save and Post
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy">Recent Journal Entries</h3>
              <SearchableSelect
                value={recentPeriod}
                onChange={setRecentPeriod}
                className="w-44"
                options={RECENT_PERIODS.map((p) => ({ value: p, label: p }))}
              />
            </div>

            {recentLoading ? (
              <div className="py-6 flex justify-center">
                <LoadingSpinner size="sm" label="Loading..." />
              </div>
            ) : recentEntries.length === 0 ? (
              <p className="text-xs text-gray-400 py-4">No entries for this period.</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200 text-left">
                    <th className="p-2">Entry No.</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Memo</th>
                    <th className="p-2">Status</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${entryId === r.id ? 'bg-gray-50' : ''}`}
                    >
                      <td className="p-2 font-mono">{r.entry_number}</td>
                      <td className="p-2">{new Date(r.entry_date).toLocaleDateString()}</td>
                      <td className="p-2">{r.memo || '—'}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'posted'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'void'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button onClick={() => loadEntryIntoForm(r.id)} className="text-rowan-navy font-bold hover:text-rowan-red">
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <BrandRibbon />
      </div>

      {newAccountLineKey && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy mb-4">Add New Account</h3>

            {newAccountError && (
              <div className="mb-3 bg-red-50 border border-red-300 text-red-800 text-xs px-3 py-2 rounded">
                {newAccountError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1">Code</label>
                <input
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                  className={`w-full border rounded px-2 py-1.5 ${
                    accounts.some((a) => a.code === newAccountCode.trim()) ? 'border-rowan-red' : 'border-gray-300'
                  }`}
                  placeholder="e.g. 1050"
                />
                {accounts.some((a) => a.code === newAccountCode.trim()) && (
                  <p className="text-rowan-red text-xs mt-1">
                    Code {newAccountCode.trim()} is already used by "
                    {accounts.find((a) => a.code === newAccountCode.trim())?.name}".
                  </p>
                )}
              </div>
              <div>
                <label className="block text-gray-500 text-xs font-bold mb-1">Type</label>
                <SearchableSelect
                  value={newAccountType}
                  onChange={(v) => {
                    setNewAccountType(v);
                    setNewAccountCode(suggestNextCode(v));
                  }}
                  options={[
                    { value: 'asset', label: 'Asset' },
                    { value: 'liability', label: 'Liability' },
                    { value: 'equity', label: 'Equity' },
                    { value: 'revenue', label: 'Revenue' },
                    { value: 'expense', label: 'Expense' },
                  ]}
                />
              </div>
            </div>

            <div className="mb-3 text-sm">
              <label className="block text-gray-500 text-xs font-bold mb-1">Account Name</label>
              <input
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
                placeholder="e.g. Petty Cash"
                autoFocus
              />
            </div>

            <div className="mb-5 text-sm">
              <label className="block text-gray-500 text-xs font-bold mb-1">Subtype (optional)</label>
              <input
                value={newAccountSubtype}
                onChange={(e) => setNewAccountSubtype(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5"
                placeholder="e.g. Current Asset"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeNewAccountModal}
                disabled={newAccountSaving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewAccount}
                disabled={newAccountSaving || accounts.some((a) => a.code === newAccountCode.trim())}
                className="px-4 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
              >
                {newAccountSaving && <LoadingSpinner size="sm" />}
                Create & Use
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
