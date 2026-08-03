import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Loud in dev/build logs. supabase-js requires a syntactically valid URL
  // even when unused (e.g. during static prerender before .env.local is
  // set), so we fall back to a placeholder instead of throwing at build time.
  console.warn(
    'Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local — using a placeholder client for now, all queries will fail until real values are set.'
  );
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
);
