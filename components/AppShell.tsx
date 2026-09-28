'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { RowanMark } from '@/components/RowanMark';
import { OpenWindowsPanel } from '@/components/OpenWindowsPanel';
import { recordVisit } from '@/lib/navHistory';

// ------------------------------------------------------------------
// Persistent QB-style top bar, wrapped around every page from
// app/layout.tsx. Logo pinned small in the corner (always links
// home), a real back button (browser history, not a hardcoded
// parent — fixes the "back always goes to Accounting" bug), and
// the Open Windows / Favorites / Quick Reports panel on the right.
// Print-hidden so it never shows up on printed reports.
// ------------------------------------------------------------------

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    recordVisit(pathname);
  }, [pathname]);

  const isHome = pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <div className="print:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            {!isHome && (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-rowan-red px-2 py-1.5 rounded-md hover:bg-gray-100"
                title="Go back"
              >
                <ArrowLeft size={15} />
                Back
              </button>
            )}
            <Link href="/" className="flex items-center gap-2" title="Main Dashboard">
              <RowanMark size={26} />
              {isHome ? null : <Home size={13} className="text-gray-300" />}
            </Link>
          </div>

          <OpenWindowsPanel />
        </div>
      </div>

      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
