'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { GateBackground } from '@/components/GateBackground';
import { AppRole, ROLE_LABEL, useAuth } from '@/components/AuthProvider';

const CONFIG: Record<string, { role: AppRole; img: string; hint: string; blurb: string }> = {
  admin: { role: 'admin', img: '/gate/admin.png', hint: 'admin@rowan.lk', blurb: 'Full access to everything.' },
  accountant: { role: 'accountant', img: '/gate/accountant.png', hint: 'accountant@rowan.lk', blurb: 'Full access to accounting and operations.' },
  auditor: { role: 'auditor', img: '/gate/auditor.png', hint: 'auditors@rowan.lk', blurb: 'View-only access. Nothing can be changed.' },
};

/** /login/admin, /login/accountant, /login/auditor — one page per role. */
export default function LoginPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const { session, role: current, loading, signIn } = useAuth();
  const cfg = CONFIG[params.role];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cfg) router.replace('/');
  }, [cfg, router]);

  useEffect(() => {
    if (!loading && session && current) router.replace('/home');
  }, [loading, session, current, router]);

  if (!cfg) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const msg = await signIn(cfg.role, email, password);
    if (msg) {
      setError(msg);
      setBusy(false);
    } else {
      router.replace('/home');
    }
  }

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-6 py-12 font-body">
      <GateBackground />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-rowan-navy hover:text-rowan-red mb-4">
          <ArrowLeft size={14} /> Choose a different login
        </Link>

        <div className="relative bg-white rounded-3xl border border-rowan-red px-8 pt-6 pb-12 shadow-[0_18px_45px_-22px_rgba(230,0,38,0.45)]">
          <div className="flex justify-center">
            <Image src={cfg.img} alt="" width={340} height={285} className="w-44 h-auto" priority />
          </div>
          <h1 className="text-2xl font-semibold text-rowan-navy text-center">{ROLE_LABEL[cfg.role]} login</h1>
          <p className="text-xs text-gray-500 text-center mb-6">{cfg.blurb}</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">Email</label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={cfg.hint}
                className="w-full px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1">Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm"
              />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-rowan-red text-xs font-semibold rounded-lg px-3 py-2">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-br from-[#f01323] to-[#c00a17] text-white py-3 rounded-full text-sm font-bold hover:opacity-90 disabled:opacity-60 transition"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-3 bg-rowan-red rounded-t-full" />
        </div>
      </div>
    </div>
  );
}
