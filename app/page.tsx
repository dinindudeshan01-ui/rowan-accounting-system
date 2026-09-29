'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DashCard } from '@/components/DashCard';
import {
  CrmIcon,
  StylesIcon,
  WarehouseIcon,
  AccountingIcon,
  CostingIcon,
  PayrollIcon,
  DashboardIcon,
  InvoiceIcon,
  ReceivePaymentIcon,
  CreateBillIcon,
  PayBillsIcon,
  WriteCheckIcon,
  DepositIcon,
} from '@/components/icons/RowanIcons';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h2>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Shortcut({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 bg-white border border-gray-200 rounded-xl py-5 px-3 hover:border-rowan-navy hover:shadow-md transition"
    >
      <div className="group-hover:scale-105 transition">{icon}</div>
      <span className="text-xs font-bold text-rowan-navy text-center">{label}</span>
    </Link>
  );
}

export default function MainDashboard() {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-full font-body px-6 py-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-rowan-navy">{greeting()}, Dinindu</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <Link
          href="/accounting/reports/center"
          className="hidden sm:flex items-center gap-1 text-xs font-bold text-rowan-navy hover:text-rowan-red"
        >
          Report Center <ArrowRight size={13} />
        </Link>
      </div>

      <Section title="Daily tasks" hint="The things you do most, one click away">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Shortcut href="/accounting/invoice" label="Create Invoice" icon={<InvoiceIcon size={36} />} />
          <Shortcut href="/accounting/receive-payment" label="Receive Payment" icon={<ReceivePaymentIcon size={36} />} />
          <Shortcut href="/accounting/record-expense" label="Create Bill" icon={<CreateBillIcon size={36} />} />
          <Shortcut href="/accounting/pay-bills" label="Pay Bills" icon={<PayBillsIcon size={36} />} />
          <Shortcut href="/accounting/write-check" label="Write Check" icon={<WriteCheckIcon size={36} />} />
          <Shortcut href="/accounting/make-deposit" label="Make Deposit" icon={<DepositIcon size={36} />} />
        </div>
      </Section>

      <Section title="Modules">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashCard href="/accounting" label="Accounting" desc="Customers, vendors, banking, ledger" icon={<AccountingIcon />} />
          <DashCard href="/payroll/run" label="Payroll" desc="Run payroll, EPF / ETF / APIT" icon={<PayrollIcon />} />
          <DashCard href="/style" label="Styles" desc="Style catalog and bills of materials" icon={<StylesIcon />} />
          <DashCard href="/style/costing" label="Costing" desc="Standard and absorption costing" icon={<CostingIcon />} />
          <DashCard href="/warehouse" label="Warehouse" desc="Stock, valuation, adjustments" icon={<WarehouseIcon />} />
          <DashCard href="/crm" label="CRM" desc="Leads and customer follow-ups" icon={<CrmIcon />} />
          <DashCard href="/accounting/reports/center" label="Report Center" desc="Financial, sales, payables, aging" icon={<DashboardIcon />} />
        </div>
      </Section>
    </div>
  );
}
