'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CostingSettings, getCostingSettings, updateCostingSettings } from '@/lib/styles';

const CONFIRM_PHRASE = 'RESET';

export default function AdminPage() {
  const [confirmText, setConfirmText] = useState('');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [costing, setCosting] = useState<CostingSettings | null>(null);
  const [savingCosting, setSavingCosting] = useState(false);
  const [costingSaved, setCostingSaved] = useState(false);

  useEffect(() => {
    getCostingSettings().then(setCosting).catch(() => {});
  }, []);

  async function handleSaveCosting() {
    if (!costing) return;
    setSavingCosting(true);
    setCostingSaved(false);
    try {
      await updateCostingSettings(costing);
      setCostingSaved(true);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save costing standards.');
    } finally {
      setSavingCosting(false);
    }
  }

  const canReset = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  async function handleReset() {
    if (!canReset) return;
    setRunning(true);
    setError(null);
    try {
      const { error: rpcErr } = await supabase.rpc('reset_all_transactions');
      if (rpcErr) throw rpcErr;
      setDone(true);
      setConfirmText('');
    } catch (e: any) {
      setError(e.message ?? 'Reset failed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/accounting" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Back</Link>
        <h1 className="text-xl font-black text-rowan-navy mt-1 mb-6">Admin</h1>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-rowan-navy text-white px-5 py-3">
            <h2 className="font-black uppercase tracking-widest text-sm">Costing Standards</h2>
          </div>
          <div className="p-5 text-sm">
            <p className="text-gray-600 mb-4">
              Company-wide defaults used by every style's Labour &amp; Overhead calculator. A style can override
              Line Efficiency% or Overhead Absorption% individually if it genuinely runs differently — everything
              else falls back to these.
            </p>

            {costingSaved && (
              <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded mb-4">
                Costing standards saved.
              </div>
            )}

            {costing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="h-[34px] flex items-end mb-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase leading-tight">Cost Per Minute</label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.cost_per_minute}
                    onChange={(e) => setCosting({ ...costing, cost_per_minute: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Wage cost to produce one standard minute of work</p>
                </div>
                <div>
                  <div className="h-[34px] flex items-end mb-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase leading-tight">Default Line Efficiency %</label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.default_line_efficiency_pct}
                    onChange={(e) => setCosting({ ...costing, default_line_efficiency_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Real output vs. time-studied standard</p>
                </div>
                <div>
                  <div className="h-[34px] flex items-end mb-1">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase leading-tight">Default Overhead Absorption %</label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={costing.default_overhead_absorption_pct}
                    onChange={(e) => setCosting({ ...costing, default_overhead_absorption_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">% of labour cost absorbed as factory overhead</p>
                </div>
              </div>
            ) : (
              <div className="py-6 flex justify-center"><LoadingSpinner size="sm" /></div>
            )}

            <button
              disabled={!costing || savingCosting}
              onClick={handleSaveCosting}
              className="px-5 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
            >
              {savingCosting && <LoadingSpinner size="sm" />}
              Save Costing Standards
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border-2 border-rowan-red overflow-hidden">
          <div className="bg-rowan-red text-white px-5 py-3">
            <h2 className="font-black uppercase tracking-widest text-sm">Danger Zone — Reset All Transactions</h2>
          </div>
          <div className="p-5 text-sm">
            <p className="text-gray-600 mb-3">
              This permanently deletes every transaction from Supabase:
            </p>
            <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-1 text-[13px]">
              <li>All journal entries and their lines</li>
              <li>All invoices and invoice lines</li>
              <li>All payments and payment allocations</li>
              <li>The entire audit log</li>
            </ul>
            <p className="text-gray-600 mb-4">
              JE / Invoice / Payment numbering restarts from <span className="font-mono font-bold">000001</span>.
            </p>
            <p className="text-gray-600 mb-5">
              <strong>Not touched:</strong> Chart of Accounts, Customers, Vendors, Items, and Tax Settings —
              your setup data stays intact.
            </p>

            {done && (
              <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded mb-4">
                All transactions have been wiped. Numbering has been reset.
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Type RESET to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 font-mono"
            />

            <button
              disabled={!canReset || running}
              onClick={handleReset}
              className="w-full bg-rowan-red text-white px-5 py-3 rounded-lg font-bold text-sm hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {running && <LoadingSpinner size="sm" />}
              Permanently Reset All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
