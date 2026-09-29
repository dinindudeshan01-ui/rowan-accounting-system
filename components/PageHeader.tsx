import React from 'react';

/**
 * Standard page header for the QB-style layout: bold title + subtitle on
 * the left, action buttons on the right. Use `PageHeader.Primary` for the
 * one main action (Rowan red) and `PageHeader.Secondary` for the rest.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-black text-rowan-navy leading-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 print:hidden">{actions}</div>}
    </div>
  );
}

export const btnPrimary =
  'inline-flex items-center gap-1.5 bg-rowan-red text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-rowan-redDark transition-colors';
export const btnSecondary =
  'inline-flex items-center gap-1.5 bg-white border border-gray-300 text-rowan-navy px-4 py-2.5 rounded-full text-sm font-bold hover:border-rowan-navy transition-colors';

/** One KPI tile for the summary strip above a list. */
export function StatTile({
  label,
  value,
  sub,
  tone = 'navy',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'navy' | 'red' | 'green' | 'gray';
}) {
  const bar = { navy: 'bg-rowan-navy', red: 'bg-rowan-red', green: 'bg-green-600', gray: 'bg-gray-400' }[tone];
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex">
      <div className={`w-1.5 ${bar}`} />
      <div className="px-4 py-3 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        <div className="text-xl font-black text-rowan-navy truncate">{value}</div>
        {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}
