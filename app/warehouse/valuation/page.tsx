'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type Row = {
  id: string;
  code: string;
  name: string;
  quantity_on_hand: number;
  unit_cost: number;
  style_id: string | null;
};

function fmt(n: number) {
  return n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StockValuationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOf] = useState(() => new Date());

  useEffect(() => {
    supabase
      .from('items')
      .select('id, code, name, quantity_on_hand, unit_cost, style_id')
      .eq('is_active', true)
      .eq('item_type', 'inventory')
      .order('name')
      .then(({ data }) => {
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  }, []);

  const materials = rows.filter((r) => !r.style_id && r.quantity_on_hand !== 0);
  const finishedGoods = rows.filter((r) => r.style_id && r.quantity_on_hand !== 0);
  const materialsValue = materials.reduce((s, r) => s + r.quantity_on_hand * r.unit_cost, 0);
  const finishedGoodsValue = finishedGoods.reduce((s, r) => s + r.quantity_on_hand * r.unit_cost, 0);
  const totalValue = materialsValue + finishedGoodsValue;

  function Section({ title, data, value }: { title: string; data: Row[]; value: number }) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-rowan-navy">{title}</h3>
          <span className="text-xs font-black text-rowan-navy">{fmt(value)}</span>
        </div>
        {data.length === 0 ? (
          <p className="text-[12px] text-gray-400 py-3">No stock on hand.</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-gray-400 uppercase text-[10px] border-b border-gray-100">
                <th className="py-2">Code</th>
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit Cost</th>
                <th className="py-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {data
                .slice()
                .sort((a, b) => b.quantity_on_hand * b.unit_cost - a.quantity_on_hand * a.unit_cost)
                .map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">{r.code}</td>
                    <td className="py-2 font-bold text-rowan-navy">{r.name}</td>
                    <td className="py-2 text-right">{r.quantity_on_hand.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-500">{fmt(r.unit_cost)}</td>
                    <td className="py-2 text-right font-bold">{fmt(r.quantity_on_hand * r.unit_cost)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <Link href="/warehouse" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Warehouse</Link>
          <div className="mt-1 mb-1"><RowanWordmark markSize={32} /></div>
          <h1 className="text-xl font-black text-rowan-navy mb-1">Stock Valuation</h1>
          <p className="text-[11px] text-gray-400 mb-6">
            As of {asOf.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — weighted-average cost.
            Zero-balance items (including published-but-unproduced styles) are excluded.
          </p>

          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Raw Materials</p>
                  <p className="text-xl font-black text-rowan-navy">{fmt(materialsValue)}</p>
                </div>
                <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Finished Goods</p>
                  <p className="text-xl font-black text-rowan-navy">{fmt(finishedGoodsValue)}</p>
                </div>
                <div className="bg-rowan-navy rounded-lg p-4">
                  <p className="text-[11px] font-bold text-white/60 uppercase">Total Stock Value</p>
                  <p className="text-xl font-black text-white">{fmt(totalValue)}</p>
                </div>
              </div>

              <Section title="Raw Materials & Consumables" data={materials} value={materialsValue} />
              <Section title="Finished Goods" data={finishedGoods} value={finishedGoodsValue} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
