'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import { WriteCheckIcon, DepositIcon, ReconcileIcon } from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function BankHub() {
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
            <span className="font-display text-xl tracking-wide text-rowan-navy">Bank</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Bank" />
        </div>

        <Link href="/accounting" className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6 inline-block">
          ← Accounting
        </Link>

        <DashGrid>
          <DashCard href="/accounting/write-check" label="Write Checks" desc="Cut and print a check from a bank account" icon={<WriteCheckIcon />} />
          <DashCard href="/accounting/make-deposit" label="Make Deposit" desc="Deposit non-invoice income into a bank account" icon={<DepositIcon />} />
          <DashCard href="/accounting/reconcile" label="Reconcile" desc="Tick off cleared transactions against a statement" icon={<ReconcileIcon />} />
        </DashGrid>
      </div>
      <BrandRibbon />
    </div>
  );
}
