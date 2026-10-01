import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';

export type PRPeriod = {
  id: string;
  period_year: number;
  period_month: number;
  label: string;
  status: 'draft' | 'finalized' | 'posted';
};

export type PREntry = {
  id: string;
  period_id: string;
  employee_id: string;
  basic_salary: number;
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
  employees: { employee_no: string; name: string; epf_no: string | null } | { employee_no: string; name: string; epf_no: string | null }[] | null;
  departments: { name: string } | { name: string }[] | null;
};

const monthStart = (p: PRPeriod) => `${p.period_year}-${String(p.period_month).padStart(2, '0')}-01`;

/** Payroll periods whose month falls inside [start, end], with every employee line for them. */
export async function loadPayroll(start: string, end: string, includeDraft: boolean) {
  const { data, error } = await supabase
    .from('payroll_periods')
    .select('id, period_year, period_month, label, status')
    .order('period_year')
    .order('period_month');
  if (error) throw new Error(error.message);

  const periods = ((data ?? []) as PRPeriod[]).filter((p) => {
    const d = monthStart(p);
    return d >= start.slice(0, 7) + '-01' && d <= end && (includeDraft || p.status !== 'draft');
  });
  if (periods.length === 0) return { periods, entries: [] as PREntry[] };

  const ids = periods.map((p) => p.id);
  const entries = await fetchAll<PREntry>((from, to) =>
    supabase
      .from('payroll_entries')
      .select(
        'id, period_id, employee_id, basic_salary, ot_amount, gross_earnings, epf_qualifying_earnings, epf_employee, epf_employer, etf_employer, taxable_earnings, apit_amount, other_deductions_total, net_pay, ctc, employees(employee_no, name, epf_no), departments(name)'
      )
      .in('period_id', ids)
      .order('id')
      .range(from, to)
  );
  return { periods, entries };
}

export const sumBy = <T,>(rows: T[], f: (r: T) => number) => rows.reduce((s, r) => s + Number(f(r) ?? 0), 0);
