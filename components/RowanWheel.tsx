'use client';

import React from 'react';
import Link from 'next/link';
import { RowanMark } from '@/components/RowanMark';

export type WheelModule = {
  key: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

/**
 * Circular module launcher for the main dashboard — a ring of app
 * icons orbiting the ROWAN mark, in the spirit of Odoo's app wheel
 * but built from our own brand colors and plain SVG/CSS (no image
 * assets). Falls back to a simple stacked list below sm breakpoints
 * since a wheel doesn't work well under ~420px.
 */
/** Uniform badge size, in px, for every module orbiting the wheel —
 * pinned explicitly for the same reason as DashCard's TILE_ICON_SIZE:
 * different glyphs read as different sizes at the same nominal size
 * unless we force it. */
const WHEEL_ICON_SIZE = 68;

export function RowanWheel({ modules }: { modules: WheelModule[] }) {
  const radius = 250;
  const n = modules.length;

  return (
    <>
      {/* Wheel — sm and up */}
      <div className="relative mx-auto hidden sm:block" style={{ width: radius * 2 + 120, height: radius * 2 + 120 }}>
        <svg
          className="absolute inset-0"
          width={radius * 2 + 120}
          height={radius * 2 + 120}
          viewBox={`0 0 ${radius * 2 + 120} ${radius * 2 + 120}`}
        >
          <circle
            cx={radius + 60}
            cy={radius + 60}
            r={radius}
            fill="none"
            stroke="#d7dbe6"
            strokeWidth="2"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </svg>

        {/* Center mark */}
        <div
          className="absolute flex flex-col items-center justify-center rounded-full bg-white shadow-lg border border-gray-200"
          style={{ width: 190, height: 190, left: radius + 60 - 95, top: radius + 60 - 95 }}
        >
          <RowanMark size={58} />
          <span className="font-display text-2xl tracking-wide text-rowan-navy mt-1.5">ROWAN</span>
        </div>

        {modules.map((m, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const cx = radius + 60 + radius * Math.cos(angle);
          const cy = radius + 60 + radius * Math.sin(angle);
          const sizedIcon = React.isValidElement(m.icon)
            ? React.cloneElement(m.icon as React.ReactElement<{ size?: number }>, { size: WHEEL_ICON_SIZE })
            : m.icon;
          const content = (
            <div
              className={`group absolute flex flex-col items-center gap-2.5 -translate-x-1/2 -translate-y-1/2 transition ${
                m.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-[calc(50%+4px)]'
              }`}
              style={{ left: cx, top: cy, width: 132 }}
            >
              <div className={`rounded-2xl shadow-md transition ${m.disabled ? '' : 'group-hover:shadow-xl'}`}>{sizedIcon}</div>
              <span className="text-sm font-bold uppercase tracking-wide text-rowan-navy text-center leading-tight">
                {m.label}
              </span>
              {m.disabled && <span className="text-[10px] font-bold text-rowan-red uppercase -mt-1">Coming later</span>}
            </div>
          );
          return m.disabled ? (
            <React.Fragment key={m.key}>{content}</React.Fragment>
          ) : (
            <Link key={m.key} href={m.href}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Stacked fallback — below sm */}
      <div className="sm:hidden grid grid-cols-2 gap-6 px-2">
        {modules.map((m) => {
          const sizedIcon = React.isValidElement(m.icon)
            ? React.cloneElement(m.icon as React.ReactElement<{ size?: number }>, { size: WHEEL_ICON_SIZE })
            : m.icon;
          const content = (
            <div className={`flex flex-col items-center gap-2.5 text-center ${m.disabled ? 'opacity-45' : ''}`}>
              {sizedIcon}
              <span className="text-xs font-bold uppercase tracking-wide text-rowan-navy leading-tight">{m.label}</span>
            </div>
          );
          return m.disabled ? (
            <div key={m.key}>{content}</div>
          ) : (
            <Link key={m.key} href={m.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </>
  );
}
