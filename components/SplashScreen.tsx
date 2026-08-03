'use client';

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * App splash screen. Master logo artwork reproduced exactly (gradients,
 * ribbon paths, network dot layout, stencil-cut mask on the ROWAN
 * wordmark, subtext framing lines) — nothing altered from the source
 * file. Only addition: a fade-out wrapper for use as a boot screen.
 */
export function SplashScreen({
  onFinish,
  minDurationMs = 1400,
}: {
  onFinish?: () => void;
  minDurationMs?: number;
}) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), minDurationMs);
    const t2 = setTimeout(() => onFinish?.(), minDurationMs + 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [minDurationMs, onFinish]);

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden flex justify-center items-center m-0 p-0 bg-[#e8eaf0] transition-opacity duration-400 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .rowan-text {
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            font-size: 155px;
            fill: #06154b;
            letter-spacing: 0.12em;
          }
          .sub-text {
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 20px;
            fill: #06154b;
            letter-spacing: 0.35em;
          }
        `,
        }}
      />

      <svg viewBox="0 0 1920 1080" className="w-full h-full max-w-full max-h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bg-grad" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f8f9fc" />
            <stop offset="100%" stopColor="#eaecf2" />
          </radialGradient>

          <linearGradient id="redGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5c0011" />
            <stop offset="50%" stopColor="#9e001d" />
            <stop offset="100%" stopColor="#e60026" />
          </linearGradient>

          <linearGradient id="blueGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#01040f" />
            <stop offset="50%" stopColor="#06154b" />
            <stop offset="100%" stopColor="#122a7a" />
          </linearGradient>

          <linearGradient id="whiteGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#eaecf2" />
            <stop offset="100%" stopColor="#f8f9fc" />
          </linearGradient>

          <filter id="shadow-bl" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="12" dy="-12" stdDeviation="25" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          <filter id="shadow-tr" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="-12" dy="12" stdDeviation="25" floodColor="#000000" floodOpacity="0.4" />
          </filter>

          <mask id="stencil-cuts">
            <rect x="0" y="0" width="1920" height="1080" fill="white" />
            <g stroke="black" strokeWidth="11" strokeLinecap="square">
              <line x1="585" y1="770" x2="655" y2="640" />
              <line x1="640" y1="770" x2="710" y2="640" />
              <line x1="775" y1="770" x2="845" y2="640" />
              <line x1="845" y1="770" x2="915" y2="640" />
              <line x1="975" y1="770" x2="1045" y2="640" />
              <line x1="1055" y1="770" x2="1125" y2="640" />
              <line x1="1175" y1="770" x2="1245" y2="640" />
              <line x1="1235" y1="770" x2="1305" y2="640" />
              <line x1="1350" y1="770" x2="1420" y2="640" />
              <line x1="1425" y1="770" x2="1495" y2="640" />
            </g>
          </mask>
        </defs>

        <rect width="1920" height="1080" fill="url(#bg-grad)" />

        <g id="bottom-left-ribbons">
          <path d="M 0 350 C 200 750 500 1080 1300 1080" fill="none" stroke="url(#blueGrad)" strokeWidth="1.5" opacity="0.3" />
          <path d="M 0 420 C 150 800 400 1080 1150 1080 L 0 1080 Z" fill="url(#blueGrad)" filter="url(#shadow-bl)" />
          <path d="M 0 460 C 120 830 370 1080 1050 1080 L 0 1080 Z" fill="url(#whiteGrad)" />
          <path d="M 0 500 C 90 860 330 1080 920 1080 L 0 1080 Z" fill="url(#redGrad)" filter="url(#shadow-bl)" />
          <path d="M 0 650 C 50 950 200 1080 650 1080 L 0 1080 Z" fill="url(#blueGrad)" filter="url(#shadow-bl)" />
          <path d="M 0 850 C 20 1020 100 1080 350 1080 L 0 1080 Z" fill="url(#redGrad)" filter="url(#shadow-bl)" />
        </g>

        <g id="top-right-ribbons">
          <path d="M 750 0 C 1250 0 1920 350 1920 1050" fill="none" stroke="url(#redGrad)" strokeWidth="1.5" opacity="0.3" />
          <path d="M 850 0 C 1350 0 1920 250 1920 950 L 1920 0 Z" fill="url(#blueGrad)" filter="url(#shadow-tr)" />
          <path d="M 920 0 C 1400 0 1920 210 1920 880 L 1920 0 Z" fill="url(#whiteGrad)" />
          <path d="M 980 0 C 1450 0 1920 180 1920 780 L 1920 0 Z" fill="url(#redGrad)" filter="url(#shadow-tr)" />
          <path d="M 1250 0 C 1650 0 1920 100 1920 550 L 1920 0 Z" fill="url(#blueGrad)" filter="url(#shadow-tr)" />
          <path d="M 1550 0 C 1850 0 1920 40 1920 320 L 1920 0 Z" fill="url(#redGrad)" filter="url(#shadow-tr)" />
        </g>

        <g id="network-bottom-left" stroke="#06154b" fill="#06154b">
          <line x1="250" y1="650" x2="350" y2="720" strokeWidth="1" opacity="0.4" />
          <line x1="350" y1="720" x2="480" y2="680" strokeWidth="0.8" opacity="0.3" />
          <line x1="350" y1="720" x2="400" y2="850" strokeWidth="1.2" opacity="0.5" />
          <line x1="480" y1="680" x2="560" y2="730" strokeWidth="0.6" opacity="0.2" />
          <line x1="400" y1="850" x2="510" y2="890" strokeWidth="0.8" opacity="0.4" />
          <line x1="250" y1="650" x2="180" y2="700" strokeWidth="0.8" opacity="0.3" />
          <line x1="180" y1="700" x2="220" y2="820" strokeWidth="1" opacity="0.4" />
          <line x1="220" y1="820" x2="320" y2="900" strokeWidth="0.8" opacity="0.3" />

          <circle cx="250" cy="650" r="3.5" />
          <circle cx="350" cy="720" r="5" />
          <circle cx="480" cy="680" r="3" />
          <circle cx="400" cy="850" r="4" />
          <circle cx="560" cy="730" r="2.5" />
          <circle cx="510" cy="890" r="2" />
          <circle cx="180" cy="700" r="3" />
          <circle cx="220" cy="820" r="4" />
          <circle cx="320" cy="900" r="2.5" />

          <circle cx="150" cy="600" r="1.5" />
          <circle cx="280" cy="580" r="2" opacity="0.7" />
          <circle cx="380" cy="620" r="1" />
          <circle cx="520" cy="630" r="1.5" />
          <circle cx="600" cy="700" r="2" opacity="0.6" />
          <circle cx="460" cy="780" r="1.5" />
          <circle cx="580" cy="820" r="2" />
          <circle cx="350" cy="950" r="1.5" />
          <circle cx="250" cy="980" r="2" opacity="0.8" />
          <circle cx="120" cy="780" r="1.5" />

          <circle cx="350" cy="720" r="12" fill="none" strokeWidth="0.5" opacity="0.6" />
          <circle cx="480" cy="680" r="8" fill="none" strokeWidth="0.4" opacity="0.5" />
          <circle cx="220" cy="820" r="10" fill="none" strokeWidth="0.5" opacity="0.6" />
        </g>

        <g id="network-top-right" stroke="#e60026" fill="#e60026">
          <line x1="1350" y1="280" x2="1480" y2="350" strokeWidth="1" opacity="0.4" />
          <line x1="1480" y1="350" x2="1580" y2="270" strokeWidth="1.2" opacity="0.5" />
          <line x1="1480" y1="350" x2="1540" y2="480" strokeWidth="0.8" opacity="0.3" />
          <line x1="1580" y1="270" x2="1690" y2="310" strokeWidth="0.8" opacity="0.4" />
          <line x1="1350" y1="280" x2="1260" y2="230" strokeWidth="0.6" opacity="0.2" />
          <line x1="1690" y1="310" x2="1780" y2="240" strokeWidth="0.8" opacity="0.3" />
          <line x1="1540" y1="480" x2="1650" y2="420" strokeWidth="0.6" opacity="0.3" />
          <line x1="1650" y1="420" x2="1720" y2="380" strokeWidth="0.5" opacity="0.2" />

          <circle cx="1350" cy="280" r="4" />
          <circle cx="1480" cy="350" r="5" />
          <circle cx="1580" cy="270" r="4.5" />
          <circle cx="1540" cy="480" r="3" />
          <circle cx="1690" cy="310" r="3.5" />
          <circle cx="1260" cy="230" r="2.5" />
          <circle cx="1780" cy="240" r="3" />
          <circle cx="1650" cy="420" r="2.5" />
          <circle cx="1720" cy="380" r="2" />

          <circle cx="1280" cy="350" r="1.5" />
          <circle cx="1420" cy="200" r="2" opacity="0.7" />
          <circle cx="1520" cy="180" r="1.5" />
          <circle cx="1650" cy="150" r="2" opacity="0.6" />
          <circle cx="1750" cy="320" r="1.5" />
          <circle cx="1820" cy="200" r="2" />
          <circle cx="1600" cy="520" r="1.5" />
          <circle cx="1480" cy="550" r="2" opacity="0.8" />
          <circle cx="1320" cy="420" r="1.5" />
          <circle cx="1450" cy="420" r="1" />

          <g fill="#06154b" stroke="none">
            <circle cx="1550" cy="320" r="2" />
            <circle cx="1410" cy="290" r="1.5" />
            <circle cx="1680" cy="460" r="2.5" opacity="0.8" />
            <circle cx="1750" cy="280" r="1.5" />
            <circle cx="1500" cy="230" r="2" />
          </g>

          <circle cx="1480" cy="350" r="12" fill="none" strokeWidth="0.5" opacity="0.6" />
          <circle cx="1580" cy="270" r="10" fill="none" strokeWidth="0.4" opacity="0.5" />
          <circle cx="1350" cy="280" r="8" fill="none" strokeWidth="0.5" opacity="0.6" />
        </g>

        <g id="center-logo">
          <rect x="770" y="210" width="140" height="380" fill="#06154b" />
          <path d="M 945 210 L 1050 210 A 95 95 0 0 1 1050 400 L 945 400 Z" fill="#e60026" />
          <path d="M 945 400 L 945 590 L 1145 590 Z" fill="#e60026" />
        </g>

        <g id="logo-text" mask="url(#stencil-cuts)">
          <text x="960" y="745" className="rowan-text" textAnchor="middle">
            ROWAN
          </text>
        </g>

        <g id="logo-subtext">
          <text x="960" y="818" className="sub-text" textAnchor="middle">
            CASUAL WEAR PVT LTD
          </text>
          <line x1="620" y1="810" x2="710" y2="810" stroke="#06154b" strokeWidth="2.5" />
          <line x1="1210" y1="810" x2="1300" y2="810" stroke="#e60026" strokeWidth="2.5" />
        </g>

      </svg>

      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );
}
