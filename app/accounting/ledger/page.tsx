'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { DashCard, DashGrid } from '@/components/DashCard';
import { ChartOfAccountsIcon, JournalEntryIcon, AuditTrailIcon } from '@/components/icons/RowanIcons';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

export default function LedgerHub() {
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
            <span className="font-display text-xl tracking-wide text-rowan-navy">Ledger</span>
          </div>
          <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Ledger" />
        </div>

        <Link href="/accounting" className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-6 inline-block">
          ← Accounting
        </Link>

        <DashGrid>
          <DashCard href="/accounting/chart-of-accounts" label="Chart of Accounts" desc="Every account, balances, opening entries" icon={<ChartOfAccountsIcon />} />
          <DashCard href="/accounting/journal-entry" label="Journal Entry" desc="Record a manual journal entry" icon={<JournalEntryIcon />} />
          <DashCard href="/accounting/audit-log" label="Audit Trail" desc="Every change made in the system" icon={<AuditTrailIcon />} />
        </DashGrid>
      </div>
      <BrandRibbon />
    </div>
  );
}
