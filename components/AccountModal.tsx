'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { supabase } from '@/lib/supabase';

export type Account = { id: string; code: string; name: string; type: string; subtype?: string | null; is_active?: boolean };

const TYPE_OPTIONS = ['asset', 'liability', 'equity', 'revenue', 'expense'];

const SUBTYPE_OPTIONS: Record<string, string[]> = {
  asset: [
    'Cash',
    'Bank',
    'Accounts Receivable',
    'Inventory',
    'Prepaid Expenses',
    'Other Current Asset',
    'Property, Plant & Equipment',
    'Accumulated Depreciation',
  ],
  liability: ['Accounts Payable', 'Tax Payable', 'Accrued Expenses', 'Short-term Loan', 'Long-term Loan'],
  equity: ['Share Capital', 'Retained Earnings', "Owner's Drawings", 'Equity'],
  revenue: ['Operating Revenue', 'Other Income'],
  expense: [
    'Direct Materials',
    'Direct Labor',
    'Direct Expenses',
    'Manufacturing Overhead',
    'Selling & Distribution',
    'Administrative Expense',
    'Finance Cost',
  ],
};

const SUBTYPE_HINTS: Record<string, string> = {
  Cash: 'Petty cash / cash in hand',
  Bank: 'Bank current, savings, or overdraft accounts',
  'Accounts Receivable': 'Amounts owed to you by customers',
  Inventory: 'Raw materials, work-in-progress, or finished goods',
  'Prepaid Expenses': 'Paid in advance (e.g. insurance, rent)',
  'Other Current Asset': "Converts to cash within a year, doesn't fit elsewhere",
  'Property, Plant & Equipment': 'Machinery, furniture, vehicles — used long-term',
  'Accumulated Depreciation': 'Contra-asset — running total of depreciation charged',
  'Accounts Payable': 'Amounts you owe to vendors',
  'Tax Payable': 'VAT, SSCL, APIT, EPF, ETF owed to authorities',
  'Accrued Expenses': 'Incurred but not yet paid or invoiced',
  'Short-term Loan': 'Due within a year',
  'Long-term Loan': 'Due beyond a year',
  'Share Capital': "Owner's invested capital",
  'Retained Earnings': 'Accumulated profits kept in the business',
  "Owner's Drawings": 'Withdrawals by the owner',
  Equity: 'General equity — use a specific type above where possible',
  'Operating Revenue': 'Core business income (sales)',
  'Other Income': 'Non-core income (e.g. interest received)',
  'Direct Materials': 'Fabric, trims, packing — becomes part of the garment',
  'Direct Labor': 'Cutting, sewing, finishing wages — traced to production',
  'Direct Expenses': 'Job-specific costs (subcontracting, order-specific freight)',
  'Manufacturing Overhead': 'Factory rent, utilities, machine upkeep — indirect production cost',
  'Selling & Distribution': 'Commission, marketing, delivery to customers',
  'Administrative Expense': 'Office salaries, office rent, admin costs',
  'Finance Cost': 'Bank charges, loan interest',
};

export function AccountModal({
  seedName = '',
  existing,
  editing = null,
  onClose,
  onCreated,
  onUpdated,
}: {
  seedName?: string;
  existing: Account[];
  /** Pass an account to edit it in place; omit/null to create a new one. */
  editing?: Account | null;
  onClose: () => void;
  onCreated?: (account: Account) => void;
  onUpdated?: (account: Account) => void;
}) {
  const isEditing = !!editing;
  const [code, setCode] = useState(editing?.code ?? '');
  const [name, setName] = useState(editing?.name ?? seedName);
  const [type, setType] = useState(editing?.type ?? 'asset');
  const [subtype, setSubtype] = useState(editing?.subtype ?? SUBTYPE_OPTIONS[editing?.type ?? 'asset'][0]);
  const [isActive, setIsActive] = useState(editing?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(newType: string) {
    setType(newType);
    setSubtype(SUBTYPE_OPTIONS[newType][0]);
  }

  const codeTaken = existing.some((a) => a.code === code.trim() && a.id !== editing?.id);

  async function handleSave() {
    const codeTrimmed = code.trim();
    if (!codeTrimmed || !name.trim()) {
      setError('Account code and name are required.');
      return;
    }
    if (codeTaken) {
      setError('That account code is already in use.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && editing) {
        const { data, error: updateErr } = await supabase
          .from('chart_of_accounts')
          .update({ code: codeTrimmed, name: name.trim(), type, subtype, is_active: isActive })
          .eq('id', editing.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        onUpdated?.(data as Account);
      } else {
        const { data, error: insertErr } = await supabase
          .from('chart_of_accounts')
          .insert({ code: codeTrimmed, name: name.trim(), type, subtype, is_active: isActive })
          .select()
          .single();
        if (insertErr) throw insertErr;
        onCreated?.(data as Account);
      }
    } catch (e: any) {
      setError(e.message ?? `Failed to ${isEditing ? 'update' : 'create'} account.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5">
        <h3 className="text-sm font-bold text-rowan-navy uppercase tracking-wide mb-4">
          {isEditing ? 'Edit Account' : 'New Account'}
        </h3>

        {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-3 py-2 rounded mb-3">{error}</div>}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-500 mb-1">Account Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full border rounded px-2 py-1.5 ${codeTaken ? 'border-rowan-red' : 'border-gray-300'}`}
              placeholder="e.g. 1050"
            />
            {codeTaken && (
              <p className="text-rowan-red mt-1">
                Code {code.trim()} is already used by "{existing.find((a) => a.code === code.trim())?.name}".
              </p>
            )}
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Account Type</label>
            <SearchableSelect
              value={type}
              onChange={handleTypeChange}
              options={TYPE_OPTIONS.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))}
            />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">Account Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5"
              placeholder="e.g. Petty Cash"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-500 mb-1">
              {type === 'expense' ? 'Cost Category' : 'Subtype'}
            </label>
            <SearchableSelect
              value={subtype}
              onChange={setSubtype}
              options={SUBTYPE_OPTIONS[type].map((s) => ({ value: s, label: s }))}
            />
            {SUBTYPE_HINTS[subtype] && <p className="text-gray-400 mt-1">{SUBTYPE_HINTS[subtype]}</p>}
          </div>
          {isEditing && (
            <label className="flex items-center gap-2 font-bold text-gray-500">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50">
            Cancel
          </button>
          <button type="button"
            onClick={handleSave}
            disabled={saving || codeTaken}
            className="px-4 py-2 rounded-lg bg-rowan-navy text-white font-bold text-xs hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <LoadingSpinner size="sm" />}
            {isEditing ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
