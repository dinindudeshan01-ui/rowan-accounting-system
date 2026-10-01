'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

// ------------------------------------------------------------------
// Dependency-free chart primitives (SVG + CSS) used by /dashboard.
// Brand colours: navy / red, with neutral + status support tones.
// Animations live in globals.css (.chart-rise / .chart-draw / .chart-pop).
// ------------------------------------------------------------------

export const CHART_COLORS = {
  navy: '#06154b',
  navyLight: '#122a7a',
  red: '#e60026',
  redDark: '#5c0011',
  green: '#16a34a',
  greenLight: '#4ade80',
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

// ---------------------------- formatting ----------------------------

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

// ------------------------------ hooks -------------------------------

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.floor(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Flips to true shortly after mount so CSS transitions can animate from empty. */
function useGrown(delay = 40) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGrown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return grown;
}

function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = a + (target - a) * e;
      setV(cur);
      from.current = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useCountUp(value);
  return <>{format(v)}</>;
}

// --------------------------- curve helpers --------------------------

/** Monotone cubic interpolation (like d3.curveMonotoneX): smooth, never overshoots the data. */
function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  if (n === 2) return `M${pts[0][0]},${pts[0][1]}L${pts[1][0]},${pts[1][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const k = 3 / Math.sqrt(s);
        t[i] = k * a * m[i];
        t[i + 1] = k * b * m[i];
      }
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += `C${pts[i][0] + c},${pts[i][1] + t[i] * c},${pts[i + 1][0] - c},${pts[i + 1][1] - t[i + 1] * c},${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

function roundedTop(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, h, w / 2));
  return `M${x},${y + h}L${x},${y + rr}Q${x},${y} ${x + rr},${y}L${x + w - rr},${y}Q${x + w},${y} ${x + w},${y + rr}L${x + w},${y + h}Z`;
}

// ------------------------------------------------------------------
// ComboChart — gradient (stacked) bars + smooth line overlays,
// dual axis, hover tooltip, clickable legend, hatched "in-progress" month.
// ------------------------------------------------------------------
export type ComboDatum = {
  label: string;
  tag?: string;
  sublabel?: string;
  parts: number[];
  lines?: (number | null)[];
};

export type LineDef = {
  name: string;
  color: string;
  dashed?: boolean;
  axis?: 'left' | 'right';
  format?: (n: number) => string;
};

export function ComboChart({
  data,
  barNames,
  barColors,
  lines = [],
  format = fmtMoney,
  height = 270,
  rightMax = 100,
  rightFormat = (n: number) => `${n.toFixed(0)}%`,
  partialLast = false,
  emptyText = 'No data for this period.',
}: {
  data: ComboDatum[];
  barNames: string[];
  barColors: [string, string][]; // [top, bottom] gradient stops per bar series
  lines?: LineDef[];
  format?: (n: number) => string;
  height?: number;
  rightMax?: number;
  rightFormat?: (n: number) => string;
  partialLast?: boolean;
  emptyText?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hov, setHov] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setHidden((h) => {
      const n = new Set(h);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });

  const visBar = barNames.map((n) => !hidden.has(n));
  const visLine = lines.map((l) => !hidden.has(l.name));
  const hasRight = lines.some((l, i) => l.axis === 'right' && visLine[i]);

  const totals = data.map((d) => d.parts.reduce((s, v, i) => s + (visBar[i] ? v : 0), 0));
  const leftLineVals = data.flatMap((d) =>
    (d.lines ?? []).map((v, i) => (lines[i]?.axis !== 'right' && visLine[i] && v !== null ? v : 0))
  );
  const rawMax = Math.max(0, ...totals, ...leftLineVals);
  const allZero = data.every((d) => d.parts.every((p) => p <= 0) && (d.lines ?? []).every((v) => !v));

  if (allZero) return <div className="text-[12px] text-gray-400 py-10 text-center">{emptyText}</div>;

  const leftMax = niceMax(rawMax);
  const M = { l: 46, r: hasRight ? 40 : 8, t: 10, b: 38 };
  const pw = Math.max(10, width - M.l - M.r);
  const ph = height - M.t - M.b;
  const n = data.length;
  const band = pw / n;
  const barW = Math.min(band * 0.64, 40);
  const xc = (i: number) => M.l + band * (i + 0.5);
  const yL = (v: number) => M.t + ph * (1 - v / leftMax);
  const yR = (v: number) => M.t + ph * (1 - v / rightMax);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const tip = hov !== null ? data[hov] : null;
  const tipX = hov !== null ? xc(hov) : 0;
  const flip = tipX > width * 0.58;

  return (
    <div>
      <div ref={ref} className="relative w-full select-none" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="overflow-visible block">
            <defs>
              {barColors.map(([top, bottom], i) => (
                <linearGradient key={i} id={`${uid}-b${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={top} />
                  <stop offset="100%" stopColor={bottom} />
                </linearGradient>
              ))}
              <pattern id={`${uid}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="7" stroke="#fff" strokeOpacity="0.55" strokeWidth="3" />
              </pattern>
            </defs>

            {/* Grid + left axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={M.l}
                  x2={M.l + pw}
                  y1={yL(t * leftMax)}
                  y2={yL(t * leftMax)}
                  stroke={t === 0 ? '#d1d5db' : '#eef0f3'}
                  strokeDasharray={t === 0 ? undefined : '3 4'}
                />
                <text x={M.l - 8} y={yL(t * leftMax) + 3} textAnchor="end" fontSize="9.5" fill="#9ca3af">
                  {fmtCompact(t * leftMax)}
                </text>
                {hasRight && (
                  <text x={M.l + pw + 8} y={yR(t * rightMax) + 3} textAnchor="start" fontSize="9.5" fill="#9ca3af">
                    {rightFormat(t * rightMax)}
                  </text>
                )}
              </g>
            ))}

            {/* Hover column highlight + guide */}
            {hov !== null && (
              <rect x={M.l + band * hov} y={M.t} width={band} height={ph} fill="#e60026" opacity="0.05" rx="6" />
            )}

            {/* Bars */}
            {data.map((d, i) => {
              let acc = 0;
              const segs: React.ReactNode[] = [];
              const visibleIdx = d.parts.map((_, pi) => pi).filter((pi) => visBar[pi]);
              const topPi = visibleIdx[visibleIdx.length - 1];
              d.parts.forEach((p, pi) => {
                if (!visBar[pi] || p <= 0) return;
                const h = (p / leftMax) * ph;
                const y = M.t + ph - acc - h;
                const x = xc(i) - barW / 2;
                acc += h;
                const isTop = pi === topPi;
                const dPath = isTop ? roundedTop(x, y, barW, h, 5) : `M${x},${y}h${barW}v${h}h${-barW}Z`;
                segs.push(
                  <g key={pi}>
                    <path d={dPath} fill={`url(#${uid}-b${pi})`} opacity={hov === null || hov === i ? 1 : 0.55} style={{ transition: 'opacity .15s' }} />
                    {partialLast && i === n - 1 && <path d={dPath} fill={`url(#${uid}-hatch)`} />}
                  </g>
                );
              });
              return (
                <g key={i} className="chart-rise" style={{ animationDelay: `${i * 45}ms` }}>
                  {segs}
                </g>
              );
            })}

            {/* Lines */}
            {lines.map((l, li) => {
              if (!visLine[li]) return null;
              const y = l.axis === 'right' ? yR : yL;
              const pts: [number, number][] = [];
              data.forEach((d, i) => {
                const v = d.lines?.[li];
                if (v !== null && v !== undefined) pts.push([xc(i), y(v)]);
              });
              if (pts.length === 0) return null;
              return (
                <g key={l.name}>
                  <path
                    d={monotonePath(pts)}
                    fill="none"
                    stroke={l.color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={l.dashed ? '5 5' : undefined}
                    pathLength={l.dashed ? undefined : 1}
                    className={l.dashed ? 'chart-fade' : 'chart-draw'}
                  />
                  {pts.map(([px, py], k) => (
                    <circle key={k} cx={px} cy={py} r={3.2} fill="#fff" stroke={l.color} strokeWidth="2" className="chart-pop" />
                  ))}
                </g>
              );
            })}

            {/* X labels */}
            {data.map((d, i) => (
              <g key={i}>
                <text
                  x={xc(i)}
                  y={M.t + ph + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={hov === i || (hov === null && i === n - 1) ? 800 : 500}
                  fill={hov === i || (hov === null && i === n - 1) ? '#e60026' : '#9ca3af'}
                >
                  {d.label}
                </text>
                {d.tag && (
                  <text x={xc(i)} y={M.t + ph + 28} textAnchor="middle" fontSize="8.5" fill="#b8bec9">
                    {d.tag}
                  </text>
                )}
              </g>
            ))}

            {/* Hit areas */}
            {data.map((_, i) => (
              <rect
                key={i}
                x={M.l + band * i}
                y={M.t}
                width={band}
                height={ph + M.b}
                fill="transparent"
                onMouseEnter={() => setHov(i)}
                onMouseMove={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                onClick={() => setHov(i)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </svg>
        )}

        {/* Tooltip */}
        {tip && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl border border-white/10 bg-rowan-navy/95 text-white shadow-xl backdrop-blur px-3 py-2 min-w-[150px]"
            style={{
              top: 6,
              left: tipX,
              transform: `translateX(${flip ? 'calc(-100% - 14px)' : '14px'})`,
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">{tip.sublabel ?? tip.label}</div>
            {tip.parts.map((p, pi) =>
              visBar[pi] ? (
                <div key={pi} className="flex items-center gap-2 text-[11px]">
                  <i className="inline-block w-2 h-2 rounded-sm" style={{ background: barColors[pi][0] }} />
                  <span className="text-white/75">{barNames[pi]}</span>
                  <span className="ml-auto font-bold pl-3">{format(p)}</span>
                </div>
              ) : null
            )}
            {tip.parts.filter((_, pi) => visBar[pi]).length > 1 && (
              <div className="flex items-center gap-2 text-[11px] border-t border-white/15 mt-1 pt-1">
                <span className="text-white/75">Total</span>
                <span className="ml-auto font-black pl-3">{format(totals[hov!])}</span>
              </div>
            )}
            {lines.map((l, li) => {
              const v = tip.lines?.[li];
              if (!visLine[li] || v === null || v === undefined) return null;
              return (
                <div key={l.name} className="flex items-center gap-2 text-[11px] mt-0.5">
                  <i className="inline-block w-2.5 h-[3px] rounded" style={{ background: l.color }} />
                  <span className="text-white/75">{l.name}</span>
                  <span className="ml-auto font-bold pl-3">{(l.format ?? (l.axis === 'right' ? rightFormat : format))(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend (click to show / hide a series) */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3">
        {barNames.map((nm, i) => (
          <button
            key={nm}
            type="button"
            onClick={() => toggle(nm)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
              hidden.has(nm) ? 'border-gray-200 text-gray-300 line-through' : 'border-gray-200 text-gray-600 hover:border-rowan-red/40'
            }`}
          >
            <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: `linear-gradient(${barColors[i][0]}, ${barColors[i][1]})` }} />
            {nm}
          </button>
        ))}
        {lines.map((l) => (
          <button
            key={l.name}
            type="button"
            onClick={() => toggle(l.name)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
              hidden.has(l.name) ? 'border-gray-200 text-gray-300 line-through' : 'border-gray-200 text-gray-600 hover:border-rowan-red/40'
            }`}
          >
            <i
              className="inline-block w-3.5 h-0 border-t-2 rounded"
              style={{ borderColor: l.color, borderStyle: l.dashed ? 'dashed' : 'solid' }}
            />
            {l.name}
          </button>
        ))}
        {partialLast && <span className="text-[10px] text-gray-400 ml-auto">▨ current month in progress</span>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Donut chart — animated draw-in, hover to focus a slice
// ------------------------------------------------------------------
export type Slice = { label: string; value: number; color: string; note?: string };

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  format = fmtMoney,
  size = 160,
}: {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
  format?: (n: number) => string;
  size?: number;
}) {
  const grown = useGrown();
  const [hov, setHov] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = 54;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const h = hov !== null ? slices[hov] : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" width={size} height={size} className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f3f5" strokeWidth="16" />
          {total > 0 &&
            slices.map((s, i) => {
              const v = Math.max(0, s.value);
              if (v <= 0) return null;
              const len = (v / total) * c;
              const vis = Math.max(0, len - 2.5);
              const el = (
                <circle
                  key={i}
                  cx="70"
                  cy="70"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hov === i ? 21 : 16}
                  strokeDasharray={`${grown ? vis : 0} ${c}`}
                  strokeDashoffset={-offset}
                  opacity={hov === null || hov === i ? 1 : 0.3}
                  onMouseEnter={() => setHov(i)}
                  onMouseLeave={() => setHov(null)}
                  style={{
                    transition: 'stroke-dasharray .95s cubic-bezier(.2,.8,.2,1), stroke-width .18s, opacity .18s',
                    cursor: 'pointer',
                  }}
                />
              );
              offset += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-7 pointer-events-none">
          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-tight truncate max-w-full">
            {h ? h.label : centerLabel}
          </div>
          <div className="text-[15px] font-black text-rowan-navy leading-tight">
            {h ? (h.note ?? format(h.value)) : centerValue}
          </div>
          {h && !h.note && total > 0 && (
            <div className="text-[10px] font-bold text-rowan-red">{((Math.max(0, h.value) / total) * 100).toFixed(1)}%</div>
          )}
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1">
        {slices.map((s, i) => (
          <li
            key={i}
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}
            className={`flex items-center gap-2 text-[12px] min-w-0 rounded-lg px-1.5 py-1 transition-colors ${
              hov === i ? 'bg-red-50' : ''
            }`}
          >
            <i className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
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
// Horizontal bar list — gradient bars that grow in
// ------------------------------------------------------------------
export type HBarItem = { label: string; value: number; sub?: string; color?: string };

export function HBars({
  items,
  format = fmtMoney,
  color = CHART_COLORS.navy,
  ranked = false,
  emptyText = 'Nothing to show yet.',
}: {
  items: HBarItem[];
  format?: (n: number) => string;
  color?: string;
  ranked?: boolean;
  emptyText?: string;
}) {
  const grown = useGrown();
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0 || max <= 0) {
    return <div className="text-[12px] text-gray-400 py-6 text-center">{emptyText}</div>;
  }
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const col = it.color ?? color;
        return (
          <li key={i} className="flex items-start gap-2.5">
            {ranked && (
              <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-gray-100 text-[10px] font-black text-rowan-navy flex items-center justify-center">
                {i + 1}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-[12px] mb-1 min-w-0">
                <span className="font-semibold text-rowan-navy truncate" title={it.label}>
                  {it.label}
                </span>
                {it.sub && <span className="text-[10px] text-gray-400 shrink-0">{it.sub}</span>}
                <span className="ml-auto font-bold text-rowan-navy shrink-0">{format(it.value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: grown ? `${Math.max(3, (it.value / max) * 100)}%` : '0%',
                    background: `linear-gradient(90deg, ${col}, ${col}99)`,
                    transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 70}ms`,
                  }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ------------------------------------------------------------------
// Horizontal stacked bar with legend table (AR aging)
// ------------------------------------------------------------------
export function StackedBar({
  segments,
  format = fmtMoney,
}: {
  segments: Slice[];
  format?: (n: number) => string;
}) {
  const grown = useGrown();
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div>
      <div className="flex h-6 rounded-full overflow-hidden bg-gray-100 gap-[2px]">
        {total > 0 &&
          segments.map((s, i) =>
            s.value > 0 ? (
              <div
                key={i}
                title={`${s.label}: ${format(s.value)}`}
                style={{
                  width: grown ? `${(s.value / total) * 100}%` : '0%',
                  background: `linear-gradient(180deg, ${s.color}, ${s.color}cc)`,
                  transition: `width .9s cubic-bezier(.2,.8,.2,1) ${i * 90}ms`,
                }}
              />
            ) : null
          )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-[12px]">
            <i className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
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
// Sparkline — smooth trend with gradient area
// ------------------------------------------------------------------
export function Sparkline({
  values,
  color = CHART_COLORS.navy,
  dot = CHART_COLORS.red,
  height = 28,
}: {
  values: number[];
  color?: string;
  dot?: string;
  height?: number;
}) {
  const uid = useId().replace(/:/g, '');
  if (values.length < 2 || Math.max(...values) <= 0) return <div style={{ height }} />;
  const w = 100;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as [number, number]);
  const line = monotonePath(pts);
  const area = `${line}L${w},${h}L0,${h}Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full overflow-visible" style={{ height }} aria-hidden>
      <defs>
        <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid}-a)`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.2" fill={dot} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// ------------------------------------------------------------------
// Gauge — gradient semicircle with ticks (0–100 %)
// ------------------------------------------------------------------
export function Gauge({
  pct,
  label,
  invert = false,
}: {
  pct: number;
  label: string;
  /** invert: high values are bad (e.g. overdue share) */
  invert?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const grown = useGrown();
  const p = Math.max(0, Math.min(100, pct));
  const r = 52;
  const half = Math.PI * r;
  const stops = invert
    ? [CHART_COLORS.green, CHART_COLORS.amber, CHART_COLORS.red]
    : [CHART_COLORS.red, CHART_COLORS.amber, CHART_COLORS.green];
  const ticks = [0, 25, 50, 75, 100].map((t) => {
    const a = Math.PI - (t / 100) * Math.PI;
    return { x1: 70 + Math.cos(a) * 62, y1: 70 - Math.sin(a) * 62, x2: 70 + Math.cos(a) * 66, y2: 70 - Math.sin(a) * 66 };
  });
  return (
    <div className="relative w-full max-w-[230px] mx-auto">
      <svg viewBox="0 0 140 84" className="w-full">
        <defs>
          <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse" x1="18" y1="0" x2="122" y2="0">
            <stop offset="0%" stopColor={stops[0]} />
            <stop offset="50%" stopColor={stops[1]} />
            <stop offset="100%" stopColor={stops[2]} />
          </linearGradient>
        </defs>
        <path d="M 18 70 A 52 52 0 0 1 122 70" fill="none" stroke="#eef0f3" strokeWidth="13" strokeLinecap="round" />
        <path
          d="M 18 70 A 52 52 0 0 1 122 70"
          fill="none"
          stroke={`url(#${uid}-g)`}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${grown ? (p / 100) * half : 0} ${half}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.2,.8,.2,1)' }}
        />
        {ticks.map((t, i) => (
          <line key={i} {...t} stroke="#cbd0d8" strokeWidth="1" />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="text-2xl font-black text-rowan-navy leading-none">
          <CountUp value={p} format={(n) => `${n.toFixed(0)}%`} />
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">{label}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// RingProgress — compact circular progress
// ------------------------------------------------------------------
export function RingProgress({
  pct,
  color = CHART_COLORS.red,
  size = 76,
  label,
}: {
  pct: number;
  color?: string;
  size?: number;
  label?: string;
}) {
  const grown = useGrown();
  const p = Math.max(0, Math.min(100, pct));
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 76 76" width={size} height={size} className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#eef0f3" strokeWidth="8" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${grown ? (p / 100) * c : 0} ${c}`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-black text-rowan-navy">{p.toFixed(0)}%</span>
        {label && <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Calendar heatmap — weeks as columns, Monday → Sunday as rows
// ------------------------------------------------------------------
export type HeatCell = { date: string; value: number; future?: boolean };

const HEAT_SCALE = ['#fde8ec', '#f8a9b6', '#ee5a74', '#e60026', '#8c0019'];

export function Heatmap({
  weeks,
  format = fmtMoney,
}: {
  weeks: HeatCell[][];
  format?: (n: number) => string;
}) {
  const max = Math.max(0, ...weeks.flat().map((c) => c.value));
  const level = (v: number) => {
    const t = v / max;
    return t <= 0.15 ? 0 : t <= 0.4 ? 1 : t <= 0.7 ? 2 : t < 1 ? 3 : 4;
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabel = (wi: number) => {
    const m = Number(weeks[wi][0].date.slice(5, 7));
    const prev = wi > 0 ? Number(weeks[wi - 1][0].date.slice(5, 7)) : -1;
    return m !== prev ? MONTHS[m - 1] : '';
  };
  const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px] shrink-0 w-7 text-[9px] text-gray-400">
          <div className="h-[15px]" />
          {DAYS.map((d, i) => (
            <div key={i} className="h-[13px] sm:h-[20px] flex items-center leading-none">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0 flex gap-[3px]">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex-1 min-w-0 flex flex-col gap-[3px]">
              <div className="h-[15px] text-[9px] text-gray-400 leading-[15px] whitespace-nowrap overflow-visible">{monthLabel(wi)}</div>
              {wk.map((c, di) => (
                <div
                  key={di}
                  title={c.future ? '' : `${c.date} · ${c.value > 0 ? format(c.value) : 'no sales'}`}
                  className="w-full h-[13px] sm:h-[20px] rounded-[4px] transition-transform hover:scale-110 hover:z-10 chart-fade"
                  style={{
                    animationDelay: `${wi * 18}ms`,
                    background: c.future ? 'transparent' : c.value > 0 ? HEAT_SCALE[level(c.value)] : '#f3f4f6',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] text-gray-400">
        Less
        <i className="inline-block w-3 h-3 rounded-[3px] bg-gray-100" />
        {HEAT_SCALE.map((c) => (
          <i key={c} className="inline-block w-3 h-3 rounded-[3px]" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  );
}
