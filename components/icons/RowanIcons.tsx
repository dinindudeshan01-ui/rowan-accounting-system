import React from 'react';

// ------------------------------------------------------------------
// Flat "app badge" icon set — rounded-square, solid brand color,
// single white glyph. Same visual language as Odoo's app icons,
// built entirely from brand colors (navy / red / navyLight / redDark)
// instead of a rainbow palette. Inline SVG only — no external assets.
//
// Every icon accepts `size` (badge side length, default 48). Pass
// `flat` to render just the line glyph (in `color`, no background
// square) for contexts that already supply their own colored circle,
// like DashCard.
// ------------------------------------------------------------------

export type IconProps = { color?: string; size?: number; className?: string; flat?: boolean };

const PALETTE = {
  navy: '#06154b',
  navyLight: '#16297a',
  red: '#e60026',
  redDark: '#8c0019',
} as const;

/** Shared badge shell: rounded-square background + centered glyph slot. */
function Badge({
  bg,
  size = 48,
  className,
  children,
}: {
  bg: string;
  size?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="0" y="0" width="48" height="48" rx="11" fill={bg} />
      <g fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** Bare glyph, no badge — for spots that already draw their own circle/tile. */
function Glyph({
  color = '#06154b',
  size = 48,
  className,
  children,
}: {
  color?: string;
  size?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export function CrmIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <circle cx="24" cy="18" r="6.5" />
      <path d="M11 39c0-7.2 5.8-12 13-12s13 4.8 13 12" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function StylesIcon({ color, size, className, flat }: IconProps) {
  const glyph = <path d="M18 9l6 4.5L30 9l6 5.5-4 5-2.5-1.5V39h-11V18l-2.5 1.5-4-5z" />;
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}

export function WarehouseIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M24 8l16 8.5v2H8v-2z" />
      <path d="M11 18.5v19h26v-19" />
      <path d="M20 37.5v-11h8v11" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navyLight} size={size} className={className}>{glyph}</Badge>;
}

export function AccountingIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="11" y="8" width="26" height="32" rx="1.5" />
      <path d="M17 17h14M17 23.5h14M17 30h8" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}

export function CostingIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="12" y="7" width="24" height="34" rx="2" />
      <path d="M17.5 14.5h13" />
      <rect x="17" y="19" width="4.3" height="4.3" fill="#fff" stroke="none" />
      <rect x="22.8" y="19" width="4.3" height="4.3" fill="#fff" stroke="none" />
      <rect x="28.6" y="19" width="4.3" height="4.3" fill="#fff" stroke="none" />
      <rect x="17" y="25.5" width="4.3" height="4.3" fill="#fff" stroke="none" />
      <rect x="22.8" y="25.5" width="4.3" height="10" fill="#fff" stroke="none" />
      <rect x="28.6" y="25.5" width="4.3" height="4.3" fill="#fff" stroke="none" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function PayrollIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <circle cx="20" cy="15" r="5.5" />
      <path d="M9 38c0-6.8 5-11.3 11-11.3S31 31.2 31 38" />
      <path d="M35 20.5v11M29.5 26h11" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.redDark} size={size} className={className}>{glyph}</Badge>;
}

/** Gauge-style "dashboard" glyph — used for the Reports hub tile. */
export function DashboardIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M9 30a15 15 0 0130-1" />
      <path d="M24 29l7-9" />
      <circle cx="24" cy="29" r="2.1" fill="#fff" stroke="none" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function ReportsIcon(props: IconProps) {
  return <DashboardIcon {...props} />;
}

export function LedgerIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M24 12c-4.3-2.6-9.5-3.1-15-2v25c5.5-1.1 10.7-0.6 15 2 4.3-2.6 9.5-3.1 15-2V10c-5.5-1.1-10.7-0.6-15 2z" />
      <path d="M24 12v25" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function BankIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M8 19L24 9l16 10z" />
      <path d="M11 19v17M18.3 19v17M24 19v17M29.7 19v17M37 19v17" />
      <path d="M8 39.5h32" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.redDark} size={size} className={className}>{glyph}</Badge>;
}

export function VendorIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="7" y="23" width="16" height="10.5" rx="1.3" />
      <path d="M23 26.3h6.3l6 6v4.2a1.9 1.9 0 01-1.9 1.9H23" />
      <circle cx="16" cy="37.5" r="2.8" fill="#fff" stroke="none" />
      <circle cx="32" cy="37.5" r="2.8" fill="#fff" stroke="none" />
      <path d="M7 23v-9.5A1.9 1.9 0 018.9 11.6H19v11.4" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function CustomerIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <circle cx="18" cy="16" r="5.8" />
      <circle cx="32" cy="19" r="4.6" />
      <path d="M8 38.5c0-6.6 4.6-11.3 10-11.3s10 4.7 10 11.3" />
      <path d="M26.5 29.5c5 .6 8.7 4.6 8.7 9" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}

export function JournalEntryIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="11" y="8" width="26" height="32" rx="1.5" />
      <path d="M17.5 22l4.5 4.5L30.5 17" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function AuditTrailIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <circle cx="21" cy="23" r="12" />
      <path d="M21 16v7l5.5 3.5" />
      <path d="M33 33l6.5 6.5" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.redDark} size={size} className={className}>{glyph}</Badge>;
}

export function ChartOfAccountsIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="9" y="10" width="30" height="28" rx="1.5" />
      <path d="M9 19h30M18 10v28" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navyLight} size={size} className={className}>{glyph}</Badge>;
}

export function WriteCheckIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="7" y="14" width="34" height="20" rx="2" />
      <circle cx="16.5" cy="24" r="3.8" />
      <path d="M26.5 20.5h9.5M26.5 27h6.5" strokeWidth="1.8" />
      <path d="M30 38l3.6 2.7L39 33" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}

export function DepositIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M8 19L24 9l16 10z" />
      <path d="M11 19v13M37 19v13" />
      <path d="M8 39.5h32" />
      <path d="M24 20.5v13M18.5 27l5.5 5.5 5.5-5.5" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function ReconcileIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M15 13h18a4.3 4.3 0 014.3 4.3v5.7a9.8 9.8 0 01-9.8 9.8h-3.5" />
      <path d="M18.7 27l-5.7 5.7 5.7 5.7" />
      <path d="M33 35H15a4.3 4.3 0 01-4.3-4.3v-5.7A9.8 9.8 0 0121 15.2h3.5" />
      <path d="M29.3 21l5.7-5.7-5.7-5.7" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.redDark} size={size} className={className}>{glyph}</Badge>;
}

export function VendorCenterIcon(props: IconProps) {
  return <VendorIcon {...props} />;
}

export function CreateBillIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="12" y="7" width="24" height="34" rx="1.5" />
      <path d="M17.5 16h13M17.5 22.5h13M17.5 29h7" />
      <path d="M28 32l3.2 3.2L37 28.5" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function PayBillsIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="6" y="12" width="28" height="17" rx="2" />
      <rect x="14" y="20" width="28" height="17" rx="2" fill="none" />
      <circle cx="17.5" cy="20.5" r="3.6" />
      <path d="M14 20v-3a2 2 0 012-2h20a2 2 0 012 2v3" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}

export function CustomerCenterIcon(props: IconProps) {
  return <CustomerIcon {...props} />;
}

export function InvoiceIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <path d="M15 7h14l6 6v28H15z" />
      <path d="M29 7v6h6" />
      <path d="M19.5 21h11M19.5 26.5h11M19.5 32h7" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navy} size={size} className={className}>{glyph}</Badge>;
}

export function InvoicesListIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <rect x="9" y="12" width="22" height="27" rx="1.5" />
      <path d="M14 20h12M14 25h12M14 30h7" />
      <path d="M31 12h4.5l3.5 3.5V39H18" opacity="0.55" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.navyLight} size={size} className={className}>{glyph}</Badge>;
}

export function ReceivePaymentIcon({ color, size, className, flat }: IconProps) {
  const glyph = (
    <>
      <circle cx="24" cy="24" r="14.5" />
      <path d="M24 16.5v15" />
      <path d="M19 21.5a3.6 3.6 0 013.6-3.6h1.8a3.6 3.6 0 010 7.2h-1.8a3.6 3.6 0 000 7.2h1.8a3.6 3.6 0 003.6-3.6" strokeWidth="1.9" />
    </>
  );
  return flat ? <Glyph color={color} size={size} className={className}>{glyph}</Glyph>
    : <Badge bg={PALETTE.red} size={size} className={className}>{glyph}</Badge>;
}
