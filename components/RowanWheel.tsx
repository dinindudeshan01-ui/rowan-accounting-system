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

const WHEEL_ICON_SIZE = 58;

/**
 * Circular module launcher for the main dashboard — starts as just
 * the ROWAN mark; tapping it sends every module icon sweeping around
 * the ring into its orbit position, then tapping again pulls them
 * back in along the same arc.
 *
 * The motion is a true orbital transition, not a straight-line move:
 * each icon's `transform` is `rotate(angle) translate(radius) rotate(-angle)`.
 * The two rotate()s cancel out for the icon's own orientation (so it
 * never visually spins), but because the translate happens *inside*
 * that rotated coordinate frame, animating `angle` and `radius`
 * together sweeps the icon's position around the arc while it grows
 * outward — a real orbit, not a lerp between two points. Modern
 * browsers interpolate each transform function independently as long
 * as the function list matches on both ends, which is exactly what's
 * listed here (rotate, translate, rotate, translate).
 */
export function RowanWheel({ modules }: { modules: WheelModule[] }) {
  const [open, setOpen] = React.useState(false);
  const radius = 200;
  const n = modules.length;
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
            cx={canvas / 2}
            cy={canvas / 2}
            r={radius}
            fill="none"
            stroke="#d7dbe6"
            strokeWidth="2"
            strokeDasharray="1 10"
            strokeLinecap="round"
          />
        </svg>

        {modules.map((m, i) => {
          const finalAngle = (i / n) * 360 - 90; // degrees, 0 = due right, -90 = due up
          const startAngle = finalAngle - 260; // sweep this many degrees on the way out
          const angle = open ? finalAngle : startAngle;
          const r = open ? radius : 0;

          const sizedIcon = React.isValidElement(m.icon)
            ? React.cloneElement(m.icon as React.ReactElement<{ size?: number }>, { size: WHEEL_ICON_SIZE })
            : m.icon;

          const content = (
            <div
              className={`group absolute flex flex-col items-center gap-2.5 ease-out ${
                m.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
              }`}
              style={{
                left: canvas / 2,
                top: canvas / 2,
                width: 118,
                opacity: open ? 1 : 0,
                pointerEvents: open ? 'auto' : 'none',
                transform: `rotate(${angle}deg) translate(${r}px, 0) rotate(${-angle}deg) translate(-50%, -50%)`,
                transitionProperty: 'transform, opacity',
                transitionDuration: '800ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                transitionDelay: open ? `${i * 60}ms` : `${(n - i) * 30}ms`,
              }}
            >
              <div
                className={`rounded-2xl shadow-md transition-shadow ${m.disabled ? '' : 'group-hover:shadow-xl'}`}
              >
                {sizedIcon}
              </div>
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
          style={{ width: 168, height: 168, left: canvas / 2 - 84, top: canvas / 2 - 84 }}
        >
          <RowanMark size={50} />
          <span className="font-display text-xl tracking-wide text-rowan-navy mt-1">ROWAN</span>
          {!open && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1.5">Tap to begin</span>
          )}
        </button>
      </div>

      {/* Fallback — below sm: tap-to-reveal grid (no room for an orbit at this width) */}
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
