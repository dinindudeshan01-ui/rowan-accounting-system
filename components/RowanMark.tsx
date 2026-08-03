import React from 'react';

/**
 * Rowan brand mark (icon only — navy rectangle + red "D-loop and leg").
 * Exact geometry from the master logo file.
 */
export function RowanMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="770 210 375 380" className={className} aria-label="Rowan">
      <rect x="770" y="210" width="140" height="380" fill="#06154b" />
      <path d="M 945 210 L 1050 210 A 95 95 0 0 1 1050 400 L 945 400 Z" fill="#e60026" />
      <path d="M 945 400 L 945 590 L 1145 590 Z" fill="#e60026" />
    </svg>
  );
}

/** Watermark version — same mark, dimmed, for print/PDF backgrounds. */
export function RowanWatermark({ size = 600, opacity = 0.03 }: { size?: number; opacity?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity }}>
      <RowanMark size={size} />
    </div>
  );
}

/** Full wordmark lockup: mark + "ROWAN" + "CASUAL WEAR PVT LTD". */
export function RowanWordmark({ markSize = 40 }: { markSize?: number }) {
  return (
    <div className="flex items-center gap-3">
      <RowanMark size={markSize} />
      <div>
        <h1 className="font-black text-2xl leading-none text-rowan-navy font-display">ROWAN</h1>
        <p className="text-[8px] tracking-[0.2em] font-bold uppercase text-rowan-navy">
          Casual Wear Pvt Ltd
        </p>
      </div>
    </div>
  );
}

/** The navy/red ribbon bar used top and bottom of every printable document. */
export function BrandRibbon({ className = 'h-2' }: { className?: string }) {
  return (
    <div className={`w-full flex ${className}`}>
      <div className="w-2/3 bg-rowan-navy" />
      <div className="w-1/3 bg-rowan-red" />
    </div>
  );
}
