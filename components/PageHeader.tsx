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
  'inline-flex items-center gap-1.5 bg-gradient-to-br from-[#f01323] to-[#c00a17] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_12px_26px_-12px_rgba(230,0,38,0.75)] hover:brightness-95 transition';
export const btnSecondary =
  'inline-flex items-center gap-1.5 bg-white border border-rowan-red/40 text-rowan-red px-4 py-2.5 rounded-full text-sm font-bold hover:bg-red-50 hover:border-rowan-red transition-colors';

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
    <div className="bg-white rounded-2xl border border-rowan-red/20 overflow-hidden flex">
      <div className={`w-1.5 ${bar}`} />
      <div className="px-4 py-3 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
        <div className="text-[15px] sm:text-xl font-black text-rowan-navy leading-tight break-words">{value}</div>
        {sub && <div className="text-[11px] text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}
