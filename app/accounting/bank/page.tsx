'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DashCard, DashGrid } from '@/components/DashCard';
import { WriteCheckIcon, DepositIcon, ReconcileIcon } from '@/components/icons/RowanIcons';

export default function BankHub() {
  return (
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Banking" subtitle="Checks, deposits and reconciliation" />

        <DashGrid>
          <DashCard href="/accounting/write-check" label="Write Checks" desc="Cut and print a check from a bank account" icon={<WriteCheckIcon />} />
          <DashCard href="/accounting/make-deposit" label="Make Deposit" desc="Deposit non-invoice income into a bank account" icon={<DepositIcon />} />
          <DashCard href="/accounting/reconcile" label="Reconcile" desc="Tick off cleared transactions against a statement" icon={<ReconcileIcon />} />
        </DashGrid>
    </div>
  );
}
