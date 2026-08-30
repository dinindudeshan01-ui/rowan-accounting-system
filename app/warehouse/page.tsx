'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import {
  WarehouseIcon,
  DispatchIcon,
  GatePassIcon,
  StockCountIcon,
  StockValuationIcon,
  StockAdjustmentIcon,
  GrnIcon,
  EnterBillIcon,
} from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function WarehouseDashboard() {
  return (
    <div className="min-h-screen bg-rowan-bg font-body">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <RowanMark size={36} />
              <span className="font-display text-2xl tracking-wide text-rowan-navy">ROWAN</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-display text-2xl tracking-wide text-rowan-navy">Warehouse</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Warehouse" />
        </div>

        <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-8 inline-block">
          ← Main Dashboard
        </Link>

        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-rowan-navy mb-3">Finished Goods</h2>
          <DashGrid>
            <DashCard
              href="/stock"
              label="Stock"
              desc="What's actually on the shelf — in-stock finished goods and raw materials"
              icon={<WarehouseIcon />}
            />
            <DashCard
              href="/stock"
              label="Dispatch"
              desc="Issue finished goods out — sold, sample, or transfer"
              icon={<DispatchIcon />}
            />
            <DashCard
              href="/warehouse/gate-pass"
              label="Gate Pass"
              desc="Document what's leaving or entering the premises"
              icon={<GatePassIcon />}
              disabled
            />
            <DashCard
              href="/warehouse/stock-count"
              label="Stock Count"
              desc="Physical count against the system, then post the variance"
              icon={<StockCountIcon />}
              disabled
            />
            <DashCard
              href="/warehouse/valuation"
              label="Stock Valuation"
              desc="Total stock value at cost, split by material and finished goods"
              icon={<StockValuationIcon />}
            />
            <DashCard
              href="/warehouse/adjustment"
              label="Stock Adjustment"
              desc="Correct a quantity mismatch, with a reason and a GL entry"
              icon={<StockAdjustmentIcon />}
            />
          </DashGrid>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-rowan-navy mb-3">Materials</h2>
          <DashGrid>
            <DashCard
              href="/stock"
              label="GRN"
              desc="Receive raw materials — vendor, quantity, cost, paid now or on account"
              icon={<GrnIcon />}
            />
            <DashCard
              href="/accounting/record-expense"
              label="Enter Bill"
              desc="A vendor bill that isn't stock — services, utilities, non-inventory spend"
              icon={<EnterBillIcon />}
            />
          </DashGrid>
        </div>
      </div>
      <BrandRibbon />
    </div>
  );
}
