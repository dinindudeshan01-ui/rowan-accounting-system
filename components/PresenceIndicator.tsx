'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type PresentUser = {
  user_id: string;
  name: string;
  color: string;
  page: string;
  online_at: string;
};

const AVATAR_COLORS = ['#06154b', '#e60026', '#122a7a', '#9e001d', '#1a3a8f', '#c2002a'];

function colorForUser(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Top-right "who's online" indicator, same idea as Google Sheets' avatar
 * stack. Joins a Supabase Realtime Presence channel scoped to `roomName`.
 * Use one shared room (e.g. "accounting-app") for one global indicator
 * across the whole app, or a per-page room to show who's on that exact page.
 */
export function PresenceIndicator({
  roomName,
  currentUser,
  currentPage,
}: {
  roomName: string;
  currentUser: { id: string; name: string };
  currentPage: string;
}) {
  const [users, setUsers] = useState<PresentUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(roomName, {
      config: { presence: { key: currentUser.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresentUser>();
        const all = Object.values(state).flat().filter((u) => u.user_id !== currentUser.id);
        setUsers(all);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            name: currentUser.name,
            color: colorForUser(currentUser.id),
            page: currentPage,
            online_at: new Date().toISOString(),
          } as PresentUser);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, currentUser.id, currentUser.name, currentPage]);

  if (users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-1 bg-white/90 backdrop-blur border border-gray-200 rounded-full pl-1 pr-3 py-1 shadow-sm">
      <div className="flex -space-x-2">
        {visible.map((u) => (
          <div key={u.user_id} className="relative group">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
              style={{ backgroundColor: u.color }}
            >
              {initials(u.name)}
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
            <div className="absolute top-9 right-0 hidden group-hover:block whitespace-nowrap bg-rowan-navy text-white text-[10px] px-2 py-1 rounded shadow-lg">
              {u.name} · {u.page}
            </div>
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-7 h-7 rounded-full bg-gray-300 text-rowan-navy text-[10px] font-bold flex items-center justify-center border-2 border-white">
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-rowan-navy uppercase tracking-wide">
        {users.length} live
      </span>
    </div>
  );
}
