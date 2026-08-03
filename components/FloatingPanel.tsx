'use client';

import React, { forwardRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Positions its children as a fixed-position panel anchored to `anchorRef`,
 * rendered via a portal into document.body.
 *
 * Why this exists: every page wraps its content in a card with
 * overflow-hidden (needed for rounded corners). A plain `absolute`
 * dropdown inside that card gets silently clipped at the card's edge —
 * looks like the dropdown "goes down and you can't see it". Portaling
 * to body sidesteps that entirely, and this also auto-flips the panel
 * above the trigger when there isn't enough room below.
 */
export const FloatingPanel = forwardRef<
  HTMLDivElement,
  {
    anchorRef: React.RefObject<HTMLElement>;
    open: boolean;
    children: React.ReactNode;
    className?: string;
    minWidth?: number;
  }
>(function FloatingPanel({ anchorRef, open, children, className = '', minWidth }, panelRef) {
  const [pos, setPos] = useState<{ top: number; bottom: number; left: number; width: number; openUp: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPos(null);
      return;
    }

    function update() {
      const rect = anchorRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
      setPos({
        top: rect.bottom + 4,
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        openUp,
      });
    }

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef]);

  if (!open || !pos || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.openUp ? undefined : pos.top,
        bottom: pos.openUp ? pos.bottom : undefined,
        width: Math.max(pos.width, minWidth ?? 0),
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
});
