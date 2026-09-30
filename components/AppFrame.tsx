'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/components/AuthProvider';

/**
 * The gate (/) and the three login pages (/login/...) are public and draw
 * their own full-screen layout. Everything else needs a signed-in user with
 * an assigned role, and is shown inside the app shell.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, role, loading, signOut } = useAuth();
  const isPublic = pathname === '/' || pathname.startsWith('/login');

  useEffect(() => {
    if (!isPublic && !loading && !session) router.replace('/');
  }, [isPublic, loading, session, router]);

  if (isPublic) return <>{children}</>;

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg p-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm text-center">
          <h1 className="text-lg font-black text-rowan-navy mb-2">No access assigned</h1>
          <p className="text-sm text-gray-500 mb-5">This login has no role yet. Ask the administrator to assign one.</p>
          <button
            onClick={async () => {
              await signOut();
              router.replace('/');
            }}
            className="bg-rowan-red text-white px-5 py-2.5 rounded-full text-sm font-bold"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
