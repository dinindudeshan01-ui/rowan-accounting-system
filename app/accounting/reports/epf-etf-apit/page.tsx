'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { loadPayroll, sumBy, type PREntry, type PRPeriod } from '@/lib/payrollReport';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  StatRow,
  ToggleGroup,
  fmt,
  fmtDate,
  isoDate,
  money,
  one,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type MonthRow = {
  id: string;
  label: string;
  status: PRPeriod['status'];
  staff: number;
  qualifying: number;
  epfEe: number;
  epfEr: number;
  epfTotal: number;
  etf: number;
  apit: number;
  total: number;
  epfDue: string;
  apitDue: string;
};

type EmpRow = { id: string; epfNo: string; no: string; name: string; qualifying: number; ee: number; er: number; total: number; etf: number; apit: number };

const statusChip = (s: PRPeriod['status']) =>
  s === 'posted' ? <Chip tone="green">Posted</Chip> : s === 'finalized' ? <Chip tone="blue">Finalized</Chip> : <Chip tone="amber">Draft</Chip>;

export default function EpfEtfApitReport() {
  const p = usePeriod('year');
  const [periods, setPeriods] = useState<PRPeriod[]>([]);
  const [entries, setEntries] = useState<PREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'employee'>('month');
  const [includeDraft, setIncludeDraft] = useState(false);
  const [periodId, setPeriodId] = useState('');

  useEffect(() => {
    setLoading(true);
    loadPayroll(p.start, p.end, includeDraft)
      .then((r) => {
        setPeriods(r.periods);
        setEntries(r.entries);
        setPeriodId((cur) => (r.periods.some((x) => x.id === cur) ? cur : (r.periods[r.periods.length - 1]?.id ?? '')));
        setError(null);
      })
      .catch((e) => {
        setPeriods([]);
        setEntries([]);
        setError(e?.message ?? 'Failed to load payroll');
      })
      .finally(() => setLoading(false));
  }, [p.start, p.end, includeDraft]);

  const months: MonthRow[] = useMemo(
    () =>
      periods.map((per) => {
        const es = entries.filter((e) => e.period_id === per.id);
        const epfEe = sumBy(es, (e) => e.epf_employee);
        const epfEr = sumBy(es, (e) => e.epf_employer);
        const etf = sumBy(es, (e) => e.etf_employer);
        const apit = sumBy(es, (e) => e.apit_amount);
        // statutory payments fall due in the month after the salary month
        const lastOfNext = new Date(per.period_year, per.period_month + 1, 0);
        const fifteenthNext = new Date(per.period_year, per.period_month, 15);
        return {
          id: per.id,
          label: per.label,
          status: per.status,
          staff: es.length,
          qualifying: sumBy(es, (e) => e.epf_qualifying_earnings),
          epfEe,
          epfEr,
          epfTotal: epfEe + epfEr,
          etf,
          apit,
          total: epfEe + epfEr + etf + apit,
          epfDue: isoDate(lastOfNext),
          apitDue: isoDate(fifteenthNext),
        };
      }),
    [periods, entries]
  );

  const employees: EmpRow[] = useMemo(
    () =>
      entries
        .filter((e) => e.period_id === periodId)
        .map((e) => {
          const emp = one(e.employees);
          return {
            id: e.id,
            epfNo: emp?.epf_no ?? '',
            no: emp?.employee_no ?? '',
            name: emp?.name ?? 'Unknown',
            qualifying: Number(e.epf_qualifying_earnings),
            ee: Number(e.epf_employee),
            er: Number(e.epf_employer),
            total: Number(e.epf_employee) + Number(e.epf_employer),
            etf: Number(e.etf_employer),
            apit: Number(e.apit_amount),
          };
        })
        .sort((a, b) => a.no.localeCompare(b.no)),
    [entries, periodId]
  );

  const period = periods.find((x) => x.id === periodId);

  const monthCols: Col<MonthRow>[] = [
    { label: 'Salary month', value: (r) => r.label },
    { label: 'Status', align: 'center', value: (r) => r.status, format: (r) => statusChip(r.status) },
    { label: 'Staff', align: 'right', value: (r) => r.staff },
    money<MonthRow>('EPF qualifying earnings', (r) => r.qualifying),
    money<MonthRow>('EPF employee (8%)', (r) => r.epfEe),
    money<MonthRow>('EPF employer (12%)', (r) => r.epfEr),
    money<MonthRow>('Total EPF (20%)', (r) => r.epfTotal, { format: (r) => <b>{fmt(r.epfTotal)}</b> }),
    money<MonthRow>('ETF (3%)', (r) => r.etf),
    money<MonthRow>('APIT', (r) => r.apit),
    money<MonthRow>('Total statutory', (r) => r.total, { format: (r) => <b>{fmt(r.total)}</b> }),
    { label: 'EPF / ETF due', value: (r) => r.epfDue, format: (r) => fmtDate(r.epfDue), hideInPrint: false },
    { label: 'APIT due', value: (r) => r.apitDue, format: (r) => fmtDate(r.apitDue) },
  ];

  const empCols: Col<EmpRow>[] = [
    { label: 'EPF no.', value: (r) => r.epfNo || '—' },
    { label: 'Emp #', value: (r) => r.no },
    { label: 'Name', value: (r) => r.name },
    money<EmpRow>('Qualifying earnings', (r) => r.qualifying),
    money<EmpRow>('Employee 8%', (r) => r.ee),
    money<EmpRow>('Employer 12%', (r) => r.er),
    money<EmpRow>('Total EPF', (r) => r.total, { format: (r) => <b>{fmt(r.total)}</b> }),
    money<EmpRow>('ETF 3%', (r) => r.etf),
    money<EmpRow>('APIT', (r) => r.apit),
  ];

  const epf = sumBy(months, (m) => m.epfTotal);
  const etf = sumBy(months, (m) => m.etf);
  const apit = sumBy(months, (m) => m.apit);

  return (
    <ReportFrame
      title="EPF / ETF / APIT Liability"
      printTitle={view === 'month' ? 'EPF / ETF / APIT Liability — by month' : `EPF / ETF / APIT Schedule — ${period?.label ?? ''}`}
      periodText={view === 'month' ? p.label : (period?.label ?? '')}
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
              { value: 'month', label: 'By month' },
              { value: 'employee', label: 'Employee schedule' },
            ]}
          />
          {view === 'employee' && (
            <Field label="Salary month">
              <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[160px]">
                {periods.length === 0 && <option value="">No payroll</option>}
                {periods.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2">
            <input type="checkbox" checked={includeDraft} onChange={(e) => setIncludeDraft(e.target.checked)} />
            Include drafts
          </label>
        </>
      }
      getCsv={() =>
        view === 'month'
          ? { filename: `epf-etf-apit-${p.start}-to-${p.end}.csv`, rows: tableCsv(monthCols, months) }
          : { filename: `epf-etf-apit-schedule-${period?.label ?? 'period'}.csv`, rows: tableCsv(empCols, employees) }
      }
      notes={
        <>
          <p>
            Amounts come straight from finalized / posted payroll runs. EPF = 8% employee + 12% employer on EPF-qualifying earnings; ETF = 3% employer;
            APIT is the income tax withheld from employees.
          </p>
          <p>
            Due dates shown (EPF / ETF: end of the following month; APIT: 15th of the following month) are typical deadlines — please confirm against the
            current CBSL, ETF Board and Inland Revenue requirements. This report shows what has accrued; it does not track whether a payment has been made.
          </p>
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Months covered', value: months.length },
          { label: 'Total EPF (20%)', value: fmt(epf) },
          { label: 'Total ETF (3%)', value: fmt(etf) },
          { label: 'Total APIT', value: fmt(apit) },
        ]}
      />
      {view === 'month' ? (
        <DataTable cols={monthCols} rows={months} rowKey={(r) => r.id} empty="No payroll runs in this period" />
      ) : (
        <DataTable cols={empCols} rows={employees} rowKey={(r) => r.id} empty="No payroll for this month" />
      )}
    </ReportFrame>
  );
}
