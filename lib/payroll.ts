import { supabase } from '@/lib/supabase';

// ============================================================
// Types — mirror sql/024_payroll.sql exactly.
// ============================================================

export type Department = {
  id: string;
  name: string;
  default_wage_account_id: string | null;
  is_active: boolean;
};

export type Employee = {
  id: string;
  employee_no: string;
  name: string;
  department_id: string | null;
  designation: string | null;
  basic_salary: number;
  epf_no: string | null;
  join_date: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
};

export type AllowanceType = {
  id: string;
  name: string;
  is_epf_qualifying: boolean;
  is_taxable: boolean;
  is_active: boolean;
};

export type DeductionType = {
  id: string;
  name: string;
  is_statutory: boolean;
  account_id: string | null;
  is_active: boolean;
};

export type EmployeeAllowance = { id: string; employee_id: string; allowance_type_id: string; amount: number; is_active: boolean };
export type EmployeeDeduction = { id: string; employee_id: string; deduction_type_id: string; amount: number; is_active: boolean };

export type PayrollSettings = {
  id: number;
  epf_employee_pct: number;
  epf_employer_pct: number;
  etf_employer_pct: number;
  apit_enabled: boolean;
  standard_working_days: number;
  ot_multiplier: number;
};

export type ApitSlab = {
  id: string;
  effective_from: string;
  band_from: number;
  band_to: number | null;
  rate_pct: number;
  sort_order: number;
};

export type PayrollPeriod = {
  id: string;
  period_year: number;
  period_month: number;
  label: string;
  status: 'draft' | 'finalized' | 'posted';
  posted_entry_id: string | null;
};

export type PayrollEntry = {
  id: string;
  period_id: string;
  employee_id: string;
  department_id: string | null;
  basic_salary: number;
  no_pay_days: number;
  ot_hours: number;
  ot_amount: number;
  gross_earnings: number;
  epf_qualifying_earnings: number;
  epf_employee: number;
  epf_employer: number;
  etf_employer: number;
  taxable_earnings: number;
  apit_amount: number;
  other_deductions_total: number;
  net_pay: number;
  ctc: number;
};

export type PayrollEntryLine = {
  id: string;
  payroll_entry_id: string;
  line_type: 'allowance' | 'deduction';
  name: string;
  amount: number;
  is_epf_qualifying: boolean;
  is_taxable: boolean;
  account_id: string | null;
};

// ============================================================
// Departments
// ============================================================
export async function listDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data as Department[];
}
export async function createDepartment(d: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase.from('departments').insert(d).select().single();
  if (error) throw error;
  return data as Department;
}
export async function updateDepartment(id: string, patch: Partial<Department>): Promise<Department> {
  const { data, error } = await supabase.from('departments').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Department;
}

// ============================================================
// Employees
// ============================================================
export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*').order('name');
  if (error) throw error;
  return data as Employee[];
}
export async function createEmployee(e: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').insert(e).select().single();
  if (error) throw error;
  return data as Employee;
}
export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  const { data, error } = await supabase.from('employees').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as Employee;
}

// ============================================================
// Allowance / deduction types
// ============================================================
export async function listAllowanceTypes(): Promise<AllowanceType[]> {
  const { data, error } = await supabase.from('allowance_types').select('*').order('name');
  if (error) throw error;
  return data as AllowanceType[];
}
export async function createAllowanceType(a: Partial<AllowanceType>): Promise<AllowanceType> {
  const { data, error } = await supabase.from('allowance_types').insert(a).select().single();
  if (error) throw error;
  return data as AllowanceType;
}
export async function updateAllowanceType(id: string, patch: Partial<AllowanceType>): Promise<AllowanceType> {
  const { data, error } = await supabase.from('allowance_types').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as AllowanceType;
}

export async function listDeductionTypes(): Promise<DeductionType[]> {
  const { data, error } = await supabase.from('deduction_types').select('*').order('name');
  if (error) throw error;
  return data as DeductionType[];
}
export async function createDeductionType(d: Partial<DeductionType>): Promise<DeductionType> {
  const { data, error } = await supabase.from('deduction_types').insert(d).select().single();
  if (error) throw error;
  return data as DeductionType;
}
export async function updateDeductionType(id: string, patch: Partial<DeductionType>): Promise<DeductionType> {
  const { data, error } = await supabase.from('deduction_types').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as DeductionType;
}

// ============================================================
// Employee recurring allowance/deduction lines
// ============================================================
export async function listEmployeeAllowances(employeeId: string): Promise<EmployeeAllowance[]> {
  const { data, error } = await supabase.from('employee_allowances').select('*').eq('employee_id', employeeId);
  if (error) throw error;
  return data as EmployeeAllowance[];
}
export async function upsertEmployeeAllowance(row: Partial<EmployeeAllowance> & { employee_id: string; allowance_type_id: string }) {
  const { data, error } = await supabase
    .from('employee_allowances')
    .upsert(row, { onConflict: 'employee_id,allowance_type_id' })
    .select()
    .single();
  if (error) throw error;
  return data as EmployeeAllowance;
}
export async function listEmployeeDeductions(employeeId: string): Promise<EmployeeDeduction[]> {
  const { data, error } = await supabase.from('employee_deductions').select('*').eq('employee_id', employeeId);
  if (error) throw error;
  return data as EmployeeDeduction[];
}
export async function upsertEmployeeDeduction(row: Partial<EmployeeDeduction> & { employee_id: string; deduction_type_id: string }) {
  const { data, error } = await supabase
    .from('employee_deductions')
    .upsert(row, { onConflict: 'employee_id,deduction_type_id' })
    .select()
    .single();
  if (error) throw error;
  return data as EmployeeDeduction;
}

// ============================================================
// Payroll settings (singleton) + APIT slabs
// ============================================================
export async function getPayrollSettings(): Promise<PayrollSettings> {
  const { data, error } = await supabase.from('payroll_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data as PayrollSettings;
}
export async function updatePayrollSettings(patch: Partial<PayrollSettings>): Promise<PayrollSettings> {
  const { data, error } = await supabase.from('payroll_settings').update(patch).eq('id', 1).select().single();
  if (error) throw error;
  return data as PayrollSettings;
}

export async function listApitSlabs(): Promise<ApitSlab[]> {
  const { data, error } = await supabase.from('apit_tax_slabs').select('*').order('effective_from', { ascending: false }).order('sort_order');
  if (error) throw error;
  return data as ApitSlab[];
}
export async function createApitSlab(s: Partial<ApitSlab>): Promise<ApitSlab> {
  const { data, error } = await supabase.from('apit_tax_slabs').insert(s).select().single();
  if (error) throw error;
  return data as ApitSlab;
}
export async function deleteApitSlab(id: string): Promise<void> {
  const { error } = await supabase.from('apit_tax_slabs').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Payroll periods / entries / lines + the calculation RPCs
// ============================================================
export async function listPayrollPeriods(): Promise<PayrollPeriod[]> {
  const { data, error } = await supabase
    .from('payroll_periods')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false });
  if (error) throw error;
  return data as PayrollPeriod[];
}
export async function createPayrollPeriod(year: number, month: number, label: string): Promise<PayrollPeriod> {
  const { data, error } = await supabase.from('payroll_periods').insert({ period_year: year, period_month: month, label }).select().single();
  if (error) throw error;
  return data as PayrollPeriod;
}

export async function listPayrollEntries(periodId: string): Promise<(PayrollEntry & { employees: { name: string; employee_no: string } | null; departments: { name: string } | null })[]> {
  const { data, error } = await supabase
    .from('payroll_entries')
    .select('*, employees(name, employee_no), departments(name)')
    .eq('period_id', periodId)
    .order('created_at');
  if (error) throw error;
  return data as any;
}
export async function listPayrollEntryLines(entryId: string): Promise<PayrollEntryLine[]> {
  const { data, error } = await supabase.from('payroll_entry_lines').select('*').eq('payroll_entry_id', entryId);
  if (error) throw error;
  return data as PayrollEntryLine[];
}

export async function runPayrollPeriod(periodId: string): Promise<number> {
  const { data, error } = await supabase.rpc('run_payroll_period', { p_period_id: periodId });
  if (error) throw error;
  return data as number;
}
export async function updatePayrollEntry(id: string, patch: { no_pay_days?: number; ot_hours?: number }): Promise<void> {
  const { error } = await supabase.from('payroll_entries').update(patch).eq('id', id);
  if (error) throw error;
}
export async function recomputePayrollEntry(entryId: string): Promise<void> {
  const { error } = await supabase.rpc('recompute_payroll_entry', { p_entry_id: entryId });
  if (error) throw error;
}
export async function addPayrollEntryLine(line: Partial<PayrollEntryLine> & { payroll_entry_id: string }): Promise<void> {
  const { error } = await supabase.from('payroll_entry_lines').insert(line);
  if (error) throw error;
  await recomputePayrollEntry(line.payroll_entry_id);
}
export async function removePayrollEntryLine(id: string, entryId: string): Promise<void> {
  const { error } = await supabase.from('payroll_entry_lines').delete().eq('id', id);
  if (error) throw error;
  await recomputePayrollEntry(entryId);
}
export async function finalizePayrollPeriod(periodId: string): Promise<void> {
  const { error } = await supabase.rpc('finalize_payroll_period', { p_period_id: periodId });
  if (error) throw error;
}
export async function reopenPayrollPeriod(periodId: string): Promise<void> {
  const { error } = await supabase.rpc('reopen_payroll_period', { p_period_id: periodId });
  if (error) throw error;
}
export async function postPayrollPeriod(periodId: string, createdByName: string): Promise<string> {
  const { data, error } = await supabase.rpc('post_payroll_period', { p_period_id: periodId, p_created_by_name: createdByName });
  if (error) throw error;
  return data as string;
}

export function fmt(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
