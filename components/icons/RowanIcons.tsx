import React from 'react';

// ------------------------------------------------------------------
// Shared line-art icon set for the dashboard hubs (main app dashboard
// + Accounting's four sub-hubs). Every icon is a plain <svg> (no
// external assets), drawn on a 0..48 canvas, single stroke color
// passed in as `color` so the same icon can sit on a light or a
// filled/active card. Kept deliberately simple/geometric to match
// the flat icon language used elsewhere in the app (see ModuleIcon
// in the old app/page.tsx flow diagram).
// ------------------------------------------------------------------

export type IconProps = { color?: string; size?: number; className?: string };

const base = (size = 48) => ({ width: size, height: size, viewBox: '0 0 48 48' });

export function CrmIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="24" cy="17" r="7" />
      <path d="M10 40c0-8 6-13 14-13s14 5 14 13" />
      <path d="M36 21c3.5 1.3 6 4.6 6 8.5" strokeWidth="1.8" />
    </svg>
  );
}

export function StylesIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M17 8l7 5 7-5 6 6-4 5-3-1.5V40H15V17.5l-3 1.5-4-5z" />
    </svg>
  );
}

export function WarehouseIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M24 6l18 9v3H6v-3z" />
      <path d="M9 18v20h30V18" />
      <path d="M19 38V26h10v12" />
    </svg>
  );
}

export function AccountingIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="9" y="7" width="30" height="34" rx="1.5" />
      <path d="M16 16h16M16 23h16M16 30h10" />
    </svg>
  );
}

export function CostingIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="10" y="6" width="28" height="36" rx="2" />
      <path d="M15 14h18" />
      <rect x="15" y="19" width="5" height="5" />
      <rect x="21.5" y="19" width="5" height="5" />
      <rect x="28" y="19" width="5" height="5" />
      <rect x="15" y="26" width="5" height="5" />
      <rect x="21.5" y="26" width="5" height="5" />
      <rect x="28" y="26" width="5" height="12" />
    </svg>
  );
}

export function PayrollIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="24" cy="14" r="6" />
      <path d="M10 40c0-8 6-13 14-13s14 5 14 13" />
      <path d="M16 26h16M18 31h12" strokeWidth="1.6" />
    </svg>
  );
}

export function ReportsIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <path d="M10 40V22M20 40V12M30 40V26M40 40V16" />
      <path d="M8 40h32" />
    </svg>
  );
}

export function LedgerIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M24 10c-4-2.5-9-3-14-2v27c5-1 10-0.5 14 2 4-2.5 9-3 14-2V8c-5-1-10-0.5-14 2z" />
      <path d="M24 10v27" />
    </svg>
  );
}

export function BankIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 18L24 7l18 11z" />
      <path d="M9 18v18M17 18v18M24 18v18M31 18v18M39 18v18" />
      <path d="M6 40h36" />
    </svg>
  );
}

export function VendorIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="6" y="24" width="16" height="10" rx="1" />
      <path d="M22 27h7l6 6v4a2 2 0 01-2 2H22" />
      <circle cx="15" cy="38" r="3" />
      <circle cx="32" cy="38" r="3" />
      <path d="M6 24V14a2 2 0 012-2h10v12" />
    </svg>
  );
}

export function CustomerIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="17" cy="15" r="6" />
      <circle cx="32" cy="18" r="5" />
      <path d="M6 39c0-7 5-12 11-12s11 5 11 12" />
      <path d="M25 30c5.5.5 9.5 4.8 9.5 9" />
    </svg>
  );
}

export function JournalEntryIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="10" y="8" width="28" height="32" rx="1.5" />
      <path d="M17 20l5 5 9-10" />
    </svg>
  );
}

export function AuditTrailIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="21" cy="24" r="13" />
      <path d="M21 16v8l6 4" />
      <path d="M34 34l7 7" />
    </svg>
  );
}

export function ChartOfAccountsIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="8" y="9" width="32" height="30" rx="1.5" />
      <path d="M8 18h32M18 9v30" />
    </svg>
  );
}

export function WriteCheckIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="6" y="13" width="36" height="22" rx="2" />
      <circle cx="16" cy="24" r="4" />
      <path d="M27 21h10M27 27h7" strokeWidth="1.6" />
      <path d="M30 39l4 3 6-8" />
    </svg>
  );
}

export function DepositIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 18L24 7l18 11z" />
      <path d="M9 18v14M39 18v14" />
      <path d="M6 40h36" />
      <path d="M24 20v14M18 28l6 6 6-6" />
    </svg>
  );
}

export function ReconcileIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M14 12h20a4 4 0 014 4v6a10 10 0 01-10 10h-4" />
      <path d="M18 26l-6 6 6 6" />
      <path d="M34 36H14a4 4 0 01-4-4v-6a10 10 0 0110-10h4" />
      <path d="M30 22l6-6-6-6" />
    </svg>
  );
}

export function VendorCenterIcon(props: IconProps) {
  return <VendorIcon {...props} />;
}

export function CreateBillIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="11" y="6" width="26" height="36" rx="1.5" />
      <path d="M17 15h14M17 22h14M17 29h8" />
      <path d="M30 30l4 4 7-8" transform="translate(0 2)" />
    </svg>
  );
}

export function PayBillsIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="5" y="15" width="28" height="18" rx="2" />
      <circle cx="19" cy="24" r="4" />
      <rect x="15" y="9" width="28" height="18" rx="2" transform="translate(0 6)" fill="none" />
      <path d="M15 9h20a2 2 0 012 2v4" />
    </svg>
  );
}

export function CustomerCenterIcon(props: IconProps) {
  return <CustomerIcon {...props} />;
}

export function InvoiceIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M13 6h16l6 6v30H13z" />
      <path d="M29 6v6h6" />
      <path d="M18 22h12M18 27h12M18 32h8" />
    </svg>
  );
}

export function InvoicesListIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <rect x="9" y="9" width="24" height="30" rx="1.5" />
      <rect x="15" y="15" width="24" height="30" rx="1.5" fill="#fff" />
      <path d="M20 24h13M20 29h13M20 34h8" />
    </svg>
  );
}

export function ReceivePaymentIcon({ color = '#06154b', size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="24" cy="24" r="15" />
      <path d="M24 16v16M18 22a4 4 0 014-4h2a4 4 0 010 8h-2a4 4 0 000 8h2a4 4 0 004-4" strokeWidth="1.8" />
    </svg>
  );
}
