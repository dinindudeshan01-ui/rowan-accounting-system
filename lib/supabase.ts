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

// ---- Read-only guard -------------------------------------------------
// Auditors can view everything but not change anything. The database
// enforces this too (sql/044); this layer stops the request before it is
// sent and returns a clear message that pages show as a normal error.
let clientRole: string | null = null;
export function setClientRole(role: string | null) {
  clientRole = role;
}

// RPCs that only read (reports, number previews) stay allowed for auditors.
const READ_ONLY_RPCS = new Set([
  'get_pl', 'get_balance_sheet', 'get_trial_balance', 'get_transaction_journal',
  'get_sales_by_item', 'get_sales_by_customer', 'get_general_ledger',
  'get_ar_aging', 'get_ap_aging', 'uncleared_bank_lines',
]);

function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (clientRole === 'auditor') {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    const isData = url.includes('/rest/v1/') || url.includes('/storage/v1/');
    if (isData && method !== 'GET' && method !== 'HEAD') {
      const rpc = url.match(/\/rest\/v1\/rpc\/([a-z0-9_]+)/)?.[1];
      const allowed = !!rpc && (READ_ONLY_RPCS.has(rpc) || rpc.endsWith('_preview'));
      if (!allowed) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ message: 'Read-only account: Auditors can view everything but cannot make changes.', code: 'READ_ONLY' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
    }
  }
  return fetch(input, init);
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  { global: { fetch: guardedFetch } }
);
