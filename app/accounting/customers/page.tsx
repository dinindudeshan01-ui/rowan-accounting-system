'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import { CustomerCenterIcon, InvoiceIcon, InvoicesListIcon, ReceivePaymentIcon } from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function CustomersHub() {
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
            <Link href="/accounting" className="font-display text-xl tracking-wide text-rowan-navy hover:text-rowan-red">
              Accounting
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-display text-xl tracking-wide text-rowan-navy">Customers</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Customers" />
        </div>

        <Link href="/accounting" className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6 inline-block">
          ← Accounting
        </Link>

        <DashGrid>
          <DashCard href="/accounting/customers/center" label="Customer Center" desc="Manage customers and their transactions" icon={<CustomerCenterIcon />} />
          <DashCard href="/accounting/invoice" label="Create Invoice" desc="New customer tax invoice" icon={<InvoiceIcon />} />
          <DashCard href="/accounting/invoices" label="Invoices" desc="Browse, edit, and print saved invoices" icon={<InvoicesListIcon />} />
          <DashCard href="/accounting/receive-payment" label="Receive Payment" desc="Apply a payment against open invoices" icon={<ReceivePaymentIcon />} />
        </DashGrid>
      </div>
      <BrandRibbon />
    </div>
  );
}
