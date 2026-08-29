'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import { LedgerIcon, BankIcon, VendorIcon, CustomerIcon } from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function AccountingDashboard() {
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
            <span className="font-display text-2xl tracking-wide text-rowan-navy">Accounting</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Accounting" />
        </div>

        <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6 inline-block">
          ← Main Dashboard
        </Link>

        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Choose a center</p>

        <DashGrid>
          <DashCard href="/accounting/ledger" label="Ledger" desc="Chart of Accounts, Journal Entries, Audit Trail" icon={<LedgerIcon />} />
          <DashCard href="/accounting/bank" label="Bank" desc="Write Checks, Make Deposit, Reconcile" icon={<BankIcon />} />
          <DashCard href="/accounting/vendors" label="Vendors" desc="Vendor Center, Create Bill, Pay Bills" icon={<VendorIcon />} />
          <DashCard href="/accounting/customers" label="Customers" desc="Customer Center, Invoices, Receive Payment" icon={<CustomerIcon />} />
        </DashGrid>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/accounting/reports" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
            View Reports (Profit & Loss / Balance Sheet) →
          </Link>
        </div>
      </div>
      <BrandRibbon />
    </div>
  );
}
