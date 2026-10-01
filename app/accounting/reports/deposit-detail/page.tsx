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
type DepositRow = {
  id: string;
  deposit_number: string;
  deposit_date: string;
  bank_account_id: string;
  memo: string | null;
  total_amount: number;
  status: 'posted' | 'void';
  chart_of_accounts: Acc | Acc[] | null;
  deposit_lines: { line_no: number; received_from: string | null; description: string | null; amount: number; chart_of_accounts: Acc | Acc[] | null }[];
};

type HeadRow = { id: string; number: string; date: string; bank: string; memo: string; lines: number; status: 'posted' | 'void'; amount: number };
type LineRow = {
  key: string;
  number: string;
  date: string;
  bank: string;
  from: string;
  account: string;
  description: string;
  status: 'posted' | 'void';
  amount: number;
};

export default function DepositDetailReport() {
  const p = usePeriod('year');
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('detail');
  const [bank, setBank] = useState('all');
  const [showVoid, setShowVoid] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAll<DepositRow>((from, to) =>
      supabase
        .from('deposits')
        .select(
          'id, deposit_number, deposit_date, bank_account_id, memo, total_amount, status, chart_of_accounts(code, name), deposit_lines(line_no, received_from, description, amount, chart_of_accounts(code, name))'
        )
        .gte('deposit_date', p.start)
        .lte('deposit_date', p.end)
        .order('deposit_date')
        .order('id')
        .range(from, to)
    )
      .then((r) => {
        setRows(r);
        setError(null);
      })
      .catch((e) => {
        setRows([]);
        setError(e?.message ?? 'Failed to load deposits');
      })
      .finally(() => setLoading(false));
  }, [p.start, p.end]);

  const bankName = (r: DepositRow) => {
    const a = one(r.chart_of_accounts);
    return a ? `${a.code} ${a.name}` : '—';
  };

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
    number: r.deposit_number,
    date: r.deposit_date,
    bank: bankName(r),
    memo: r.memo ?? '',
    lines: r.deposit_lines.length,
    status: r.status,
    amount: Number(r.total_amount),
  }));

  const lines: LineRow[] = useMemo(
    () =>
      filtered.flatMap((r) =>
        [...r.deposit_lines]
          .sort((a, b) => a.line_no - b.line_no)
          .map((l) => {
            const acc = one(l.chart_of_accounts);
            return {
              key: `${r.id}-${l.line_no}`,
              number: r.deposit_number,
              date: r.deposit_date,
              bank: bankName(r),
              from: l.received_from ?? '—',
              account: acc ? `${acc.code} ${acc.name}` : '—',
              description: l.description ?? r.memo ?? '',
              status: r.status,
              amount: Number(l.amount),
            };
          })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered]
  );

  const posted = filtered.filter((r) => r.status === 'posted');
  const postedTotal = posted.reduce((s, r) => s + Number(r.total_amount), 0);

  const amt = <T extends { status: 'posted' | 'void'; amount: number }>(r: T) => (r.status === 'void' ? 0 : r.amount);
  const amtCell = <T extends { status: 'posted' | 'void'; amount: number }>(r: T) =>
    r.status === 'void' ? <span className="line-through text-gray-400">{fmt(r.amount)}</span> : fmt(r.amount);
  const statusCell = <T extends { status: 'posted' | 'void' }>(r: T) =>
    r.status === 'void' ? <Chip tone="gray">Void</Chip> : <Chip tone="green">Posted</Chip>;

  const headCols: Col<HeadRow>[] = [
    { label: 'Deposit #', value: (r) => r.number },
    { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
    { label: 'Bank account', value: (r) => r.bank },
    { label: 'Memo', value: (r) => r.memo },
    { label: 'Items', align: 'right', value: (r) => r.lines },
    { label: 'Status', align: 'center', value: (r) => (r.status === 'void' ? 'Void' : 'Posted'), format: statusCell },
    money<HeadRow>('Amount', amt, { format: amtCell }),
  ];

  const lineCols: Col<LineRow>[] = [
    { label: 'Deposit #', value: (r) => r.number },
    { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
    { label: 'Bank account', value: (r) => r.bank },
    { label: 'Received from', value: (r) => r.from },
    { label: 'Account', value: (r) => r.account },
    { label: 'Description', value: (r) => r.description },
    { label: 'Status', align: 'center', value: (r) => (r.status === 'void' ? 'Void' : 'Posted'), format: statusCell },
    money<LineRow>('Amount', amt, { format: amtCell }),
  ];

  // by bank account (posted only)
  const byBank = useMemo(() => {
    const m = new Map<string, number>();
    posted.forEach((r) => m.set(bankName(r), (m.get(bankName(r)) ?? 0) + Number(r.total_amount)));
    return Array.from(m.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  return (
    <ReportFrame
      title="Deposit Detail"
      printTitle={`Deposit Detail ${view === 'summary' ? 'Summary' : 'with Items'}`}
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
              { value: 'detail', label: 'With items' },
              { value: 'summary', label: 'Summary' },
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
          ? { filename: `deposits-${p.start}-to-${p.end}.csv`, rows: tableCsv(headCols, heads) }
          : { filename: `deposit-items-${p.start}-to-${p.end}.csv`, rows: tableCsv(lineCols, lines) }
      }
      notes={<p>Deposits recorded through Make Deposit. Voided deposits appear only when “Show voided” is ticked and never count toward totals.</p>}
    >
      <StatRow
        items={[
          { label: 'Deposits', value: posted.length },
          { label: 'Total deposited', value: fmt(postedTotal) },
          ...byBank.slice(0, 2).map(([name, v]) => ({ label: name, value: fmt(v) })),
        ]}
      />
      {view === 'summary' ? (
        <DataTable cols={headCols} rows={heads} rowKey={(r) => r.id} empty="No deposits in this period" />
      ) : (
        <DataTable cols={lineCols} rows={lines} rowKey={(r) => r.key} empty="No deposits in this period" />
      )}
    </ReportFrame>
  );
}
