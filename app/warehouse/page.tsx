'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
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

export default function WarehouseDashboard() {
  return (
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Warehouse" subtitle="Stock, valuation and adjustments" />
      <div>
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
    </div>
  );
}
