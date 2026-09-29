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

/** Tile icon badge size, in px. Every DashCard forces its icon to exactly
 * this — some glyphs are visually "fuller" than others at the same
 * nominal size, so we pin it explicitly rather than trusting each
 * icon's own default. */
const TILE_ICON_SIZE = 40;

/** One icon tile used across the main dashboard and every accounting sub-hub. */
export function DashCard({ href, label, desc, icon, disabled }: DashCardProps) {
  const sizedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: TILE_ICON_SIZE })
    : icon;

  const inner = (
    <div
      className={`group h-full flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 transition ${
        disabled ? 'opacity-45 cursor-not-allowed grayscale' : 'hover:border-rowan-navy hover:shadow-md'
      }`}
    >
      <div className={`shrink-0 transition ${disabled ? '' : 'group-hover:scale-105'}`}>{sizedIcon}</div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-rowan-navy">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>}
        {disabled && <div className="text-[10px] font-bold text-rowan-red mt-1 uppercase">Coming later</div>}
      </div>
    </div>
  );

  if (disabled) return inner;
  return (
    <Link href={href} className="h-full block">
      {inner}
    </Link>
  );
}

export function DashGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-stretch">{children}</div>;
}
