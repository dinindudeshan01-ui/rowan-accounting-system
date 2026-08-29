import { supabase } from '@/lib/supabase';
import { Account } from '@/lib/accounts';

// ---------- bank account helpers ----------

export async function listBankAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .eq('is_active', true)
    .eq('is_bank_account', true)
    .order('code');
  if (error) throw error;
  return data as Account[];
}

export async function setBankAccountFlag(accountId: string, isBank: boolean) {
  const { error } = await supabase.from('chart_of_accounts').update({ is_bank_account: isBank }).eq('id', accountId);
  if (error) throw error;
}

// ============================================================
// 1. WRITE CHECKS
// ============================================================
export type CheckLineDraft = { account_id: string; description: string | null; amount: number };
export type PayeeType = 'vendor' | 'customer' | 'other';

export type CheckRow = {
  id: string;
  check_number: string;
  check_date: string;
  bank_account_id: string;
  payee_type: PayeeType;
  payee_vendor_id: string | null;
  payee_customer_id: string | null;
  payee_name: string | null;
  memo: string | null;
  print_later: boolean;
  total_amount: number;
  status: 'posted' | 'void';
  vendors?: { display_name: string } | null;
  customers?: { display_name: string } | null;
  chart_of_accounts?: { name: string } | null;
};

export async function nextCheckNumberPreview(): Promise<string | null> {
  const { data } = await supabase.rpc('next_check_number_preview');
  return typeof data === 'string' ? data : null;
}

export async function writeCheck(params: {
  checkDate: string;
  bankAccountId: string;
  checkNumber: string | null;
  payeeType: PayeeType;
  payeeVendorId: string | null;
  payeeCustomerId: string | null;
  payeeName: string | null;
  memo: string | null;
  printLater: boolean;
  createdByName: string;
  lines: CheckLineDraft[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('write_check', {
    p_check_date: params.checkDate,
    p_bank_account_id: params.bankAccountId,
    p_check_number: params.checkNumber,
    p_payee_type: params.payeeType,
    p_payee_vendor_id: params.payeeVendorId,
    p_payee_customer_id: params.payeeCustomerId,
    p_payee_name: params.payeeName,
    p_memo: params.memo,
    p_print_later: params.printLater,
    p_created_by_name: params.createdByName,
    p_lines: params.lines,
  });
  if (error) throw error;
  return data as string;
}

export async function voidCheck(checkId: string) {
  const { error } = await supabase.rpc('void_check', { p_check_id: checkId });
  if (error) throw error;
}

export type CheckLineForPrint = { line_no: number; description: string | null; amount: number; account: { code: string; name: string } | null };

export type CheckForPrint = {
  id: string;
  check_number: string;
  check_date: string;
  memo: string | null;
  total_amount: number;
  status: 'posted' | 'void';
  payee_type: PayeeType;
  payee_name: string | null;
  bank_account: { code: string; name: string } | null;
  vendor: { display_name: string; address?: string | null; city?: string | null } | null;
  customer: { display_name: string; address?: string | null; city?: string | null } | null;
  lines: CheckLineForPrint[];
};

export async function getCheckForPrint(checkId: string): Promise<CheckForPrint> {
  const { data: check, error } = await supabase
    .from('checks')
    .select(
      'id, check_number, check_date, memo, total_amount, status, payee_type, payee_name, chart_of_accounts(code, name), vendors(display_name, address, city), customers(display_name, address, city)'
    )
    .eq('id', checkId)
    .single();
  if (error) throw error;
  const { data: lines, error: linesError } = await supabase
    .from('check_lines')
    .select('line_no, description, amount, chart_of_accounts(code, name)')
    .eq('check_id', checkId)
    .order('line_no');
  if (linesError) throw linesError;

  const c: any = check;
  return {
    id: c.id,
    check_number: c.check_number,
    check_date: c.check_date,
    memo: c.memo,
    total_amount: c.total_amount,
    status: c.status,
    payee_type: c.payee_type,
    payee_name: c.payee_name,
    bank_account: c.chart_of_accounts ?? null,
    vendor: c.vendors ?? null,
    customer: c.customers ?? null,
    lines: ((lines as any[]) ?? []).map((l) => ({
      line_no: l.line_no,
      description: l.description,
      amount: l.amount,
      account: l.chart_of_accounts ?? null,
    })),
  };
}

export async function listRecentChecks(limit = 25): Promise<CheckRow[]> {
  const { data, error } = await supabase
    .from('checks')
    .select(
      'id, check_number, check_date, bank_account_id, payee_type, payee_vendor_id, payee_customer_id, payee_name, memo, print_later, total_amount, status, vendors(display_name), customers(display_name), chart_of_accounts(name)'
    )
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as any) ?? [];
}

// ============================================================
// 2. MAKE DEPOSITS
// ============================================================
export type DepositLineDraft = { account_id: string; received_from: string | null; description: string | null; amount: number };

export type DepositRow = {
  id: string;
  deposit_number: string;
  deposit_date: string;
  bank_account_id: string;
  memo: string | null;
  total_amount: number;
  status: 'posted' | 'void';
  chart_of_accounts?: { name: string } | null;
};

export async function nextDepositNumberPreview(): Promise<string | null> {
  const { data } = await supabase.rpc('next_deposit_number_preview');
  return typeof data === 'string' ? data : null;
}

export async function makeDeposit(params: {
  depositDate: string;
  bankAccountId: string;
  memo: string | null;
  createdByName: string;
  lines: DepositLineDraft[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('make_deposit', {
    p_deposit_date: params.depositDate,
    p_bank_account_id: params.bankAccountId,
    p_memo: params.memo,
    p_created_by_name: params.createdByName,
    p_lines: params.lines,
  });
  if (error) throw error;
  return data as string;
}

export async function voidDeposit(depositId: string) {
  const { error } = await supabase.rpc('void_deposit', { p_deposit_id: depositId });
  if (error) throw error;
}

export async function listRecentDeposits(limit = 25): Promise<DepositRow[]> {
  const { data, error } = await supabase
    .from('deposits')
    .select('id, deposit_number, deposit_date, bank_account_id, memo, total_amount, status, chart_of_accounts(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as any) ?? [];
}

// ============================================================
// 3. PAY BILLS
// ============================================================
export type OpenBill = {
  id: string;
  expense_number: string;
  expense_date: string;
  total_amount: number;
  amount_paid: number;
};

export async function listOpenBills(vendorId: string): Promise<OpenBill[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, expense_number, expense_date, total_amount, amount_paid')
    .eq('vendor_id', vendorId)
    .eq('payment_type', 'bill')
    .eq('status', 'posted')
    .order('expense_date');
  if (error) throw error;
  return ((data as OpenBill[]) ?? []).filter((b) => b.total_amount - b.amount_paid > 0.01);
}

export type BillAllocation = { expense_id: string; amount: number };

export async function payBills(params: {
  vendorId: string;
  paymentDate: string;
  amount: number;
  bankAccountId: string;
  reference: string | null;
  memo: string | null;
  createdByName: string;
  allocations: BillAllocation[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('pay_bills', {
    p_vendor_id: params.vendorId,
    p_payment_date: params.paymentDate,
    p_amount: params.amount,
    p_bank_account_id: params.bankAccountId,
    p_reference: params.reference,
    p_memo: params.memo,
    p_created_by_name: params.createdByName,
    p_allocations: params.allocations,
  });
  if (error) throw error;
  return data as string;
}

export async function voidBillPayment(billPaymentId: string) {
  const { error } = await supabase.rpc('void_bill_payment', { p_bill_payment_id: billPaymentId });
  if (error) throw error;
}

export type BillPaymentRow = {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  status: 'posted' | 'void';
  vendors?: { display_name: string } | null;
};

export async function listRecentBillPayments(limit = 25): Promise<BillPaymentRow[]> {
  const { data, error } = await supabase
    .from('bill_payments')
    .select('id, payment_number, payment_date, amount, status, vendors(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as any) ?? [];
}

// ============================================================
// 4. BANK RECONCILIATION
// ============================================================
export type UnclearedLine = {
  line_id: string;
  entry_date: string;
  entry_number: string;
  description: string | null;
  debit: number;
  credit: number;
};

export async function fetchUnclearedLines(bankAccountId: string, asOf: string): Promise<UnclearedLine[]> {
  const { data, error } = await supabase.rpc('uncleared_bank_lines', { p_bank_account_id: bankAccountId, p_as_of: asOf });
  if (error) throw error;
  return (data as UnclearedLine[]) ?? [];
}

export async function completeReconciliation(params: {
  bankAccountId: string;
  statementDate: string;
  beginningBalance: number;
  endingBalance: number;
  clearedLineIds: string[];
  createdByName: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('complete_reconciliation', {
    p_bank_account_id: params.bankAccountId,
    p_statement_date: params.statementDate,
    p_beginning_balance: params.beginningBalance,
    p_ending_balance: params.endingBalance,
    p_cleared_line_ids: params.clearedLineIds,
    p_created_by_name: params.createdByName,
  });
  if (error) throw error;
  return data as string;
}

export async function reopenReconciliation(reconciliationId: string) {
  const { error } = await supabase.rpc('reopen_reconciliation', { p_reconciliation_id: reconciliationId });
  if (error) throw error;
}

export type ReconciliationRow = {
  id: string;
  bank_account_id: string;
  statement_date: string;
  beginning_balance: number;
  statement_ending_balance: number;
  cleared_balance: number;
  status: 'completed' | 'reopened';
  chart_of_accounts?: { name: string } | null;
};

export async function listRecentReconciliations(limit = 25): Promise<ReconciliationRow[]> {
  const { data, error } = await supabase
    .from('bank_reconciliations')
    .select('id, bank_account_id, statement_date, beginning_balance, statement_ending_balance, cleared_balance, status, chart_of_accounts(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as any) ?? [];
}
