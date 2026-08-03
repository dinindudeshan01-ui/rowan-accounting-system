import { supabase } from '@/lib/supabase';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type Account = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export type AccountDraft = {
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  description: string | null;
  is_active: boolean;
};

export const TYPE_LABEL: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
};

export const TYPE_ORDER: AccountType[] = ['asset', 'liability', 'equity', 'revenue', 'expense'];

// Assets & expenses carry a normal debit balance; liabilities, equity and
// revenue carry a normal credit balance. Used to sign ledger balances and
// to know which side of an opening-balance entry an account's own line
// should land on.
export function normalSide(type: AccountType): 'debit' | 'credit' {
  return type === 'asset' || type === 'expense' ? 'debit' : 'credit';
}

export async function listAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('chart_of_accounts').select('*').order('code');
  if (error) throw error;
  return data as Account[];
}

export async function createAccount(draft: AccountDraft): Promise<Account> {
  const { data, error } = await supabase.from('chart_of_accounts').insert(draft).select().single();
  if (error) throw error;
  return data as Account;
}

export async function updateAccount(id: string, patch: Partial<AccountDraft>): Promise<Account> {
  const { data, error } = await supabase.from('chart_of_accounts').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Account;
}

export function suggestNextCode(accounts: Account[], type: AccountType): string {
  const bases: Record<AccountType, number> = {
    asset: 1000,
    liability: 2000,
    equity: 3000,
    revenue: 4000,
    expense: 5000,
  };
  const base = bases[type];
  const used = new Set(accounts.map((a) => a.code));
  for (let c = base + 1; c < base + 1000; c++) {
    const code = String(c).padStart(4, '0');
    if (!used.has(code)) return code;
  }
  return '';
}

export type LedgerRow = {
  id: string;
  entry_id: string;
  entry_date: string;
  entry_number: string;
  memo: string | null;
  status: 'draft' | 'posted' | 'void';
  description: string | null;
  debit: number;
  credit: number;
};

export async function fetchAccountLedger(accountId: string): Promise<LedgerRow[]> {
  const { data, error } = await supabase
    .from('journal_lines')
    .select('id, entry_id, debit, credit, description, journal_entries!inner(entry_date, entry_number, memo, status)')
    .eq('account_id', accountId);
  if (error) throw error;
  const rows: LedgerRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    entry_id: r.entry_id,
    debit: Number(r.debit) || 0,
    credit: Number(r.credit) || 0,
    description: r.description,
    entry_date: r.journal_entries.entry_date,
    entry_number: r.journal_entries.entry_number,
    memo: r.journal_entries.memo,
    status: r.journal_entries.status,
  }));
  rows.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  return rows;
}

const OPENING_BALANCE_EQUITY_NAME = 'Opening Balance Equity';

/**
 * Finds (or creates, if this is the very first opening balance ever
 * entered) the equity account used as the automatic offsetting leg for
 * "Add Balance" entries. Returns the account and, if one had to be
 * created, the updated account list so callers can refresh local state.
 */
export async function ensureOpeningBalanceEquityAccount(
  accounts: Account[]
): Promise<{ account: Account; created: boolean }> {
  const existing = accounts.find((a) => a.name === OPENING_BALANCE_EQUITY_NAME && a.type === 'equity');
  if (existing) return { account: existing, created: false };

  const code = suggestNextCode(accounts, 'equity');
  const created = await createAccount({
    code,
    name: OPENING_BALANCE_EQUITY_NAME,
    type: 'equity',
    subtype: 'Equity',
    description: 'Auto-generated offset account used by "Add Balance" entries to keep the ledger balanced.',
    is_active: true,
  });
  return { account: created, created: true };
}

/**
 * Posts a balance onto an account as a fully balanced, posted journal
 * entry: one line on the target account (on its normal side), and one
 * automatically generated offsetting line on the Opening Balance Equity
 * account. Mirrors the draft -> insert lines -> post pattern used by the
 * manual Journal Entry screen so the existing balance-check trigger runs.
 */
export async function postAccountBalance(params: {
  account: Account;
  offsetAccountId: string;
  amount: number;
  date: string;
  memo: string;
  createdByName: string;
}): Promise<{ entryNumber: string }> {
  const { account, offsetAccountId, amount, date, memo, createdByName } = params;
  if (!(amount > 0)) throw new Error('Enter an amount greater than zero.');

  const side = normalSide(account.type);

  const { data: entry, error: entryErr } = await supabase
    .from('journal_entries')
    .insert({
      entry_date: date,
      memo,
      status: 'draft',
      source_type: 'opening_balance',
      created_by_name: createdByName,
    })
    .select()
    .single();
  if (entryErr) throw entryErr;

  const lineRows = [
    {
      entry_id: entry.id,
      line_no: 1,
      account_id: account.id,
      debit: side === 'debit' ? amount : 0,
      credit: side === 'credit' ? amount : 0,
      description: memo,
    },
    {
      entry_id: entry.id,
      line_no: 2,
      account_id: offsetAccountId,
      debit: side === 'credit' ? amount : 0,
      credit: side === 'debit' ? amount : 0,
      description: memo,
    },
  ];

  const { error: linesErr } = await supabase.from('journal_lines').insert(lineRows);
  if (linesErr) throw linesErr;

  const { error: postErr } = await supabase.from('journal_entries').update({ status: 'posted' }).eq('id', entry.id);
  if (postErr) throw postErr;

  return { entryNumber: entry.entry_number };
}
