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
      className={`group relative overflow-hidden h-full flex items-center gap-4 rounded-2xl border border-rowan-red/30 bg-white px-5 pt-4 pb-5 transition ${
        disabled ? 'opacity-45 cursor-not-allowed grayscale' : 'hover:border-rowan-red hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(230,0,38,0.6)]'
      }`}
    >
      <div className={`shrink-0 transition ${disabled ? '' : 'group-hover:scale-105'}`}>{sizedIcon}</div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-rowan-navy">{label}</div>
        {desc && <div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>}
        {disabled && <div className="text-[10px] font-bold text-rowan-red mt-1 uppercase">Coming later</div>}
      </div>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-rowan-red rounded-t-full" />
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
