'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, setClientRole } from '@/lib/supabase';

export type AppRole = 'admin' | 'accountant' | 'auditor';
export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Admin',
  accountant: 'Accountant',
  auditor: 'Auditors',
};
const VALID: AppRole[] = ['admin', 'accountant', 'auditor'];

type AuthCtx = {
  session: Session | null;
  role: AppRole | null;
  displayName: string;
  loading: boolean;
  /** admin and accountant can change data; auditors are view-only. */
  canWrite: boolean;
  /** Returns an error message, or null on success. */
  signIn: (expected: AppRole, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}

async function fetchProfile(userId: string): Promise<{ role: AppRole | null; name: string | null }> {
  const { data } = await supabase.from('user_roles').select('role, full_name').eq('user_id', userId).maybeSingle();
  const r = (data?.role as string | undefined) ?? '';
  return { role: VALID.includes(r as AppRole) ? (r as AppRole) : null, name: (data?.full_name as string | null) ?? null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialised, setInitialised] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialised(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Look up the role whenever the signed-in user changes.
  const uid = session?.user.id ?? null;
  useEffect(() => {
    if (!uid) {
      setRole(null);
      setName(null);
      setResolvedFor(null);
      setClientRole(null);
      return;
    }
    if (resolvedFor === uid) return;
    let cancelled = false;
    fetchProfile(uid).then((p) => {
      if (cancelled) return;
      setClientRole(p.role);
      setRole(p.role);
      setName(p.name);
      setResolvedFor(uid);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, resolvedFor]);

  const signIn = useCallback(async (expected: AppRole, email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return 'Wrong email or password.';
    const p = await fetchProfile(data.user.id);
    if (p.role !== expected) {
      await supabase.auth.signOut();
      setClientRole(null);
      return p.role
        ? `This is not an ${ROLE_LABEL[expected]} account. Go back and choose the right login.`
        : 'This account has no access assigned. Ask the administrator.';
    }
    setClientRole(p.role);
    setRole(p.role);
    setName(p.name);
    setResolvedFor(data.user.id);
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setClientRole(null);
    setRole(null);
    setName(null);
    setResolvedFor(null);
  }, []);

  const loading = !initialised || (!!uid && resolvedFor !== uid);
  const displayName = name || session?.user.email?.split('@')[0] || '';

  return (
    <Ctx.Provider value={{ session, role, displayName, loading, canWrite: role === 'admin' || role === 'accountant', signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
