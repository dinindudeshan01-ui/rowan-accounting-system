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
 * Circular module launcher for the main dashboard — starts as just
 * the ROWAN mark; tapping it spins every module icon out from the
 * center into its orbit position (staggered rotate+scale+translate
 * transition, pure CSS, no animation library). In the spirit of
 * Odoo's app wheel but built from our own brand colors.
 * Falls back to a simple tap-to-reveal grid below sm breakpoints.
 */
const WHEEL_ICON_SIZE = 58;

export function RowanWheel({ modules }: { modules: WheelModule[] }) {
  const [open, setOpen] = React.useState(false);
  const radius = 200;
  const n = modules.length;
  const center = radius + 60;
  const canvas = radius * 2 + 120;

  return (
    <>
      {/* Wheel — sm and up */}
      <div className="relative mx-auto hidden sm:block shrink-0" style={{ width: canvas, height: canvas }}>
        <svg
          className="absolute inset-0 transition-opacity duration-500"
          width={canvas}
          height={canvas}
          viewBox={`0 0 ${canvas} ${canvas}`}
          style={{ opacity: open ? 1 : 0 }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#d7dbe6"
            strokeWidth="2"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </svg>

        {modules.map((m, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          const cx = center + radius * Math.cos(angle);
          const cy = center + radius * Math.sin(angle);
          const sizedIcon = React.isValidElement(m.icon)
            ? React.cloneElement(m.icon as React.ReactElement<{ size?: number }>, { size: WHEEL_ICON_SIZE })
            : m.icon;

          const targetX = open ? cx : center;
          const targetY = open ? cy : center;
          const scale = open ? 1 : 0.15;
          const rotate = open ? 0 : -260;

          const content = (
            <div
              className={`group absolute flex flex-col items-center gap-2.5 transition-all ease-out ${
                m.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:!-translate-y-[calc(50%+4px)]'
              }`}
              style={{
                left: targetX,
                top: targetY,
                width: 118,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transitionProperty: 'transform, opacity',
                transitionDuration: '650ms',
                transitionDelay: open ? `${i * 60}ms` : '0ms',
              }}
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
            <Link key={m.key} href={m.href} style={{ pointerEvents: open ? 'auto' : 'none' }}>
              {content}
            </Link>
          );
        })}

        {/* Center mark — the trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Hide modules' : 'Show modules'}
          className={`absolute flex flex-col items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 transition-transform duration-300 hover:scale-105 active:scale-95 ${
            open ? '' : 'animate-[pulse_2.5s_ease-in-out_infinite]'
          }`}
          style={{ width: 168, height: 168, left: center - 84, top: center - 84 }}
        >
          <RowanMark size={50} />
          <span className="font-display text-xl tracking-wide text-rowan-navy mt-1">ROWAN</span>
          {!open && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1.5">Tap to begin</span>
          )}
        </button>
      </div>

      {/* Fallback — below sm: tap-to-reveal grid */}
      <div className="sm:hidden flex flex-col items-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-col items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 mb-6 transition-transform active:scale-95 ${
            open ? '' : 'animate-[pulse_2.5s_ease-in-out_infinite]'
          }`}
          style={{ width: 140, height: 140 }}
        >
          <RowanMark size={42} />
          <span className="font-display text-lg tracking-wide text-rowan-navy mt-1">ROWAN</span>
          {!open && <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Tap to begin</span>}
        </button>

        <div
          className={`grid grid-cols-2 gap-6 px-2 transition-all duration-500 ${
            open ? 'opacity-100 max-h-[999px]' : 'opacity-0 max-h-0 overflow-hidden pointer-events-none'
          }`}
        >
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
      </div>
    </>
  );
}
