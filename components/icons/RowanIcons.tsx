import React from 'react';
import {
  Users,
  Shirt,
  Warehouse,
  BookOpen,
  Calculator,
  Wallet,
  LayoutDashboard,
  Landmark,
  Truck,
  UserRound,
  ClipboardCheck,
  History,
  Table,
  ScrollText,
  PiggyBank,
  ArrowLeftRight,
  ContactRound,
  FileCheck2,
  ReceiptText,
  Users2,
  FileText,
  Files,
  HandCoins,
  PackageOpen,
  ClipboardList,
  ClipboardEdit,
  BadgeCheck,
  Scale,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';

// ------------------------------------------------------------------
// Real, professionally drawn icons — Lucide (MIT licensed,
// https://lucide.dev), not hand-rolled SVG paths. Wrapped in a flat
// rounded-square brand-color badge so the set still reads as one
// consistent app-icon language across the dashboard, the way Odoo's
// app icons do — but every glyph itself is a proper icon-library
// icon, not a custom sketch.
// ------------------------------------------------------------------

export type IconProps = { color?: string; size?: number; className?: string; flat?: boolean };

const PALETTE = {
  navy: '#06154b',
  navyLight: '#16297a',
  red: '#e60026',
  redDark: '#8c0019',
} as const;

function Badge({
  Icon,
  bg,
  size = 64,
  className,
}: {
  Icon: LucideIcon;
  bg: string;
  size?: number;
  className?: string;
}) {
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

export const CrmIcon = makeIcon(Users, PALETTE.navy);
export const StylesIcon = makeIcon(Shirt, PALETTE.red);
export const WarehouseIcon = makeIcon(Warehouse, PALETTE.navyLight);
export const AccountingIcon = makeIcon(BookOpen, PALETTE.red);
export const CostingIcon = makeIcon(Calculator, PALETTE.navy);
export const PayrollIcon = makeIcon(Wallet, PALETTE.redDark);
export const DashboardIcon = makeIcon(LayoutDashboard, PALETTE.navy);
export const ReportsIcon = DashboardIcon;
export const LedgerIcon = makeIcon(ScrollText, PALETTE.navy);
export const BankIcon = makeIcon(Landmark, PALETTE.redDark);
export const VendorIcon = makeIcon(Truck, PALETTE.navy);
export const CustomerIcon = makeIcon(UserRound, PALETTE.red);
export const JournalEntryIcon = makeIcon(ClipboardCheck, PALETTE.navy);
export const AuditTrailIcon = makeIcon(History, PALETTE.redDark);
export const ChartOfAccountsIcon = makeIcon(Table, PALETTE.navyLight);
export const WriteCheckIcon = makeIcon(ReceiptText, PALETTE.red);
export const DepositIcon = makeIcon(PiggyBank, PALETTE.navy);
export const ReconcileIcon = makeIcon(ArrowLeftRight, PALETTE.redDark);
export const VendorCenterIcon = makeIcon(ContactRound, PALETTE.navy);
export const CreateBillIcon = makeIcon(FileCheck2, PALETTE.navy);
export const PayBillsIcon = makeIcon(HandCoins, PALETTE.red);
export const CustomerCenterIcon = makeIcon(Users2, PALETTE.red);
export const InvoiceIcon = makeIcon(FileText, PALETTE.navy);
export const InvoicesListIcon = makeIcon(Files, PALETTE.navyLight);
export const ReceivePaymentIcon = makeIcon(HandCoins, PALETTE.red);

// Warehouse sub-dashboard
export const DispatchIcon = makeIcon(PackageCheck, PALETTE.red);
export const GatePassIcon = makeIcon(BadgeCheck, PALETTE.navy);
export const StockCountIcon = makeIcon(ClipboardList, PALETTE.navyLight);
export const StockValuationIcon = makeIcon(Scale, PALETTE.navy);
export const StockAdjustmentIcon = makeIcon(ClipboardEdit, PALETTE.redDark);
export const GrnIcon = makeIcon(PackageOpen, PALETTE.navy);
export const EnterBillIcon = makeIcon(FileCheck2, PALETTE.red);
