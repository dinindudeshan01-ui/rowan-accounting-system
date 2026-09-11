import {
  Rows3,
  BookOpenCheck,
  ListOrdered,
  Building2,
  ContactRound,
  Truck,
  ShoppingCart,
  Landmark as LandmarkIcon,
  Boxes,
  Factory,
  Wallet,
  ReceiptText,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

// ------------------------------------------------------------------
// Report Center icon set — same badge language as RowanIcons.tsx
// (flat rounded-square, brand navy/red palette), added here as a
// separate file so the existing icon set is never touched.
// ------------------------------------------------------------------

export type IconProps = { color?: string; size?: number; className?: string; flat?: boolean };

const PALETTE = {
  navy: '#06154b',
  navyLight: '#16297a',
  red: '#e60026',
  redDark: '#8c0019',
} as const;

function Badge({ Icon, bg, size = 64, className }: { Icon: LucideIcon; bg: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[11px] ${className ?? ''}`}
      style={{ width: size, height: size, background: bg }}
    >
      <Icon color="#fff" size={Math.round(size * 0.54)} strokeWidth={2} />
    </span>
  );
}

function makeIcon(Icon: LucideIcon, bg: string) {
  return function Rendered({ color = '#06154b', size = 64, className, flat }: IconProps) {
    if (flat) return <Icon color={color} size={size} strokeWidth={2} className={className} />;
    return <Badge Icon={Icon} bg={bg} size={size} className={className} />;
  };
}

// Report tiles
export const TrialBalanceIcon = makeIcon(Rows3, PALETTE.navy);
export const GeneralLedgerReportIcon = makeIcon(BookOpenCheck, PALETTE.navyLight);
export const TransactionJournalIcon = makeIcon(ListOrdered, PALETTE.navy);

// Category header icons (QB Report Center flyout groups)
export const CompanyFinancialIcon = makeIcon(Building2, PALETTE.navy);
export const CustomersReceivablesIcon = makeIcon(ContactRound, PALETTE.red);
export const VendorsPayablesIcon = makeIcon(Truck, PALETTE.navyLight);
export const SalesIcon = makeIcon(ShoppingCart, PALETTE.red);
export const AccountantTaxesIcon = makeIcon(LandmarkIcon, PALETTE.redDark);
export const InventoryReportsIcon = makeIcon(Boxes, PALETTE.navyLight);
export const ManufacturingReportsIcon = makeIcon(Factory, PALETTE.navy);
export const PayrollReportsIcon = makeIcon(Wallet, PALETTE.redDark);
export const BankingReportsIcon = makeIcon(ReceiptText, PALETTE.navy);
export const CustomReportsIcon = makeIcon(Settings2, PALETTE.navy);
