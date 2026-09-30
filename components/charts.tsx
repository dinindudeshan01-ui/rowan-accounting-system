'use client';

import React, { useState } from 'react';

// ------------------------------------------------------------------
// Dependency-free chart primitives (CSS + SVG) used by /dashboard.
// Colours follow the Rowan brand: navy / red, with neutral support tones.
// ------------------------------------------------------------------

export const CHART_COLORS = {
  navy: '#06154b',
  navyLight: '#122a7a',
  red: '#e60026',
  redDark: '#5c0011',
  green: '#16a34a',
  amber: '#d97706',
  gray: '#9ca3af',
  grayLight: '#e5e7eb',
};

export const PALETTE = [
  CHART_COLORS.navy,
  CHART_COLORS.red,
  CHART_COLORS.navyLight,
  CHART_COLORS.redDark,
  '#6b7fd6',
  '#f26b7f',
  CHART_COLORS.gray,
];

/** 1,234,567 -> "1.23M". Keeps axis labels and tiles short. */
export function fmtCompact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (a >= 1e9) return `${sign}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${sign}${(a / 1e3).toFixed(1)}K`;
  return `${sign}${Math.round(a).toLocaleString('en-US')}`;
}

export function fmtMoney(n: number): string {
  if (Math.abs(n) < 0.5) n = 0;
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Round an axis maximum up so all four gridline steps are readable (e.g. 6M → 0/1.5/3/4.5/6M). */
function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const steps = [1, 1.2, 1.6, 2, 2.4, 3.2, 4, 4.8, 6, 8, 10];
  const nice = steps.find((x) => f <= x) ?? 10;
  return nice * exp;
}

// ------------------------------------------------------------------
// Column chart — single or stacked series, optional reference tick
// (used for "same month last year"). Click / hover a column to read it.
// ------------------------------------------------------------------
export type ColumnDatum = {
  label: string;
  parts: number[];
  ref?: number;
  sublabel?: string;
  /** Small second line under the label, e.g. the year (’25). */
  tag?: string;
};

export function ColumnChart({
  data,
  colors,
  names,
  format = fmtMoney,
  height = 190,
  refName = 'Prior year',
  highlightLast = false,
  emptyText = 'No data for this period.',
}: {
  data: ColumnDatum[];
  colors: string[];
  names: string[];
  format?: (n: number) => string;
  height?: number;
  refName?: string;
  highlightLast?: boolean;
  emptyText?: string;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const totals = data.map((d) => d.parts.reduce((s, v) => s + v, 0));
  const hasRef = data.some((d) => d.ref !== undefined);
  const rawMax = Math.max(0, ...totals, ...data.map((d) => d.ref ?? 0));
  const max = niceMax(rawMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const active = sel ?? data.length - 1;
  const a = data[active];

  if (rawMax <= 0) {
    return <div className="text-[12px] text-gray-400 py-10 text-center">{emptyText}</div>;
  }

  return (
    <div>
      {/* Readout for the selected (default: latest) column */}
      {a && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mb-3 min-h-[34px]">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            {a.sublabel ?? a.label}
          </span>
          {a.parts.length === 1 ? (
            <span className="text-lg font-black text-rowan-navy">{format(totals[active])}</span>
          ) : (
            <>
              <span className="text-lg font-black text-rowan-navy">{format(totals[active])}</span>
              {a.parts.map((p, i) => (
                <span key={i} className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                  <i className="inline-block w-2 h-2 rounded-sm" style={{ background: colors[i] }} />
                  {names[i]} {format(p)}
                </span>
              ))}
            </>
          )}
          {a.ref !== undefined && (
            <span className="text-[11px] text-gray-400">
              {refName}: {format(a.ref)}
            </span>
          )}
        </div>
      )}

      <div className="flex">
        {/* Y axis */}
        <div className="relative w-11 shrink-0" style={{ height }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-1.5 text-[9px] text-gray-400 leading-none -translate-y-1/2"
              style={{ bottom: `${t * 100}%` }}
            >
              {fmtCompact(t * max)}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1 min-w-0" style={{ height }}>
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute left-0 right-0 border-t ${t === 0 ? 'border-gray-300' : 'border-gray-100'}`}
              style={{ bottom: `${t * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-stretch gap-[3px]">
            {data.map((d, i) => {
              const isLast = i === data.length - 1;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setSel(i)}
                  onFocus={() => setSel(i)}
                  onClick={() => setSel(i)}
                  aria-label={`${d.label}: ${format(totals[i])}`}
                  className={`relative flex-1 min-w-0 h-full outline-none rounded-sm transition-colors ${
                    i === active ? 'bg-red-50/70' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="absolute inset-x-[14%] bottom-0 flex flex-col-reverse" style={{ height: '100%' }}>
                    {d.parts.map((p, pi) => (
                      <div
                        key={pi}
                        style={{
                          height: `${(p / max) * 100}%`,
                          background: highlightLast && isLast && pi === 0 ? CHART_COLORS.red : colors[pi],
                        }}
                        className={pi === d.parts.length - 1 ? 'rounded-t-[3px]' : ''}
                      />
                    ))}
                  </div>
                  {d.ref !== undefined && d.ref > 0 && (
                    <div
                      className="absolute inset-x-[4%] h-[2px] bg-gray-700/70"
                      style={{ bottom: `calc(${(d.ref / max) * 100}% - 1px)` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* X axis labels */}
      <div className="flex mt-1.5">
        <div className="w-11 shrink-0" />
        <div className="flex-1 min-w-0 flex gap-[3px]">
          {data.map((d, i) => (
            <div
              key={i}
              className={`flex-1 min-w-0 text-center text-[9px] sm:text-[10px] truncate ${
                i === active ? 'font-bold text-rowan-red' : 'text-gray-400'
              }`}
            >
              {d.label}
              <div className="text-[8px] leading-tight font-normal text-gray-400 h-[10px]">{d.tag ?? ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10px] text-gray-500">
        {names.map((n, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colors[i] }} />
            {n}
          </span>
        ))}
        {hasRef && (
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block w-3 h-[2px] bg-gray-700/70" />
            {refName}
          </span>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Donut chart with centre label and legend
// ------------------------------------------------------------------
export type Slice = { label: string; value: number; color: string; note?: string };

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  format = fmtMoney,
  size = 150,
}: {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
  format?: (n: number) => string;
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" width={size} height={size} className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke={CHART_COLORS.grayLight} strokeWidth="18" />
          {total > 0 &&
            slices.map((s, i) => {
              const v = Math.max(0, s.value);
              if (v <= 0) return null;
              const len = (v / total) * c;
              const el = (
                <circle
                  key={i}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${Math.max(0, len - 1.5)} ${c - Math.max(0, len - 1.5)}`}
                  strokeDashoffset={-offset}
                >
                  <title>{`${s.label}: ${format(v)} (${((v / total) * 100).toFixed(1)}%)`}</title>
                </circle>
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight">
            {centerLabel}
          </div>
          <div className="text-[15px] font-black text-rowan-navy leading-tight">{centerValue}</div>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px] min-w-0">
            <i className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="truncate text-gray-600">{s.label}</span>
            <span className="ml-auto font-bold text-rowan-navy shrink-0">{s.note ?? format(s.value)}</span>
            {!s.note && (
              <span className="w-10 text-right text-[10px] text-gray-400 shrink-0">
                {total > 0 ? `${((Math.max(0, s.value) / total) * 100).toFixed(0)}%` : '—'}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------
// Horizontal bar list (rankings, category breakdowns)
// ------------------------------------------------------------------
export type HBarItem = { label: string; value: number; sub?: string; color?: string };

export function HBars({
  items,
  format = fmtMoney,
  color = CHART_COLORS.navy,
  emptyText = 'Nothing to show yet.',
}: {
  items: HBarItem[];
  format?: (n: number) => string;
  color?: string;
  emptyText?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0 || max <= 0) {
    return <div className="text-[12px] text-gray-400 py-6 text-center">{emptyText}</div>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li key={i}>
          <div className="flex items-baseline gap-2 text-[12px] mb-1 min-w-0">
            <span className="font-semibold text-rowan-navy truncate" title={it.label}>
              {it.label}
            </span>
            {it.sub && <span className="text-[10px] text-gray-400 shrink-0">{it.sub}</span>}
            <span className="ml-auto font-bold text-rowan-navy shrink-0">{format(it.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (it.value / max) * 100)}%`, background: it.color ?? color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------
// Single horizontal stacked bar with a legend table (AR aging)
// ------------------------------------------------------------------
export function StackedBar({
  segments,
  format = fmtMoney,
}: {
  segments: Slice[];
  format?: (n: number) => string;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div>
      <div className="flex h-5 rounded-full overflow-hidden bg-gray-100">
        {total > 0 &&
          segments.map((s, i) =>
            s.value > 0 ? (
              <div
                key={i}
                style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                title={`${s.label}: ${format(s.value)}`}
              />
            ) : null
          )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px]">
            <i className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="ml-auto font-bold text-rowan-navy">{format(s.value)}</span>
            <span className="w-10 text-right text-[10px] text-gray-400">
              {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------
// Sparkline — tiny trend line for KPI tiles
// ------------------------------------------------------------------
export function Sparkline({ values, color = CHART_COLORS.navy }: { values: number[]; color?: string }) {
  if (values.length < 2 || Math.max(...values) <= 0) return <div className="h-7" />;
  const w = 100;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / span) * (h - 4)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-7" aria-hidden>
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="1.8" fill={CHART_COLORS.red} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ------------------------------------------------------------------
// Semicircular gauge (0–100 %)
// ------------------------------------------------------------------
export function Gauge({
  pct,
  label,
  goodAbove = 80,
  warnAbove = 60,
}: {
  pct: number;
  label: string;
  goodAbove?: number;
  warnAbove?: number;
}) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 52;
  const half = Math.PI * r;
  const color = p >= goodAbove ? CHART_COLORS.green : p >= warnAbove ? CHART_COLORS.amber : CHART_COLORS.red;
  return (
    <div className="relative w-full max-w-[220px] mx-auto">
      <svg viewBox="0 0 140 82" className="w-full">
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke={CHART_COLORS.grayLight} strokeWidth="13" strokeLinecap="round" />
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          stroke={color}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * half} ${half}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-2xl font-black text-rowan-navy leading-none">{p.toFixed(0)}%</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  );
}
