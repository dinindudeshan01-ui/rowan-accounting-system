'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DashCard, DashGrid } from '@/components/DashCard';
import { VendorCenterIcon, CreateBillIcon, PayBillsIcon } from '@/components/icons/RowanIcons';

export default function VendorsHub() {
  return (
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Vendors" subtitle="Bills, payments and everyone you buy from" />

        <DashGrid>
          <DashCard href="/accounting/vendors/center" label="Vendor Center" desc="Manage vendors and their transactions" icon={<VendorCenterIcon />} />
          <DashCard href="/accounting/record-expense" label="Create Bill" desc="Log a vendor bill — pay now or later" icon={<CreateBillIcon />} />
          <DashCard href="/accounting/pay-bills" label="Pay Bills" desc="Settle open vendor bills from a bank account" icon={<PayBillsIcon />} />
        </DashGrid>
    </div>
  );
}
