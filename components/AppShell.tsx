'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  type LucideIcon,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calculator,
  ChevronDown,
  Home,
  FileText,
  Landmark,
  LogOut,
  Menu,
  Plus,
  Search,
  Shirt,
  Truck,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';
import { RowanMark, BrandRibbon } from '@/components/RowanMark';
import { OpenWindowsPanel } from '@/components/OpenWindowsPanel';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { recordVisit, PAGE_LABELS } from '@/lib/navHistory';
import { ROLE_LABEL, useAuth } from '@/components/AuthProvider';

// ------------------------------------------------------------------
// QuickBooks-style application shell: fixed left navigation, slim top
// bar (back, search, + New, open windows, presence), and a full-width
// scrolling content area. Wrapped around every page by app/layout.tsx.
// Everything chrome-related is print-hidden.
// ------------------------------------------------------------------

type NavLeaf = { label: string; href: string };
type NavGroup = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavLeaf[];
  match: string[]; // path prefixes that make this group "active"
};

const NAV: NavGroup[] = [
  { key: 'home', label: 'Home', href: '/home', icon: Home, match: [] },
  {
    key: 'customers',
    label: 'Customers',
    href: '/accounting/customers',
    icon: UserRound,
    match: ['/accounting/customers', '/accounting/invoice', '/accounting/invoices', '/accounting/receive-payment'],
    children: [
      { label: 'Customer Center', href: '/accounting/customers/center' },
      { label: 'Create Invoice', href: '/accounting/invoice' },
      { label: 'Invoices', href: '/accounting/invoices' },
      { label: 'Receive Payment', href: '/accounting/receive-payment' },
    ],
  },
  {
    key: 'vendors',
    label: 'Vendors',
    href: '/accounting/vendors',
    icon: Truck,
    match: ['/accounting/vendors', '/accounting/record-expense', '/accounting/pay-bills'],
    children: [
      { label: 'Vendor Center', href: '/accounting/vendors/center' },
      { label: 'Create Bill', href: '/accounting/record-expense' },
      { label: 'Pay Bills', href: '/accounting/pay-bills' },
    ],
  },
  {
    key: 'banking',
    label: 'Banking',
    href: '/accounting/bank',
    icon: Landmark,
    match: ['/accounting/bank', '/accounting/write-check', '/accounting/make-deposit', '/accounting/reconcile'],
    children: [
      { label: 'Write Checks', href: '/accounting/write-check' },
      { label: 'Make Deposit', href: '/accounting/make-deposit' },
      { label: 'Reconcile', href: '/accounting/reconcile' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    href: '/accounting',
    icon: BookOpen,
    match: ['/accounting/ledger', '/accounting/chart-of-accounts', '/accounting/journal-entry', '/accounting/audit-log', '/accounting/admin'],
    children: [
      { label: 'Chart of Accounts', href: '/accounting/chart-of-accounts' },
      { label: 'Journal Entry', href: '/accounting/journal-entry' },
      { label: 'Audit Trail', href: '/accounting/audit-log' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/accounting/reports/center',
    icon: BarChart3,
    match: ['/accounting/reports'],
    children: [
      { label: 'Profit & Loss / Balance Sheet', href: '/accounting/reports' },
      { label: 'Trial Balance', href: '/accounting/reports/trial-balance' },
      { label: 'A/R Aging', href: '/accounting/reports/ar-aging' },
      { label: 'A/P Aging', href: '/accounting/reports/ap-aging' },
      { label: 'Sales by Customer', href: '/accounting/reports/sales-by-customer' },
      { label: 'Sales by Item', href: '/accounting/reports/sales-by-item' },
      { label: 'General Ledger', href: '/accounting/reports/general-ledger' },
    ],
  },
  {
    key: 'payroll',
    label: 'Payroll',
    href: '/payroll/run',
    icon: Wallet,
    match: ['/payroll'],
    children: [
      { label: 'Run Payroll', href: '/payroll/run' },
      { label: 'Payroll Setup', href: '/payroll/setup' },
    ],
  },
  {
    key: 'styles',
    label: 'Styles',
    href: '/style',
    icon: Shirt,
    match: ['/style'],
    children: [
      { label: 'All Styles', href: '/style' },
      { label: 'New Style', href: '/style/new' },
      { label: 'Style BOM', href: '/style/bom' },
      { label: 'Costing', href: '/style/costing' },
    ],
  },
  {
    key: 'warehouse',
    label: 'Warehouse',
    href: '/warehouse',
    icon: Warehouse,
    match: ['/warehouse', '/stock'],
    children: [
      { label: 'Stock', href: '/stock' },
      { label: 'Stock Valuation', href: '/warehouse/valuation' },
      { label: 'Stock Adjustment', href: '/warehouse/adjustment' },
    ],
  },
  { key: 'crm', label: 'CRM', href: '/crm', icon: Users, match: ['/crm'] },
  { key: 'costing', label: 'Costing', href: '/style/costing', icon: Calculator, match: [] },
];

// Costing is shown under Styles as well; keep it out of the top level list.
const TOP_NAV = NAV.filter((g) => g.key !== 'costing');

const NEW_MENU: NavLeaf[] = [
  { label: 'Invoice', href: '/accounting/invoice' },
  { label: 'Receive Payment', href: '/accounting/receive-payment' },
  { label: 'Bill / Expense', href: '/accounting/record-expense' },
  { label: 'Pay Bills', href: '/accounting/pay-bills' },
  { label: 'Write Check', href: '/accounting/write-check' },
  { label: 'Make Deposit', href: '/accounting/make-deposit' },
  { label: 'Journal Entry', href: '/accounting/journal-entry' },
  { label: 'Style', href: '/style/new' },
];

// Pages that exist only to enter data — not shown in an auditor's menu.
const ENTRY_ONLY = new Set([
  'Create Invoice', 'Receive Payment', 'Create Bill', 'Pay Bills', 'Write Checks',
  'Make Deposit', 'Journal Entry', 'New Style', 'Stock Adjustment',
]);
const COLLAPSE_KEY = 'rowan_sidebar_collapsed';

function isActive(pathname: string, g: NavGroup) {
  if (g.key === 'home') return pathname === '/home';
  return g.match.some((m) => pathname === m || pathname.startsWith(m + '/'));
}

function crumbsFor(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  const out: { label: string; href: string }[] = [{ label: 'Home', href: '/home' }];
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    const label =
      PAGE_LABELS[acc] ??
      (/^[0-9a-f-]{8,}$/i.test(part) ? 'Detail' : part.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));
    out.push({ label, href: acc });
  }
  return out;
}

function TabLink({ href, icon: Icon, label, active }: { href: string; icon: LucideIcon; label: string; active: boolean }) {
  return (
    <Link href={href} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${active ? 'text-rowan-red' : 'text-gray-500'}`}>
      <Icon size={20} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, role, displayName, canWrite, signOut } = useAuth();
  const currentUser = { id: session?.user.id ?? 'unknown', name: displayName || 'User' };
  const isAuditor = role === 'auditor';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newSheet, setNewSheet] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const newRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    recordVisit(pathname);
    setMobileOpen(false);
    setNewSheet(false);
    setMobileSearch(false);
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* non-critical */
      }
      return next;
    });
  }

  // Global "go to" search over every nav entry.
  const searchIndex = useMemo(() => {
    const out: NavLeaf[] = [];
    for (const g of TOP_NAV) {
      out.push({ label: g.label, href: g.href });
      g.children?.forEach((c) => out.push({ label: `${g.label} › ${c.label}`, href: c.href }));
    }
    return out;
  }, []);
  const results = query.trim()
    ? searchIndex.filter((r) => r.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : [];

  const isHome = pathname === '/home';

  const renderSidebar = (collapsed: boolean) => (
    <nav className="h-full flex flex-col bg-white text-rowan-navy border-r border-red-100">
      <Link
        href="/home"
        className={`flex items-center gap-3 h-16 shrink-0 bg-white ${collapsed ? 'justify-center' : 'px-4'}`}
        title="Rowan — Home"
      >
        <RowanMark size={collapsed ? 28 : 34} />
        {!collapsed && (
          <span className="leading-none">
            <span className="block font-display text-xl tracking-wide text-rowan-navy">ROWAN</span>
            <span className="block text-[8px] tracking-[0.2em] font-bold uppercase text-rowan-navy mt-1">Casual Wear Pvt Ltd</span>
          </span>
        )}
      </Link>
      <BrandRibbon className="h-1 shrink-0" />

      <div className="flex-1 overflow-y-auto py-2">
        {TOP_NAV.map((g) => {
          const active = isActive(pathname, g);
          const Icon = g.icon;
          return (
            <div key={g.key}>
              <Link
                href={g.href}
                title={g.label}
                className={`flex items-center gap-3 text-[13px] font-semibold border-l-4 transition-colors ${
                  collapsed ? 'justify-center py-3' : 'px-4 py-2.5'
                } ${
                  active
                    ? 'border-rowan-red bg-red-50 text-rowan-red'
                    : 'border-transparent text-gray-600 hover:bg-red-50/60 hover:text-rowan-navy'
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{g.label}</span>}
                {!collapsed && g.children && (
                  <ChevronDown size={13} className={`transition-transform ${active ? '' : '-rotate-90'} opacity-60`} />
                )}
              </Link>

              {!collapsed && active && g.children && (
                <div className="bg-red-50/50 py-1">
                  {g.children.filter((c) => !(isAuditor && ENTRY_ONLY.has(c.label))).map((c) => {
                    const on = pathname === c.href;
                    return (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={`block pl-11 pr-4 py-1.5 text-[12px] transition-colors ${
                          on ? 'text-rowan-red font-bold' : 'text-gray-500 hover:text-rowan-navy'
                        }`}
                      >
                        {c.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* login-style corner swoosh */}
      {!collapsed && (
        <div className="sidebar-deco relative h-28 shrink-0 overflow-hidden pointer-events-none" aria-hidden>
          <svg viewBox="0 0 240 120" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sbSwoosh" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#b3001a" />
                <stop offset="1" stopColor="#e60026" />
              </linearGradient>
            </defs>
            <path d="M0 120V30C50 45 120 85 175 120Z" fill="url(#sbSwoosh)" />
            <path d="M0 8C62 26 150 72 205 120" stroke="#e60026" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      )}
    </nav>
  );

  return (
    <div className="app-root flex h-screen overflow-hidden bg-rowan-bg">
      {/* Desktop sidebar */}
      <aside
        className={`print:hidden hidden lg:block shrink-0 transition-[width] duration-200 ${collapsed ? 'w-14' : 'w-60'}`}
      >
        {renderSidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="print:hidden lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 h-full shadow-2xl">{renderSidebar(false)}</div>
          <button className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="print:hidden shrink-0 h-14 bg-white border-b border-gray-200 relative flex items-center gap-2 px-3 z-40">
          <button
            onClick={() => (window.innerWidth >= 1024 ? toggleCollapsed() : setMobileOpen((o) => !o))}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
            title="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {!isHome && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-rowan-red px-2 py-1.5 rounded-md hover:bg-gray-100"
              title="Go back"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {/* Search */}
          <div
            className={`${mobileSearch ? 'absolute left-0 right-0 top-full bg-white px-3 py-2 border-b border-gray-200 shadow-md z-50' : 'hidden'} md:block md:relative md:flex-1 md:max-w-md md:p-0 md:border-0 md:shadow-none md:bg-transparent`}
            ref={searchRef}
          >
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) {
                  router.push(results[0].href);
                  setQuery('');
                  setSearchOpen(false);
                  setMobileSearch(false);
                }
              }}
              placeholder="Go to… (invoices, payroll, trial balance)"
              className="w-full bg-gray-100 rounded-full pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rowan-navy/30 focus:bg-white"
            />
            {searchOpen && results.length > 0 && (
              <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                {results.map((r) => (
                  <Link
                    key={r.href + r.label}
                    href={r.href}
                    onClick={() => {
                      setQuery('');
                      setSearchOpen(false);
                    }}
                    className="block px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setMobileSearch((o) => !o)}
            className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
            title="Search"
          >
            <Search size={18} />
          </button>

          {/* + New (hidden for view-only accounts) */}
          {canWrite ? (
          <div className="relative hidden lg:block" ref={newRef}>
            <button
              onClick={() => setNewOpen((o) => !o)}
              className="flex items-center gap-1.5 bg-gradient-to-br from-[#f01323] to-[#c00a17] text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_10px_22px_-10px_rgba(230,0,38,0.7)] hover:brightness-95 transition"
            >
              <Plus size={14} />
              New
            </button>
            {newOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                {NEW_MENU.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setNewOpen(false)}
                    className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-rowan-navy"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 hidden sm:inline">View only</span>
          )}

          <div className="hidden md:block"><OpenWindowsPanel /></div>
          <div className="hidden md:block"><PresenceIndicator inline roomName="accounting-app" currentUser={currentUser} currentPage={PAGE_LABELS[pathname] ?? pathname} /></div>
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs font-bold text-rowan-navy">{displayName}</div>
              <div className="text-[10px] text-gray-400">{role && ROLE_LABEL[role] !== displayName ? ROLE_LABEL[role] : ''}</div>
            </div>
            <div
              className="w-8 h-8 rounded-full bg-rowan-navy text-white text-xs font-bold flex items-center justify-center"
              title={session?.user.email ?? ''}
            >
              {(displayName || 'U').slice(0, 1).toUpperCase()}
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.replace('/');
              }}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-rowan-red"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <BrandRibbon className="h-[3px] shrink-0 print:hidden" />

        {isAuditor && (
          <div className="print:hidden shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-1.5 text-[11px] font-semibold text-amber-800">
            Read-only access — you can view everything but cannot make changes.
          </div>
        )}

        {!isHome && (
          <div className="print:hidden shrink-0 bg-white border-b border-gray-200 px-5 py-2 flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 overflow-x-auto whitespace-nowrap">
            {crumbsFor(pathname).map((c, i, arr) => (
              <React.Fragment key={c.href}>
                {i > 0 && <span className="text-gray-300">›</span>}
                {i === arr.length - 1 ? (
                  <span className="text-rowan-navy font-bold">{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-rowan-red">{c.label}</Link>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content: full width, scrolls independently of the sidebar */}
        <main ref={mainRef} className="app-main flex-1 min-h-0 overflow-y-auto pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ---------- Phone: bottom tab bar ---------- */}
      <nav
        className="print:hidden lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 grid grid-cols-5 items-end"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <TabLink href="/home" icon={Home} label="Home" active={pathname === '/home'} />
        <TabLink href="/accounting/invoices" icon={FileText} label="Invoices" active={pathname.startsWith('/accounting/invoice')} />
        {canWrite ? (
          <button onClick={() => setNewSheet(true)} className="flex flex-col items-center -mt-5" aria-label="Create new">
            <span className="w-12 h-12 rounded-full bg-rowan-red text-white flex items-center justify-center shadow-lg">
              <Plus size={24} />
            </span>
            <span className="text-[10px] font-bold text-gray-500 mt-0.5 pb-2">New</span>
          </button>
        ) : (
          <TabLink href="/accounting/reports/center" icon={BarChart3} label="Reports" active={pathname.startsWith('/accounting/reports')} />
        )}
        <TabLink href="/accounting/customers/center" icon={UserRound} label="Customers" active={pathname.startsWith('/accounting/customers')} />
        <button onClick={() => setMobileOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold text-gray-500">
          <Menu size={20} />
          More
        </button>
      </nav>

      {/* ---------- Phone: "create new" sheet ---------- */}
      {newSheet && (
        <div className="print:hidden lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button className="flex-1 bg-black/40" onClick={() => setNewSheet(false)} aria-label="Close" />
          <div className="bg-white rounded-t-3xl p-5" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Create new</p>
            <div className="grid grid-cols-2 gap-3">
              {NEW_MENU.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setNewSheet(false)}
                  className="rounded-xl border border-gray-200 px-4 py-3.5 text-sm font-bold text-rowan-navy active:bg-gray-50"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
