'use client';

import { useEffect, useState, useCallback } from 'react';

// ------------------------------------------------------------------
// Lightweight client-side "Open Windows" tracker — QuickBooks-style.
// Recent pages and starred favorites persist in localStorage. This
// is a brand new file; it doesn't touch any existing data or schema.
// ------------------------------------------------------------------

export type NavEntry = { path: string; label: string; visitedAt: number };

const RECENT_KEY = 'rowan_nav_recent';
const FAV_KEY = 'rowan_nav_favorites';
const MAX_RECENT = 12;

/** Known route → friendly label. Falls back to the last path segment, titleized. */
export const PAGE_LABELS: Record<string, string> = {
  '/': 'Main Dashboard',
  '/home': 'Main Dashboard',
  '/crm': 'CRM',
  '/style': 'Styles',
  '/style/costing': 'Costing',
  '/style/new': 'New Style',
  '/style/bom': 'Style BOM',
  '/warehouse': 'Warehouse',
  '/warehouse/valuation': 'Stock Valuation',
  '/warehouse/adjustment': 'Stock Adjustment',
  '/payroll': 'Payroll',
  '/payroll/run': 'Run Payroll',
  '/payroll/setup': 'Payroll Setup',
  '/accounting': 'Accounting',
  '/accounting/ledger': 'Ledger',
  '/accounting/journal-entry': 'Journal Entry',
  '/accounting/chart-of-accounts': 'Chart of Accounts',
  '/accounting/audit-log': 'Audit Trail',
  '/accounting/bank': 'Bank',
  '/accounting/reconcile': 'Reconcile',
  '/accounting/write-check': 'Write Check',
  '/accounting/make-deposit': 'Make Deposit',
  '/accounting/vendors': 'Vendors',
  '/accounting/customers': 'Customers',
  '/accounting/invoice': 'Invoice',
  '/accounting/invoices': 'Invoices',
  '/accounting/record-expense': 'Record Expense',
  '/accounting/receive-payment': 'Receive Payment',
  '/accounting/pay-bills': 'Pay Bills',
  '/accounting/reports': 'Reports (P&L / BS)',
  '/accounting/reports/center': 'Report Center',
  '/accounting/reports/trial-balance': 'Trial Balance',
  '/stock': 'Stock',
};

function labelFor(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  const last = path.split('/').filter(Boolean).pop() ?? 'Home';
  return last
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readList(key: string): NavEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as NavEntry[]) : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: NavEntry[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // storage unavailable — fail silently, nav history is non-critical
  }
}

/** Call once per page (in AppShell) to record the current page as "recently opened". */
export function recordVisit(path: string) {
  if (typeof window === 'undefined') return;
  if (path.startsWith('/style/') && path !== '/style/costing' && path !== '/style/new' && path !== '/style/bom') return; // skip dynamic [id] noise
  const label = labelFor(path);
  const existing = readList(RECENT_KEY).filter((e) => e.path !== path);
  const next = [{ path, label, visitedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
  writeList(RECENT_KEY, next);
}

export function useNavHistory() {
  const [recent, setRecent] = useState<NavEntry[]>([]);
  const [favorites, setFavorites] = useState<NavEntry[]>([]);

  const refresh = useCallback(() => {
    setRecent(readList(RECENT_KEY));
    setFavorites(readList(FAV_KEY));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((path: string) => favorites.some((f) => f.path === path), [favorites]);

  const toggleFavorite = useCallback(
    (path: string) => {
      const current = readList(FAV_KEY);
      const already = current.some((f) => f.path === path);
      const next = already
        ? current.filter((f) => f.path !== path)
        : [...current, { path, label: labelFor(path), visitedAt: Date.now() }];
      writeList(FAV_KEY, next);
      setFavorites(next);
    },
    []
  );

  return { recent, favorites, isFavorite, toggleFavorite, refresh, labelFor };
}
