'use client';

import React, { useEffect } from 'react';

export type ToastKind = 'success' | 'error';

/**
 * A floating popup notification, not an inline banner. Renders fixed
 * to the viewport (bottom-center) so it never pushes page content
 * down or changes scroll height — the thing that made an inline
 * "Deleted." banner at the top of a long page feel like the whole
 * page had jumped when you were scrolled down clicking something.
 * Auto-dismisses after `duration` ms (default 4s); success toasts
 * are the same duration, errors stay a bit longer since there's more
 * to read.
 */
export function Toast({
  message,
  kind,
  onClose,
  duration,
}: {
  message: string;
  kind: ToastKind;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, duration ?? (kind === 'error' ? 6000 : 3500));
    return () => clearTimeout(t);
  }, [message, kind, duration, onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[calc(100%-2rem)] px-4">
      <div
        className={`flex items-start gap-3 rounded-lg shadow-2xl px-4 py-3 text-[13px] font-semibold border ${
          kind === 'error' ? 'bg-white border-rowan-red text-rowan-red' : 'bg-rowan-navy border-rowan-navy text-white'
        }`}
        role="status"
      >
        <span className="flex-1 leading-snug">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className={`shrink-0 leading-none text-lg ${kind === 'error' ? 'text-rowan-red/60 hover:text-rowan-red' : 'text-white/60 hover:text-white'}`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
