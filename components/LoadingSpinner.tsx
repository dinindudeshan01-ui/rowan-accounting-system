'use client';

import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<SpinnerSize, { box: string; border: string; inset: string }> = {
  sm: { box: 'w-5 h-5', border: 'border-2', inset: 'inset-[1px]' },
  md: { box: 'w-8 h-8', border: 'border-[3px]', inset: 'inset-[2px]' },
  lg: { box: 'w-14 h-14', border: 'border-4', inset: 'inset-1' },
};

/**
 * Brand loading spinner — navy ring spinning clockwise, red ring spinning
 * counter-clockwise underneath it. This is the ONE loading animation for
 * the whole app: splash screen, table loads, button busy-states, etc.
 * Don't hand-roll another spinner elsewhere — import this instead.
 */
export function LoadingSpinner({
  size = 'md',
  label,
  className = '',
}: {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}) {
  const { box, border, inset } = SIZE_MAP[size];

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`} role="status" aria-live="polite">
      <div className={`relative ${box}`}>
        <div className={`absolute inset-0 ${border} border-transparent border-t-rowan-navy rounded-full animate-spin`} />
        <div className={`absolute ${inset} ${border} border-transparent border-b-rowan-red rounded-full animate-[spin_0.8s_linear_infinite_reverse]`} />
      </div>
      {label && <span className="text-xs font-bold text-rowan-navy tracking-wide">{label}</span>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  );
}
