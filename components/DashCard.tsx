'use client';

import React from 'react';
import Link from 'next/link';

export type DashCardProps = {
  href: string;
  label: string;
  desc?: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

/** One SVG-icon tile used across the main dashboard and every accounting sub-hub. */
export function DashCard({ href, label, desc, icon, disabled }: DashCardProps) {
  const inner = (
    <div
      className={`group flex flex-col items-center text-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-6 transition ${
        disabled ? 'opacity-45 cursor-not-allowed grayscale' : 'hover:border-rowan-navy hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      <div className={`transition ${disabled ? '' : 'group-hover:scale-105'}`}>{icon}</div>
      <div>
        <div className="text-sm font-bold uppercase tracking-wide text-rowan-navy">{label}</div>
        {desc && <div className="text-[11px] text-gray-500 mt-1 leading-snug">{desc}</div>}
        {disabled && <div className="text-[10px] font-bold text-rowan-red mt-1 uppercase">Coming later</div>}
      </div>
    </div>
  );

  if (disabled) return inner;
  return <Link href={href}>{inner}</Link>;
}

export function DashGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">{children}</div>;
}
