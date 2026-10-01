'use client';

import React from 'react';
import { PageHeader } from '@/components/PageHeader';
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
// page. (A tile can be passed `disabled` to show a greyed-out
// "Coming later" placeholder for a report that isn't built yet.)
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
    <div className="min-h-full px-6 py-6">
      <PageHeader title="Report Center" subtitle="Every report, grouped the way you'd find it in QuickBooks." />
      <div>
          <CategoryHeader icon={<CompanyFinancialIcon />} title="Company &amp; Financial" />
          <DashGrid>
            <DashCard href="/accounting/reports" label="Profit &amp; Loss" desc="Income, COGS, expenses, net profit" icon={<CompanyFinancialIcon />} />
            <DashCard href="/accounting/reports" label="Balance Sheet" desc="Assets, liabilities, equity as of a date" icon={<CompanyFinancialIcon />} />
            <DashCard href="/accounting/reports/trial-balance" label="Trial Balance" desc="Every account's debit/credit balance" icon={<TrialBalanceIcon />} />
            <DashCard href="/accounting/reports/general-ledger" label="General Ledger" desc="Full transaction detail, all accounts" icon={<GeneralLedgerReportIcon />} />
            <DashCard href="/accounting/reports/transaction-journal" label="Transaction Journal" desc="Chronological list of every journal entry" icon={<TransactionJournalIcon />} />
          </DashGrid>

          <CategoryHeader icon={<CustomersReceivablesIcon />} title="Customers &amp; Receivables" />
          <DashGrid>
            <DashCard href="/accounting/reports/ar-aging" label="A/R Aging Summary" desc="Open invoices bucketed by overdue days" icon={<CustomersReceivablesIcon />} />
            <DashCard href="/accounting/reports/ar-aging?view=detail" label="A/R Aging Detail" desc="Every open invoice, individually" icon={<CustomersReceivablesIcon />} />
            <DashCard href="/accounting/reports/ar-aging" label="Customer Balance Summary" desc="Same data as Aging Summary, per customer" icon={<CustomersReceivablesIcon />} />
            <DashCard href="/accounting/reports/open-invoices" label="Open Invoices" desc="Unpaid invoices by customer" icon={<CustomersReceivablesIcon />} />
          </DashGrid>

          <CategoryHeader icon={<SalesIcon />} title="Sales" />
          <DashGrid>
            <DashCard href="/accounting/reports/sales-by-customer" label="Sales by Customer" desc="Summary & detail, by customer" icon={<SalesIcon />} />
            <DashCard href="/accounting/reports/sales-by-item" label="Sales by Item" desc="Ties into stock/style module" icon={<SalesIcon />} />
          </DashGrid>

          <CategoryHeader icon={<VendorsPayablesIcon />} title="Vendors &amp; Payables" />
          <DashGrid>
            <DashCard href="/accounting/reports/ap-aging" label="A/P Aging Summary" desc="Open bills bucketed by overdue days" icon={<VendorsPayablesIcon />} />
            <DashCard href="/accounting/reports/ap-aging?view=detail" label="A/P Aging Detail" desc="Every open bill, individually" icon={<VendorsPayablesIcon />} />
            <DashCard href="/accounting/reports/ap-aging" label="Unpaid Bills" desc="Same data as Aging Summary, per vendor" icon={<VendorsPayablesIcon />} />
            <DashCard href="/accounting/reports/expenses-by-vendor" label="Expenses by Vendor" desc="Every posted expense & bill, per vendor" icon={<VendorsPayablesIcon />} />
          </DashGrid>

          <CategoryHeader icon={<InventoryReportsIcon />} title="Inventory" />
          <DashGrid>
            <DashCard href="/accounting/reports/inventory-valuation" label="Inventory Valuation" desc="Summary &amp; detail, checked against the ledger" icon={<InventoryReportsIcon />} />
            <DashCard href="/accounting/reports/stock-status" label="Stock Status by Item" desc="On-hand, reorder level, days of cover" icon={<InventoryReportsIcon />} />
          </DashGrid>

          <CategoryHeader icon={<ManufacturingReportsIcon />} title="Manufacturing" />
          <DashGrid>
            <DashCard href="/accounting/reports/bom-cost" label="BOM Cost Report" desc="Style bill-of-materials costing" icon={<ManufacturingReportsIcon />} />
            <DashCard href="/accounting/reports/costing-variance" label="Costing Variance" desc="Standard vs. actual, labour &amp; overhead absorption" icon={<ManufacturingReportsIcon />} />
          </DashGrid>

          <CategoryHeader icon={<PayrollReportsIcon />} title="Employees &amp; Payroll" />
          <DashGrid>
            <DashCard href="/accounting/reports/payroll-summary" label="Payroll Summary" desc="By pay period, employee or department" icon={<PayrollReportsIcon />} />
            <DashCard href="/accounting/reports/epf-etf-apit" label="EPF / ETF / APIT Liability" desc="Sri Lanka statutory report" icon={<PayrollReportsIcon />} />
          </DashGrid>

          <CategoryHeader icon={<BankingReportsIcon />} title="Banking" />
          <DashGrid>
            <DashCard href="/accounting/reports/bank-reconciliation" label="Reconciliation Report" desc="Per bank account, per period" icon={<BankingReportsIcon />} />
            <DashCard href="/accounting/reports/deposit-detail" label="Deposit Detail" desc="All deposits in a period" icon={<BankingReportsIcon />} />
            <DashCard href="/accounting/reports/check-detail" label="Check Detail" desc="Every check written, with its expense lines" icon={<BankingReportsIcon />} />
          </DashGrid>

          <CategoryHeader icon={<AccountantTaxesIcon />} title="Accountant &amp; Taxes" />
          <DashGrid>
            <DashCard href="/accounting/reports/trial-balance" label="Trial Balance" desc="Every account's debit/credit balance" icon={<TrialBalanceIcon />} />
            <DashCard href="/accounting/audit-log" label="Audit Trail" desc="Every change made in the system" icon={<AccountantTaxesIcon />} />
            <DashCard href="/accounting/reports/vat-sscl" label="VAT / SSCL Return" desc="Output tax by month and invoice, checked against the ledger" icon={<AccountantTaxesIcon />} />
          </DashGrid>
      </div>
    </div>
  );
}
