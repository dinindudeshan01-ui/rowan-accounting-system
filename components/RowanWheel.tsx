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
export function RowanWheel({ modules }: { modules: WheelModule[] }) {
  const radius = 190;
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
          style={{ width: 148, height: 148, left: radius + 60 - 74, top: radius + 60 - 74 }}
        >
          <RowanMark size={44} />
          <span className="font-display text-xl tracking-wide text-rowan-navy mt-1">ROWAN</span>
        </div>

        {modules.map((m, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const cx = radius + 60 + radius * Math.cos(angle);
          const cy = radius + 60 + radius * Math.sin(angle);
          const content = (
            <div
              className={`group absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2 transition ${
                m.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-[calc(50%+4px)]'
              }`}
              style={{ left: cx, top: cy, width: 108 }}
            >
              <div className={`rounded-2xl shadow-md transition ${m.disabled ? '' : 'group-hover:shadow-xl'}`}>{m.icon}</div>
              <span className="text-[11px] font-bold uppercase tracking-wide text-rowan-navy text-center leading-tight">
                {m.label}
              </span>
              {m.disabled && <span className="text-[9px] font-bold text-rowan-red uppercase -mt-1">Coming later</span>}
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
      <div className="sm:hidden grid grid-cols-3 gap-4 px-2">
        {modules.map((m) => {
          const content = (
            <div className={`flex flex-col items-center gap-2 text-center ${m.disabled ? 'opacity-45' : ''}`}>
              {m.icon}
              <span className="text-[10px] font-bold uppercase tracking-wide text-rowan-navy leading-tight">{m.label}</span>
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
