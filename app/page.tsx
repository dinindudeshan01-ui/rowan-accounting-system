'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { GateBackground } from '@/components/GateBackground';
import { useAuth } from '@/components/AuthProvider';

const ROLES = [
  { key: 'admin', label: 'Admin', img: '/gate/admin.png' },
  { key: 'accountant', label: 'Accountant', img: '/gate/accountant.png' },
  { key: 'auditor', label: 'Auditors', img: '/gate/auditor.png' },
] as const;

/** Main gate: choose how to sign in. Already signed in? Straight to the app. */
export default function Gate() {
  const router = useRouter();
  const { session, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && session && role) router.replace('/home');
  }, [loading, session, role, router]);

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-6 py-16 font-body">
      <GateBackground />
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 w-full max-w-5xl">
        {ROLES.map((r) => (
          <Link
            key={r.key}
            href={`/login/${r.key}`}
            className="group relative flex flex-col items-center bg-white rounded-3xl border border-rowan-red px-6 pt-8 pb-14 shadow-[0_18px_45px_-22px_rgba(230,0,38,0.45)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_26px_55px_-20px_rgba(230,0,38,0.55)]"
          >
            <Image src={r.img} alt="" width={340} height={285} className="w-56 h-auto" priority />
            <h2 className="mt-3 text-3xl font-semibold text-rowan-navy">{r.label}</h2>
            <span className="mt-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#f01323] to-[#c00a17] text-white flex items-center justify-center shadow-md transition group-hover:translate-x-1">
              <ArrowRight size={28} />
            </span>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-3 bg-rowan-red rounded-t-full" />
          </Link>
        ))}
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-gray-400 z-10">
        Rowan Casual Wear (Pvt) Ltd
      </p>
    </div>
  );
}
