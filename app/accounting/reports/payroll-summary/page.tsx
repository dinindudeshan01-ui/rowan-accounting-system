'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { loadPayroll, sumBy, type PREntry, type PRPeriod } from '@/lib/payrollReport';
import {
  Chip,
  DataTable,
  ReportFrame,
  StatRow,
  ToggleGroup,
  fmt,
  money,
  one,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type PeriodRow = {
  id: string;
  label: string;
  status: PRPeriod['status'];
  employees: number;
  gross: number;
  epfEe: number;
  apit: number;
  other: number;
  net: number;
  epfEr: number;
  etf: number;
  ctc: number;
};
type EmpRow = { key: string; no: string; name: string; dept: string; months: number; gross: number; epfEe: number; apit: number; other: number; net: number; ctc: number };
type DeptRow = { dept: string; employees: number; gross: number; net: number; ctc: number };

const statusChip = (s: PRPeriod['status']) =>
  s === 'posted' ? <Chip tone="green">Posted</Chip> : s === 'finalized' ? <Chip tone="blue">Finalized</Chip> : <Chip tone="amber">Draft</Chip>;

export default function PayrollSummaryReport() {
  const p = usePeriod('year');
  const [periods, setPeriods] = useState<PRPeriod[]>([]);
  const [entries, setEntries] = useState<PREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'period' | 'employee' | 'department'>('period');
  const [includeDraft, setIncludeDraft] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadPayroll(p.start, p.end, includeDraft)
      .then((r) => {
        setPeriods(r.periods);
        setEntries(r.entries);
        setError(null);
      })
      .catch((e) => {
        setPeriods([]);
        setEntries([]);
        setError(e?.message ?? 'Failed to load payroll');
      })
      .finally(() => setLoading(false));
  }, [p.start, p.end, includeDraft]);

  const byPeriod: PeriodRow[] = useMemo(
    () =>
      periods.map((per) => {
        const es = entries.filter((e) => e.period_id === per.id);
        return {
          id: per.id,
          label: per.label,
          status: per.status,
          employees: es.length,
          gross: sumBy(es, (e) => e.gross_earnings),
          epfEe: sumBy(es, (e) => e.epf_employee),
          apit: sumBy(es, (e) => e.apit_amount),
          other: sumBy(es, (e) => e.other_deductions_total),
          net: sumBy(es, (e) => e.net_pay),
          epfEr: sumBy(es, (e) => e.epf_employer),
          etf: sumBy(es, (e) => e.etf_employer),
          ctc: sumBy(es, (e) => e.ctc),
        };
      }),
    [periods, entries]
  );

  const byEmployee: EmpRow[] = useMemo(() => {
    const m = new Map<string, EmpRow>();
    for (const e of entries) {
      const emp = one(e.employees);
      const row = m.get(e.employee_id) ?? {
        key: e.employee_id,
        no: emp?.employee_no ?? '',
        name: emp?.name ?? 'Unknown',
        dept: one(e.departments)?.name ?? '—',
        months: 0,
        gross: 0,
        epfEe: 0,
        apit: 0,
        other: 0,
        net: 0,
        ctc: 0,
      };
      row.months += 1;
      row.gross += Number(e.gross_earnings);
      row.epfEe += Number(e.epf_employee);
      row.apit += Number(e.apit_amount);
      row.other += Number(e.other_deductions_total);
      row.net += Number(e.net_pay);
      row.ctc += Number(e.ctc);
      m.set(e.employee_id, row);
    }
    return Array.from(m.values()).sort((a, b) => a.no.localeCompare(b.no));
  }, [entries]);

  const byDept: DeptRow[] = useMemo(() => {
    const m = new Map<string, { dept: string; emps: Set<string>; gross: number; net: number; ctc: number }>();
    for (const e of entries) {
      const dept = one(e.departments)?.name ?? 'No department';
      const r = m.get(dept) ?? { dept, emps: new Set<string>(), gross: 0, net: 0, ctc: 0 };
      r.emps.add(e.employee_id);
      r.gross += Number(e.gross_earnings);
      r.net += Number(e.net_pay);
      r.ctc += Number(e.ctc);
      m.set(dept, r);
    }
    return Array.from(m.values())
      .map((r) => ({ dept: r.dept, employees: r.emps.size, gross: r.gross, net: r.net, ctc: r.ctc }))
      .sort((a, b) => b.ctc - a.ctc);
  }, [entries]);

  const periodCols: Col<PeriodRow>[] = [
    { label: 'Period', value: (r) => r.label },
    { label: 'Status', align: 'center', value: (r) => r.status, format: (r) => statusChip(r.status) },
    { label: 'Staff', align: 'right', value: (r) => r.employees },
    money<PeriodRow>('Gross earnings', (r) => r.gross),
    money<PeriodRow>('EPF (8%)', (r) => r.epfEe),
    money<PeriodRow>('APIT', (r) => r.apit),
    money<PeriodRow>('Other ded.', (r) => r.other),
    money<PeriodRow>('Net pay', (r) => r.net, { format: (r) => <b>{fmt(r.net)}</b> }),
    money<PeriodRow>('EPF employer', (r) => r.epfEr),
    money<PeriodRow>('ETF', (r) => r.etf),
    money<PeriodRow>('Total cost (CTC)', (r) => r.ctc),
  ];

  const empCols: Col<EmpRow>[] = [
    { label: 'Emp #', value: (r) => r.no },
    { label: 'Name', value: (r) => r.name },
    { label: 'Department', value: (r) => r.dept },
    { label: 'Months', align: 'right', value: (r) => r.months },
    money<EmpRow>('Gross earnings', (r) => r.gross),
    money<EmpRow>('EPF (8%)', (r) => r.epfEe),
    money<EmpRow>('APIT', (r) => r.apit),
    money<EmpRow>('Other ded.', (r) => r.other),
    money<EmpRow>('Net pay', (r) => r.net, { format: (r) => <b>{fmt(r.net)}</b> }),
    money<EmpRow>('Total cost (CTC)', (r) => r.ctc),
  ];

  const deptCols: Col<DeptRow>[] = [
    { label: 'Department', value: (r) => r.dept },
    { label: 'Employees', align: 'right', value: (r) => r.employees },
    money<DeptRow>('Gross earnings', (r) => r.gross),
    money<DeptRow>('Net pay', (r) => r.net),
    money<DeptRow>('Total cost (CTC)', (r) => r.ctc, { format: (r) => <b>{fmt(r.ctc)}</b> }),
  ];

  const gross = sumBy(entries, (e) => e.gross_earnings);
  const net = sumBy(entries, (e) => e.net_pay);
  const ctc = sumBy(entries, (e) => e.ctc);

  return (
    <ReportFrame
      title="Payroll Summary"
      printTitle={`Payroll Summary — by ${view}`}
      periodText={p.label}
      loading={loading}
      error={error}
      maxWidth="max-w-6xl"
      controls={
        <>
          {p.controls}
          <ToggleGroup
            value={view}
            onChange={setView}
            options={[
              { value: 'period', label: 'By period' },
              { value: 'employee', label: 'By employee' },
              { value: 'department', label: 'By department' },
            ]}
          />
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2">
            <input type="checkbox" checked={includeDraft} onChange={(e) => setIncludeDraft(e.target.checked)} />
            Include drafts
          </label>
        </>
      }
      getCsv={() =>
        view === 'period'
          ? { filename: `payroll-by-period-${p.start}-to-${p.end}.csv`, rows: tableCsv(periodCols, byPeriod) }
          : view === 'employee'
            ? { filename: `payroll-by-employee-${p.start}-to-${p.end}.csv`, rows: tableCsv(empCols, byEmployee) }
            : { filename: `payroll-by-department-${p.start}-to-${p.end}.csv`, rows: tableCsv(deptCols, byDept) }
      }
      notes={
        <p>
          Finalized and posted payroll only (tick “Include drafts” to add periods still being prepared). Total cost (CTC) = gross earnings + employer EPF +
          ETF.
        </p>
      }
    >
      <StatRow
        items={[
          { label: 'Pay periods', value: periods.length },
          { label: 'Gross earnings', value: fmt(gross) },
          { label: 'Net pay', value: fmt(net) },
          { label: 'Total cost (CTC)', value: fmt(ctc) },
        ]}
      />
      {view === 'period' ? (
        <DataTable cols={periodCols} rows={byPeriod} rowKey={(r) => r.id} empty="No payroll runs in this period" />
      ) : view === 'employee' ? (
        <DataTable cols={empCols} rows={byEmployee} rowKey={(r) => r.key} empty="No payroll runs in this period" />
      ) : (
        <DataTable cols={deptCols} rows={byDept} rowKey={(r) => r.dept} empty="No payroll runs in this period" />
      )}
    </ReportFrame>
  );
}
