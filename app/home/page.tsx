'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { RowanMark } from '@/components/RowanMark';
import { useAuth } from '@/components/AuthProvider';
import {
  CrmIcon,
  StylesIcon,
  WarehouseIcon,
  CostingIcon,
  PayrollIcon,
  DashboardIcon,
  InvoiceIcon,
  ReceivePaymentIcon,
  CreateBillIcon,
  PayBillsIcon,
  WriteCheckIcon,
  DepositIcon,
  ReconcileIcon,
  VendorCenterIcon,
  CustomerCenterIcon,
  ChartOfAccountsIcon,
  JournalEntryIcon,
} from '@/components/icons/RowanIcons';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** One clickable step in a workflow lane. */
function Step({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden w-32 flex flex-col items-center gap-2 rounded-2xl bg-white border border-rowan-red/30 pt-4 pb-5 px-2 hover:border-rowan-red hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-20px_rgba(230,0,38,0.6)] transition"
    >
      <div className="group-hover:scale-105 transition">{icon}</div>
      <span className="text-[11px] font-bold text-rowan-navy text-center leading-tight">{label}</span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-rowan-red rounded-t-full" />
    </Link>
  );
}

function Arrow({ down }: { down?: boolean }) {
  const Icon = down ? ArrowDown : ArrowRight;
  return <Icon size={18} className="text-rowan-red shrink-0" />;
}

/** A lane card: coloured title strip + steps. */
function Lane({ title, accent, children }: { title: string; accent: 'navy' | 'red'; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-rowan-red/40 overflow-hidden flex flex-col">
      <div className={`px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white ${accent === 'navy' ? 'bg-gradient-to-r from-[#8f0015] to-[#c00a17]' : 'bg-gradient-to-r from-[#e60026] to-[#f01323]'}`}>
        {title}
      </div>
      <div className="p-5 flex-1 flex items-center justify-center flex-wrap gap-3">{children}</div>
    </div>
  );
}

function ModuleLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-white border border-rowan-red/30 px-4 py-3 hover:border-rowan-red hover:shadow-[0_16px_32px_-20px_rgba(230,0,38,0.6)] transition"
    >
      <div className="group-hover:scale-105 transition">{icon}</div>
      <span className="text-sm font-bold text-rowan-navy">{label}</span>
    </Link>
  );
}

export default function MainDashboard() {
  const { displayName } = useAuth();
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full font-body">
      {/* Brand banner */}
      <div className="relative overflow-hidden bg-white border-b border-red-100 px-6 py-5 flex items-center justify-between">
        <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 w-64 h-64 rounded-full border-[30px] border-red-50" />
        <div aria-hidden className="pointer-events-none absolute -top-10 right-8 w-32 h-32 rounded-full border-[16px] border-red-50/70" />
        <div className="flex items-center gap-4">
          <RowanMark size={44} />
          <div>
            <h1 className="text-2xl font-black text-rowan-navy leading-tight">{greeting()}{displayName ? `, ${displayName}` : ''}</h1>
            <p className="text-sm text-gray-500">{today}</p>
          </div>
        </div>
        <Link href="/accounting/reports/center" className="hidden sm:flex items-center gap-1 text-xs font-bold text-rowan-navy hover:text-rowan-red">
          Report Center <ArrowRight size={13} />
        </Link>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Company workflow</h2>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
          <Lane title="Vendors — money out" accent="navy">
            <Step href="/accounting/vendors/center" label="Vendor Center" icon={<VendorCenterIcon size={36} />} />
            <Arrow />
            <Step href="/accounting/record-expense" label="Create Bill" icon={<CreateBillIcon size={36} />} />
            <Arrow />
            <Step href="/accounting/pay-bills" label="Pay Bills" icon={<PayBillsIcon size={36} />} />
          </Lane>

          <Lane title="Customers — money in" accent="red">
            <Step href="/accounting/customers/center" label="Customer Center" icon={<CustomerCenterIcon size={36} />} />
            <Arrow />
            <Step href="/accounting/invoice" label="Create Invoice" icon={<InvoiceIcon size={36} />} />
            <Arrow />
            <Step href="/accounting/receive-payment" label="Receive Payment" icon={<ReceivePaymentIcon size={36} />} />
          </Lane>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-8">
          <Lane title="Banking" accent="navy">
            <Step href="/accounting/write-check" label="Write Checks" icon={<WriteCheckIcon size={36} />} />
            <Step href="/accounting/make-deposit" label="Make Deposit" icon={<DepositIcon size={36} />} />
            <Step href="/accounting/reconcile" label="Reconcile" icon={<ReconcileIcon size={36} />} />
          </Lane>

          <Lane title="Company" accent="red">
            <Step href="/accounting/chart-of-accounts" label="Chart of Accounts" icon={<ChartOfAccountsIcon size={36} />} />
            <Step href="/accounting/journal-entry" label="Journal Entry" icon={<JournalEntryIcon size={36} />} />
            <Step href="/accounting/reports/center" label="Reports" icon={<DashboardIcon size={36} />} />
          </Lane>
        </div>

        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Operations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <ModuleLink href="/payroll/run" label="Payroll" icon={<PayrollIcon size={30} />} />
          <ModuleLink href="/style" label="Styles" icon={<StylesIcon size={30} />} />
          <ModuleLink href="/style/costing" label="Costing" icon={<CostingIcon size={30} />} />
          <ModuleLink href="/warehouse" label="Warehouse" icon={<WarehouseIcon size={30} />} />
          <ModuleLink href="/crm" label="CRM" icon={<CrmIcon size={30} />} />
        </div>
      </div>
    </div>
  );
}
