'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RowanWordmark, BrandRibbon, RowanMark } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

type ModuleKey = 'style' | 'stock' | 'sale' | 'payroll' | 'accounting' | 'reports';

type Tile = {
  label: string;
  desc: string;
  href: string;
  badge?: 'soon';
};

type ModuleDef = {
  key: ModuleKey;
  label: string;
  tagline: string;
  tiles: Tile[];
};

const MODULES: ModuleDef[] = [
  {
    key: 'style',
    label: 'Style',
    tagline: 'Products for sale — styles, BOM, and costing',
    tiles: [
      { label: 'Style Numbers', desc: 'Browse every style on file.', href: '/style' },
      { label: 'Create New Style', desc: 'Register a new style number.', href: '/style/new' },
      { label: 'Bill of Materials', desc: 'Search styles, see material cost at a glance.', href: '/style/bom' },
      { label: 'Product Costing', desc: 'Cost per unit and margin, across every style.', href: '/style/costing' },
    ],
  },
  {
    key: 'stock',
    label: 'Stock',
    tagline: 'GRN, movements, and gate control',
    tiles: [
      { label: 'GRN', desc: 'Receive stock from suppliers — posts to Inventory automatically.', href: '/stock' },
      { label: 'Stock In / Out', desc: 'Receive and issue material, tagged Direct/Indirect for costing.', href: '/stock' },
      { label: 'Gate Passes', desc: 'Track items leaving the premises.', href: '/stock', badge: 'soon' },
      { label: 'Delivery Notes', desc: 'Dispatch documentation for orders.', href: '/stock', badge: 'soon' },
    ],
  },
  {
    key: 'sale',
    label: 'Sale',
    tagline: 'Every invoice, its status, and its history',
    tiles: [
      { label: 'Invoices', desc: 'Search, filter, and browse all invoices.', href: '/accounting/invoices' },
      { label: 'New Invoice', desc: 'Create a customer tax invoice.', href: '/accounting/invoice' },
      { label: 'Lady J Invoices (Scanned)', desc: 'Browse all 196 scanned Lady J invoices with source photos.', href: '/accounting/lady-j-invoices' },
    ],
  },
  {
    key: 'payroll',
    label: 'Payroll',
    tagline: 'Employees, payslips, EPF/ETF/APIT, and GL posting',
    tiles: [
      { label: 'Payroll Run', desc: 'Create a period, generate payslips, finalize, and post to the ledger.', href: '/payroll/run' },
      { label: 'Payroll Setup', desc: 'Departments, employees, allowances, deductions, rates, and the APIT table.', href: '/payroll/setup' },
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    tagline: 'The books — journals, ledger, and parties',
    tiles: [
      { label: 'Journal Entry', desc: 'Record a manual journal entry.', href: '/accounting/journal-entry' },
      { label: 'Chart of Accounts', desc: 'View, edit, and set balances for every account.', href: '/accounting/chart-of-accounts' },
      { label: 'Audit Log', desc: 'Review every change made in the system.', href: '/accounting/audit-log' },
      { label: 'Customer Center', desc: 'Manage customers and their transactions.', href: '/accounting/customers' },
      { label: 'Vendor Center', desc: 'Manage vendors and their transactions.', href: '/accounting/vendors' },
      { label: 'New Invoice', desc: 'Create a customer tax invoice.', href: '/accounting/invoice' },
      { label: 'Invoices', desc: 'Browse, edit, and print saved invoices.', href: '/accounting/invoices' },
      { label: 'Receive Payment', desc: 'Apply a customer payment against open invoices.', href: '/accounting/receive-payment' },
      { label: 'Record Expense', desc: 'Log a vendor expense — paid now or billed later.', href: '/accounting/record-expense' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    tagline: 'Profit & Loss and Balance Sheet',
    tiles: [
      { label: 'Profit & Loss / Balance Sheet', desc: 'Standard statements, printable with letterhead.', href: '/accounting/reports' },
    ],
  },
];

/** Icon glyphs for the flow diagram — simple line-art, drawn in brand navy/red. */
function ModuleIcon({ moduleKey, color }: { moduleKey: ModuleKey; color: string }) {
  switch (moduleKey) {
    case 'style':
      return (
        <path
          d="M -14 -10 L -6 -16 L 0 -10 L 6 -16 L 14 -10 L 10 -2 L 7 -3 L 7 14 L -7 14 L -7 -3 L -10 -2 Z"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      );
    case 'stock':
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M -14 -6 L 0 -14 L 14 -6 L 0 2 Z" />
          <path d="M -14 -6 L -14 8 L 0 16 L 0 2" />
          <path d="M 14 -6 L 14 8 L 0 16" />
        </g>
      );
    case 'sale':
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M -9 -14 L 9 -14 L 9 8 L 6 5 L 3 8 L 0 5 L -3 8 L -6 5 L -9 8 Z" />
          <path d="M -5 -8 L 5 -8 M -5 -3 L 5 -3 M -5 2 L 1 2" />
        </g>
      );
    case 'payroll':
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
          <circle cx="0" cy="-9" r="5" />
          <path d="M -10 12 C -10 2 -4 -2 0 -2 C 4 -2 10 2 10 12" />
          <path d="M -6 4 L 6 4 M -5 8 L 5 8" strokeWidth="1.6" />
        </g>
      );
    case 'accounting':
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round">
          <path d="M -13 -14 L 13 -14 L 13 14 L -13 14 Z" />
          <path d="M -7 -7 L 7 -7 M -7 -1 L 7 -1 M -7 5 L 3 5" />
        </g>
      );
    case 'reports':
      return (
        <g fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
          <path d="M -13 14 L -13 -4 M -4 14 L -4 -12 M 5 14 L 5 2 M 14 14 L 14 -8" />
          <path d="M -13 14 L 14 14" />
        </g>
      );
  }
}

function FlowDiagram({ active, onSelect }: { active: ModuleKey; onSelect: (k: ModuleKey) => void }) {
  const stationXs = [90, 240, 440, 620, 800, 980];
  const width = 1070;
  const height = 210;
  const navy = '#06154b';
  const red = '#e60026';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none" role="img" aria-label="Rowan workflow: Style, Stock, Sale, Payroll, Accounting, Reports">
      <defs>
        <marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={red} />
        </marker>
      </defs>

      {/* Hover is a single circle-fill transition — a pale navy tint, never red — so it
          can never be mistaken for the solid-red "active" step. The active step's own
          glow-on-hover (kept exactly as before) still applies on top of that. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .flow-node .flow-ring { transition: fill 180ms ease, stroke 180ms ease, filter 200ms ease; }
        .flow-node:hover .flow-ring.is-idle { fill: #eef1fa; stroke: ${navy}; }
        .flow-node:hover .flow-ring.is-active { filter: drop-shadow(0 6px 14px rgba(230,0,38,0.45)); }
      `,
        }}
      />

      {/* connecting spine — runs the full length of the flow, Style through Reports */}
      <line x1={stationXs[0] + 46} y1="96" x2={stationXs[stationXs.length - 1] - 46} y2="96" stroke={red} strokeWidth="2.5" strokeDasharray="1 9" strokeLinecap="round" markerEnd="url(#flowArrow)" />

      {MODULES.map((m, i) => {
        const x = stationXs[i];
        const y = 96;
        const isActive = m.key === active;
        const iconColor = isActive ? '#ffffff' : navy;
        const hasSoon = m.tiles.some((t) => t.badge === 'soon');
        return (
          <g
            key={m.key}
            onClick={() => onSelect(m.key)}
            className="cursor-pointer flow-node"
            style={{ transition: 'transform 120ms ease' }}
          >
            {/* invisible hit area for easy tapping */}
            <circle cx={x} cy={y} r="46" fill="transparent" />
            {/* the whole step is this one circle — its fill/stroke is the only thing
                that changes between idle, hover, and active, no extra layered shapes */}
            <circle
              className={`flow-ring ${isActive ? 'is-active' : 'is-idle'}`}
              cx={x}
              cy={y}
              r={isActive ? 40 : 37}
              fill={isActive ? red : '#ffffff'}
              stroke={isActive ? red : navy}
              strokeWidth={isActive ? 0 : 2}
              style={{ filter: isActive ? 'drop-shadow(0 6px 14px rgba(230,0,38,0.35))' : 'drop-shadow(0 2px 6px rgba(6,21,75,0.12))' }}
            />
            <g transform={`translate(${x} ${y})`} className="flow-glyph">
              <ModuleIcon moduleKey={m.key} color={iconColor} />
            </g>
            <text x={x} y={y + 63} textAnchor="middle" fontSize="15" fontWeight="800" fill={isActive ? red : navy} fontFamily="Montserrat, sans-serif" letterSpacing="0.02em">
              {m.label}
            </text>
            <text x={x} y={y + 82} textAnchor="middle" fontSize="9.5" fill="#8b93ad" fontFamily="Inter, sans-serif">
              {i + 1 < MODULES.length ? `Step ${i + 1}` : `Step ${i + 1}`}
            </text>
            {hasSoon && (
              <g transform={`translate(${x + 27} ${y - 32})`}>
                <rect x="-19" y="-8" width="38" height="16" rx="8" fill="#fff7e6" stroke="#e0a300" strokeWidth="1" />
                <text x="0" y="4" textAnchor="middle" fontSize="8" fontWeight="700" fill="#8a6400" fontFamily="Inter, sans-serif">
                  SOON
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [turnover, setTurnover] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number>(9000000);
  const [scllOn, setSsclOn] = useState<boolean>(false);
  const [active, setActive] = useState<ModuleKey>('accounting');

  // Restore the last-viewed tab after mount (not during initial render, to
  // keep server/client HTML identical and avoid a hydration mismatch —
  // same pattern used for the splash-screen session check).
  useEffect(() => {
    const saved = sessionStorage.getItem('rowan-dashboard-tab') as ModuleKey | null;
    if (saved && MODULES.some((m) => m.key === saved)) setActive(saved);
  }, []);

  function selectModule(key: ModuleKey) {
    setActive(key);
    sessionStorage.setItem('rowan-dashboard-tab', key);
  }

  useEffect(() => {
    Promise.all([
      supabase.from('quarterly_turnover').select('turnover').single(),
      supabase.from('tax_settings').select('sscl_registered, sscl_threshold').single(),
    ]).then(([turnoverRes, taxRes]) => {
      if (turnoverRes.data) setTurnover(turnoverRes.data.turnover);
      if (taxRes.data) {
        setSsclOn(taxRes.data.sscl_registered);
        setThreshold(taxRes.data.sscl_threshold);
      }
      setLoading(false);
    });
  }, []);

  const activeModule = useMemo(() => MODULES.find((m) => m.key === active)!, [active]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const nearThreshold = turnover !== null && !scllOn && turnover >= threshold * 0.8;

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Dashboard" />

      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-8">
          <div className="flex items-center justify-between">
            <RowanWordmark markSize={48} />
            <Link href="/accounting/admin" className="text-[10px] font-bold text-gray-300 hover:text-rowan-red tracking-widest uppercase">
              Admin
            </Link>
          </div>

          {nearThreshold && (
            <div className="mt-6 bg-amber-50 border border-amber-300 text-amber-900 text-sm px-4 py-3 rounded-lg">
              <strong>Heads up!</strong> Your quarterly turnover ({turnover?.toLocaleString()} LKR) is
              approaching the {threshold.toLocaleString()} LKR threshold. Check with your accountant
              about SSCL registration.
            </div>
          )}

          {/* --- SVG production-flow navigation --- */}
          <div className="mt-8 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Workflow</p>
            <FlowDiagram active={active} onSelect={selectModule} />
          </div>

          {/* --- Active module panel --- */}
          <div className="mt-4 border-t border-gray-100 pt-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-rowan-navy font-display">{activeModule.label}</h2>
                <p className="text-xs text-gray-500">{activeModule.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {activeModule.tiles.map((tile) => (
                <Link
                  key={tile.label + tile.href}
                  href={tile.href}
                  className="relative border border-gray-200 rounded-lg p-5 hover:border-rowan-navy hover:shadow-md transition"
                >
                  {tile.badge === 'soon' && (
                    <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-300 rounded-full px-2 py-0.5">
                      Coming soon
                    </span>
                  )}
                  <h3 className="font-bold text-rowan-navy pr-16">{tile.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{tile.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}
