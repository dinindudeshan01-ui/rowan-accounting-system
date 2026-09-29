'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { DashCard, DashGrid } from '@/components/DashCard';
import { ChartOfAccountsIcon, JournalEntryIcon, AuditTrailIcon } from '@/components/icons/RowanIcons';

export default function LedgerHub() {
  return (
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Accounting" subtitle="Chart of accounts, journal entries and the audit trail" />

        <DashGrid>
          <DashCard href="/accounting/chart-of-accounts" label="Chart of Accounts" desc="Every account, balances, opening entries" icon={<ChartOfAccountsIcon />} />
          <DashCard href="/accounting/journal-entry" label="Journal Entry" desc="Record a manual journal entry" icon={<JournalEntryIcon />} />
          <DashCard href="/accounting/audit-log" label="Audit Trail" desc="Every change made in the system" icon={<AuditTrailIcon />} />
        </DashGrid>
    </div>
  );
}
