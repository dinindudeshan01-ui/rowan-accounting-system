import React from 'react';

/** Red corner swooshes + faint rings used behind the gate and login pages. */
export function GateBackground() {
  const swoosh = (
    <svg viewBox="0 0 380 330" fill="none" className="w-full h-auto">
      <defs>
        <linearGradient id="swooshGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e60026" />
          <stop offset="1" stopColor="#b3001a" />
        </linearGradient>
      </defs>
      <path d="M0 0H350C290 70 205 100 145 150C90 196 40 250 0 320Z" fill="url(#swooshGrad)" />
      <path d="M368 0C300 78 232 108 172 150" stroke="#e60026" strokeWidth="1.5" />
      <path d="M150 170C100 205 55 250 18 300" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".55" />
    </svg>
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-0 left-0 w-[210px] sm:w-[300px] lg:w-[380px]">{swoosh}</div>
      <div className="absolute bottom-0 right-0 w-[210px] sm:w-[300px] lg:w-[380px] rotate-180">{swoosh}</div>
      <div className="absolute -top-40 -right-40 w-[460px] h-[460px] rounded-full border-[46px] border-red-50" />
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full border-[26px] border-red-50/70" />
      <div className="absolute -bottom-44 -left-44 w-[460px] h-[460px] rounded-full border-[46px] border-red-50" />
      <div className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full border-[26px] border-red-50/70" />
    </div>
  );
}
