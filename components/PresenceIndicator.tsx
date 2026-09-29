'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
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
 *
 * The app shell (top bar) renders the one live indicator with `inline`.
 * Instances rendered by individual pages (no `inline`) are inert: joining
 * the same room twice makes supabase-js throw "cannot add presence
 * callbacks ... after subscribe()" and crashes the page.
 */
export function PresenceIndicator({
  roomName,
  currentUser,
  currentPage,
  inline = false,
}: {
  roomName: string;
  currentUser: { id: string; name: string };
  currentPage: string;
  /** True only for the single instance in the app shell's top bar. */
  inline?: boolean;
}) {
  const [users, setUsers] = useState<PresentUser[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  const payload = () =>
    ({
      user_id: currentUser.id,
      name: currentUser.name,
      color: colorForUser(currentUser.id),
      page: pageRef.current,
      online_at: new Date().toISOString(),
    }) as PresentUser;

  // Join the room once. Page changes only re-track (below) — rebuilding
  // a same-named channel on every navigation is what caused the crash.
  useEffect(() => {
    if (!inline) return;
    const channel = supabase.channel(roomName, {
      config: { presence: { key: currentUser.id } },
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresentUser>();
        const all = Object.values(state).flat().filter((u) => u.user_id !== currentUser.id);
        setUsers(all);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          readyRef.current = true;
          await channel.track(payload());
        }
      });

    return () => {
      readyRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline, roomName, currentUser.id, currentUser.name]);

  // Tell others which page we're on without touching the channel.
  useEffect(() => {
    if (inline && readyRef.current && channelRef.current) {
      channelRef.current.track(payload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  if (!inline || users.length === 0) return null;

  const visible = users.slice(0, 4);
  const overflow = users.length - visible.length;

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full pl-1 pr-3 py-1">
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
            <div className="absolute top-9 right-0 z-50 hidden group-hover:block whitespace-nowrap bg-rowan-navy text-white text-[10px] px-2 py-1 rounded shadow-lg">
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
