'use client';

import React from 'react';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import {
  CrmIcon,
  StylesIcon,
  WarehouseIcon,
  AccountingIcon,
  CostingIcon,
  PayrollIcon,
  ReportsIcon,
} from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function MainDashboard() {
  return (
    <div className="min-h-screen bg-rowan-bg font-body">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <RowanMark size={40} />
            <span className="font-display text-3xl tracking-wide text-rowan-navy">ROWAN</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Dashboard" />
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Choose a module</p>

        <DashGrid>
          <DashCard href="/crm" label="CRM" desc="Leads, customers, follow-ups" icon={<CrmIcon />} disabled />
          <DashCard href="/style" label="Styles" desc="Style numbers, BOM, images" icon={<StylesIcon />} />
          <DashCard href="/stock" label="Warehouse" desc="Inventory, GRN, gate passes, adjustments" icon={<WarehouseIcon />} />
          <DashCard href="/accounting" label="Accounting" desc="Ledger, bank, vendors, customers" icon={<AccountingIcon />} />
          <DashCard href="/style/costing" label="Costing" desc="Style costing and margins" icon={<CostingIcon />} disabled />
          <DashCard href="/payroll/run" label="Payroll" desc="Payslips, EPF/ETF/APIT, GL posting" icon={<PayrollIcon />} />
          <DashCard href="/accounting/reports" label="Reports" desc="Profit & Loss, Balance Sheet" icon={<ReportsIcon />} />
        </DashGrid>
      </div>
      <BrandRibbon />
    </div>
  );
}
