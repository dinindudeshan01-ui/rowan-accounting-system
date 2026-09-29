'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DashCard, DashGrid } from '@/components/DashCard';
import { CustomerCenterIcon, InvoiceIcon, InvoicesListIcon, ReceivePaymentIcon } from '@/components/icons/RowanIcons';

export default function CustomersHub() {
  return (
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Customers" subtitle="Invoices, payments and everyone you sell to" />

        <DashGrid>
          <DashCard href="/accounting/customers/center" label="Customer Center" desc="Manage customers and their transactions" icon={<CustomerCenterIcon />} />
          <DashCard href="/accounting/invoice" label="Create Invoice" desc="New customer tax invoice" icon={<InvoiceIcon />} />
          <DashCard href="/accounting/invoices" label="Invoices" desc="Browse, edit, and print saved invoices" icon={<InvoicesListIcon />} />
          <DashCard href="/accounting/receive-payment" label="Receive Payment" desc="Apply a payment against open invoices" icon={<ReceivePaymentIcon />} />
        </DashGrid>
    </div>
  );
}
