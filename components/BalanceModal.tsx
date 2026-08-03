'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Account,
  ensureOpeningBalanceEquityAccount,
  normalSide,
  postAccountBalance,
} from '@/lib/accounts';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalanceModal({
  account,
  accounts,
  currentUserName,
  onClose,
  onPosted,
}: {
  account: Account;
  accounts: Account[];
  currentUserName: string;
  onClose: () => void;
  onPosted: (result: { entryNumber: string; offsetAccountCreated: boolean; offsetAccount: Account }) => void;
}) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('Opening balance');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const side = normalSide(account.type);

  async function handleSave() {
    setError(null);
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!memo.trim()) {
      setError('A memo is required.');
      return;
    }
    setSaving(true);
    try {
      const { account: offsetAccount, created } = await ensureOpeningBalanceEquityAccount(accounts);
      const { entryNumber } = await postAccountBalance({
        account,
        offsetAccountId: offsetAccount.id,
        amount: parsed,
        date,
        memo: memo.trim(),
        createdByName: currentUserName,
      });
      onPosted({ entryNumber, offsetAccountCreated: created, offsetAccount });
    } catch (e: any) {
      setError(e.message ?? 'Failed to post balance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
        <h3 className="text-sm font-bold text-rowan-navy uppercase tracking-wide mb-1">Add Balance</h3>
        <p className="text-[11px] text-gray-500 mb-4">
          Posts a balanced journal entry for <strong>{account.name}</strong>. The offsetting line is generated
          automatically against <strong>Opening Balance Equity</strong> so the ledger always stays in balance.
        </p>

        {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-3 py-2 rounded mb-3">{error}</div>}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">
              Amount ({side === 'debit' ? 'Debit' : 'Credit'} to {account.name})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const raw = e.target.value.replace(/,/g, '');
                if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                setAmount(raw);
              }}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-right"
            />
            {amount && !Number.isNaN(parseFloat(amount)) && (
              <p className="text-gray-400 mt-1">
                Will post {fmt(parseFloat(amount))} {side} to {account.name}, and the opposite side to Opening
                Balance Equity.
              </p>
            )}
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Memo</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-rowan-navy text-white font-bold text-xs hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <LoadingSpinner size="sm" />}
            Post Balance
          </button>
        </div>
      </div>
    </div>
  );
}
