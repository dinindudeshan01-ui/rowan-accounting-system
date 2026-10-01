'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  StatRow,
  ToggleGroup,
  fmt,
  fmtDate,
  money,
  one,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type Acc = { code: string; name: string };
type CheckRow = {
  id: string;
  check_number: string;
  check_date: string;
  bank_account_id: string;
  payee_type: 'vendor' | 'customer' | 'other';
  payee_name: string | null;
  memo: string | null;
  total_amount: number;
  status: 'posted' | 'void';
  chart_of_accounts: Acc | Acc[] | null;
  vendors: { display_name: string } | { display_name: string }[] | null;
  customers: { display_name: string } | { display_name: string }[] | null;
  check_lines: { line_no: number; description: string | null; amount: number; chart_of_accounts: Acc | Acc[] | null }[];
};

type Flat = {
  key: string;
  number: string;
  date: string;
  payee: string;
  bank: string;
  status: 'posted' | 'void';
  account: string;
  description: string;
  amount: number;
};

type HeadRow = { id: string; number: string; date: string; payee: string; bank: string; memo: string; status: 'posted' | 'void'; amount: number };

export default function CheckDetailReport() {
  const p = usePeriod('year');
  const [rows, setRows] = useState<CheckRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  const [bank, setBank] = useState('all');
  const [showVoid, setShowVoid] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAll<CheckRow>((from, to) =>
      supabase
        .from('checks')
        .select(
          'id, check_number, check_date, bank_account_id, payee_type, payee_name, memo, total_amount, status, chart_of_accounts(code, name), vendors(display_name), customers(display_name), check_lines(line_no, description, amount, chart_of_accounts(code, name))'
        )
        .gte('check_date', p.start)
        .lte('check_date', p.end)
        .order('check_date')
        .order('id')
        .range(from, to)
    )
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => {
        setRows([]);
        setError(e?.message ?? 'Failed to load checks');
      })
      .finally(() => setLoading(false));
  }, [p.start, p.end]);

  const bankName = (r: CheckRow) => {
    const a = one(r.chart_of_accounts);
    return a ? `${a.code} ${a.name}` : '—';
  };
  const payeeName = (r: CheckRow) =>
    (r.payee_type === 'vendor' ? one(r.vendors)?.display_name : r.payee_type === 'customer' ? one(r.customers)?.display_name : r.payee_name) ?? '—';

  const banks = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.bank_account_id, bankName(r)));
    return Array.from(m.entries());
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => (showVoid || r.status === 'posted') && (bank === 'all' || r.bank_account_id === bank)),
    [rows, showVoid, bank]
  );

  const heads: HeadRow[] = filtered.map((r) => ({
    id: r.id,
    number: r.check_number,
    date: r.check_date,
    payee: payeeName(r),
    bank: bankName(r),
    memo: r.memo ?? '',
    status: r.status,
    amount: Number(r.total_amount),
  }));

  const flat: Flat[] = useMemo(
    () =>
      filtered.flatMap((r) =>
        [...r.check_lines]
          .sort((a, b) => a.line_no - b.line_no)
          .map((l) => {
            const acc = one(l.chart_of_accounts);
            return {
              key: `${r.id}-${l.line_no}`,
              number: r.check_number,
              date: r.check_date,
              payee: payeeName(r),
              bank: bankName(r),
              status: r.status,
              account: acc ? `${acc.code} ${acc.name}` : '—',
              description: l.description ?? r.memo ?? '',
              amount: Number(l.amount),
            };
          })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered]
  );

  const posted = filtered.filter((r) => r.status === 'posted');
  const postedTotal = posted.reduce((s, r) => s + Number(r.total_amount), 0);
  const voidCount = filtered.filter((r) => r.status === 'void').length;

  // Voided checks are listed (if shown) but never counted in totals.
  const amt = <T extends { status: 'posted' | 'void'; amount: number }>(r: T) => (r.status === 'void' ? 0 : r.amount);
  const amtCell = <T extends { status: 'posted' | 'void'; amount: number }>(r: T) =>
    r.status === 'void' ? <span className="line-through text-gray-400">{fmt(r.amount)}</span> : fmt(r.amount);
  const statusCell = <T extends { status: 'posted' | 'void' }>(r: T) =>
    r.status === 'void' ? <Chip tone="gray">Void</Chip> : <Chip tone="green">Posted</Chip>;

  const headCols: Col<HeadRow>[] = [
    { label: 'Check #', value: (r) => r.number },
    { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
    { label: 'Payee', value: (r) => r.payee },
    { label: 'Bank account', value: (r) => r.bank },
    { label: 'Memo', value: (r) => r.memo },
    { label: 'Status', align: 'center', value: (r) => (r.status === 'void' ? 'Void' : 'Posted'), format: statusCell },
    money<HeadRow>('Amount', amt, { format: amtCell }),
  ];

  const lineCols: Col<Flat>[] = [
    { label: 'Check #', value: (r) => r.number },
    { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
    { label: 'Payee', value: (r) => r.payee },
    { label: 'Expense account', value: (r) => r.account },
    { label: 'Description', value: (r) => r.description },
    { label: 'Status', align: 'center', value: (r) => (r.status === 'void' ? 'Void' : 'Posted'), format: statusCell },
    money<Flat>('Amount', amt, { format: amtCell }),
  ];

  return (
    <ReportFrame
      title="Check Detail"
      printTitle={`Check Detail ${view === 'summary' ? 'Summary' : 'with Expense Lines'}`}
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
              { value: 'summary', label: 'Summary' },
              { value: 'detail', label: 'With lines' },
            ]}
          />
          <Field label="Bank account">
            <select value={bank} onChange={(e) => setBank(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[150px]">
              <option value="all">All accounts</option>
              {banks.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 pb-2">
            <input type="checkbox" checked={showVoid} onChange={(e) => setShowVoid(e.target.checked)} />
            Show voided
          </label>
        </>
      }
      getCsv={() =>
        view === 'summary'
          ? { filename: `checks-${p.start}-to-${p.end}.csv`, rows: tableCsv(headCols, heads) }
          : { filename: `check-lines-${p.start}-to-${p.end}.csv`, rows: tableCsv(lineCols, flat) }
      }
      notes={<p>Voided checks are listed only when “Show voided” is ticked and are never counted in the totals.</p>}
    >
      <StatRow
        items={[
          { label: 'Checks written', value: posted.length },
          { label: 'Total paid', value: fmt(postedTotal) },
          { label: 'Voided', value: voidCount },
          { label: 'Bank accounts', value: new Set(posted.map((r) => r.bank_account_id)).size },
        ]}
      />
      {view === 'summary' ? (
        <DataTable cols={headCols} rows={heads} rowKey={(r) => r.id} empty="No checks in this period" />
      ) : (
        <DataTable cols={lineCols} rows={flat} rowKey={(r) => r.key} empty="No checks in this period" />
      )}
    </ReportFrame>
  );
}
