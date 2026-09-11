'use client';

import React from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { DashCard, DashGrid } from '@/components/DashCard';
import {
  TrialBalanceIcon,
  GeneralLedgerReportIcon,
  TransactionJournalIcon,
  CompanyFinancialIcon,
  CustomersReceivablesIcon,
  VendorsPayablesIcon,
  SalesIcon,
  AccountantTaxesIcon,
  InventoryReportsIcon,
  ManufacturingReportsIcon,
  PayrollReportsIcon,
  BankingReportsIcon,
} from '@/components/icons/RowanReportIcons';

// ------------------------------------------------------------------
// Report Center — arranged the way QuickBooks' Reports menu groups
// things (Company & Financial, Customers & Receivables, Sales,
// Vendors & Payables, Inventory, Employees & Payroll, Banking,
// Accountant & Taxes ...). Reports that exist link straight to their
// page; reports not built yet show as disabled "Coming later" tiles
// so the full catalog is visible from day one.
// ------------------------------------------------------------------

function CategoryHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-4 first:mt-0">
      <div className="scale-[0.55] origin-left">{icon}</div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-rowan-navy">{title}</h3>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function ReportCenterPage() {
  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-8">
          <div className="flex justify-between items-center mb-2">
            <RowanWordmark markSize={40} />
            <Link href="/accounting" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
              ← Accounting
            </Link>
          </div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy mb-1">Report Center</h2>
          <p className="text-xs text-gray-400 mb-6">Every report, grouped the way you'd find it in QuickBooks.</p>

          <CategoryHeader icon={<CompanyFinancialIcon />} title="Company &amp; Financial" />
          <DashGrid>
            <DashCard href="/accounting/reports" label="Profit &amp; Loss" desc="Income, COGS, expenses, net profit" icon={<CompanyFinancialIcon />} />
            <DashCard href="/accounting/reports" label="Balance Sheet" desc="Assets, liabilities, equity as of a date" icon={<CompanyFinancialIcon />} />
            <DashCard href="/accounting/reports/trial-balance" label="Trial Balance" desc="Every account's debit/credit balance" icon={<TrialBalanceIcon />} />
            <DashCard href="#" label="General Ledger" desc="Full transaction detail, all accounts" icon={<GeneralLedgerReportIcon />} disabled />
            <DashCard href="#" label="Transaction Journal" desc="Chronological list of every journal entry" icon={<TransactionJournalIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<CustomersReceivablesIcon />} title="Customers &amp; Receivables" />
          <DashGrid>
            <DashCard href="#" label="A/R Aging Summary" desc="Needs real customers table" icon={<CustomersReceivablesIcon />} disabled />
            <DashCard href="#" label="A/R Aging Detail" desc="Needs real customers table" icon={<CustomersReceivablesIcon />} disabled />
            <DashCard href="#" label="Customer Balance Summary" desc="Needs real customers table" icon={<CustomersReceivablesIcon />} disabled />
            <DashCard href="#" label="Open Invoices" desc="Unpaid invoices by customer" icon={<CustomersReceivablesIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<SalesIcon />} title="Sales" />
          <DashGrid>
            <DashCard href="#" label="Sales by Customer" desc="Summary &amp; detail" icon={<SalesIcon />} disabled />
            <DashCard href="#" label="Sales by Item" desc="Ties into stock/style module" icon={<SalesIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<VendorsPayablesIcon />} title="Vendors &amp; Payables" />
          <DashGrid>
            <DashCard href="#" label="A/P Aging Summary" desc="Needs real vendors table" icon={<VendorsPayablesIcon />} disabled />
            <DashCard href="#" label="A/P Aging Detail" desc="Needs real vendors table" icon={<VendorsPayablesIcon />} disabled />
            <DashCard href="#" label="Unpaid Bills" desc="Bills due, by vendor" icon={<VendorsPayablesIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<InventoryReportsIcon />} title="Inventory" />
          <DashGrid>
            <DashCard href="#" label="Inventory Valuation" desc="Summary &amp; detail" icon={<InventoryReportsIcon />} disabled />
            <DashCard href="#" label="Stock Status by Item" desc="On-hand, on-order" icon={<InventoryReportsIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<ManufacturingReportsIcon />} title="Manufacturing" />
          <DashGrid>
            <DashCard href="#" label="BOM Cost Report" desc="Style bill-of-materials costing" icon={<ManufacturingReportsIcon />} disabled />
            <DashCard href="#" label="Costing Variance" desc="Standard vs. actual" icon={<ManufacturingReportsIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<PayrollReportsIcon />} title="Employees &amp; Payroll" />
          <DashGrid>
            <DashCard href="#" label="Payroll Summary" desc="By pay period" icon={<PayrollReportsIcon />} disabled />
            <DashCard href="#" label="EPF / ETF / APIT Liability" desc="Sri Lanka statutory report" icon={<PayrollReportsIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<BankingReportsIcon />} title="Banking" />
          <DashGrid>
            <DashCard href="#" label="Reconciliation Report" desc="Per bank account, per period" icon={<BankingReportsIcon />} disabled />
            <DashCard href="#" label="Deposit Detail" desc="All deposits in a period" icon={<BankingReportsIcon />} disabled />
          </DashGrid>

          <CategoryHeader icon={<AccountantTaxesIcon />} title="Accountant &amp; Taxes" />
          <DashGrid>
            <DashCard href="/accounting/reports/trial-balance" label="Trial Balance" desc="Every account's debit/credit balance" icon={<TrialBalanceIcon />} />
            <DashCard href="/accounting/audit-log" label="Audit Trail" desc="Every change made in the system" icon={<AccountantTaxesIcon />} />
            <DashCard href="#" label="VAT / SSCL Return" desc="Sri Lanka tax reports" icon={<AccountantTaxesIcon />} disabled />
          </DashGrid>
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
