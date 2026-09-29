'use client';

import React from 'react';
import Link from 'next/link';
import { DashCard, DashGrid } from '@/components/DashCard';
import { LedgerIcon, BankIcon, VendorIcon, CustomerIcon } from '@/components/icons/RowanIcons';

export default function AccountingDashboard() {
  return (
    <div className="min-h-full font-body px-6 py-6">
      <h1 className="text-2xl font-black text-rowan-navy">Accounting</h1>
      <p className="text-sm text-gray-500 mt-0.5 mb-6">Choose a center</p>

      <DashGrid>
        <DashCard href="/accounting/ledger" label="Ledger" desc="Chart of Accounts, Journal Entries, Audit Trail" icon={<LedgerIcon />} />
        <DashCard href="/accounting/bank" label="Bank" desc="Write Checks, Make Deposit, Reconcile" icon={<BankIcon />} />
        <DashCard href="/accounting/vendors" label="Vendors" desc="Vendor Center, Create Bill, Pay Bills" icon={<VendorIcon />} />
        <DashCard href="/accounting/customers" label="Customers" desc="Customer Center, Invoices, Receive Payment" icon={<CustomerIcon />} />
      </DashGrid>

      <div className="mt-8 pt-5 border-t border-gray-200">
        <Link href="/accounting/reports/center" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
          View Reports (Report Center) →
        </Link>
      </div>
    </div>
  );
}
