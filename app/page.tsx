'use client';

import React from 'react';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { RowanWheel } from '@/components/RowanWheel';
import {
  CrmIcon,
  StylesIcon,
  WarehouseIcon,
  AccountingIcon,
  CostingIcon,
  PayrollIcon,
  DashboardIcon,
} from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function MainDashboard() {
  return (
    <div className="h-screen overflow-hidden bg-rowan-bg font-body flex flex-col">
      <div className="max-w-6xl w-full mx-auto px-6 pt-6 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RowanMark size={40} />
            <span className="font-display text-3xl tracking-wide text-rowan-navy">ROWAN</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Dashboard" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Choose a module</p>
        <RowanWheel
          modules={[
            { key: 'crm', href: '/crm', label: 'CRM', icon: <CrmIcon />, disabled: true },
            { key: 'styles', href: '/style', label: 'Styles', icon: <StylesIcon /> },
            { key: 'warehouse', href: '/stock', label: 'Warehouse', icon: <WarehouseIcon /> },
            { key: 'accounting', href: '/accounting', label: 'Accounting', icon: <AccountingIcon /> },
            { key: 'costing', href: '/style/costing', label: 'Costing', icon: <CostingIcon />, disabled: true },
            { key: 'payroll', href: '/payroll/run', label: 'Payroll', icon: <PayrollIcon /> },
            { key: 'reports', href: '/accounting/reports', label: 'Reports', icon: <DashboardIcon /> },
          ]}
        />
      </div>

      <div className="shrink-0">
        <BrandRibbon />
      </div>
    </div>
  );
}
