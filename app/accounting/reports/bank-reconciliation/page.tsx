'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import { listBankAccounts, type ReconciliationRow, type UnclearedLine } from '@/lib/bank';
import type { Account } from '@/lib/accounts';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  SectionHeading,
  StatRow,
  fmt,
  fmtDate,
  money,
  one,
  tableCsv,
  type Col,
} from '@/components/ReportKit';

type ClearedLine = {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  journal_entries: { entry_date: string; entry_number: string; memo: string | null } | { entry_date: string; entry_number: string; memo: string | null }[] | null;
};

type Flat = { id: string; date: string; number: string; description: string; deposit: number; payment: number };

const toFlat = (r: ClearedLine): Flat => {
  const je = one(r.journal_entries);
  return {
    id: r.id,
    date: je?.entry_date ?? '',
    number: je?.entry_number ?? '',
    description: r.description ?? je?.memo ?? '',
    deposit: Number(r.debit),
    payment: Number(r.credit),
  };
};

const lineCols: Col<Flat>[] = [
  { label: 'Date', value: (r) => r.date, format: (r) => fmtDate(r.date) },
  { label: 'Entry #', value: (r) => r.number },
  { label: 'Description', value: (r) => r.description },
  money<Flat>('Deposits & credits', (r) => r.deposit, { format: (r) => (r.deposit ? fmt(r.deposit) : '') }),
  money<Flat>('Checks & payments', (r) => r.payment, { format: (r) => (r.payment ? fmt(r.payment) : '') }),
];

export default function BankReconciliationReport() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [recons, setRecons] = useState<ReconciliationRow[]>([]);
  const [reconId, setReconId] = useState('');
  const [cleared, setCleared] = useState<Flat[]>([]);
  const [uncleared, setUncleared] = useState<UncleredLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type UncleredLike = UnclearedLine;

  // 1) bank accounts
  useEffect(() => {
    listBankAccounts()
      .then((a) => {
        setAccounts(a);
        if (a[0]) setAccountId(a[0].id);
        else setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load bank accounts');
        setLoading(false);
      });
  }, []);

  // 2) reconciliations for the chosen account
  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    supabase
      .from('bank_reconciliations')
      .select('id, bank_account_id, statement_date, beginning_balance, statement_ending_balance, cleared_balance, status')
      .eq('bank_account_id', accountId)
      .order('statement_date', { ascending: false })
      .then((res) => {
        if (res.error) {
          setError(res.error.message);
          setRecons([]);
          setReconId('');
          setLoading(false);
          return;
        }
        const list = (res.data ?? []) as ReconciliationRow[];
        setError(null);
        setRecons(list);
        setReconId(list[0]?.id ?? '');
        if (!list.length) setLoading(false);
      });
  }, [accountId]);

  const recon = useMemo(() => recons.find((r) => r.id === reconId) ?? null, [recons, reconId]);

  // 3) cleared + still-uncleared lines for the chosen reconciliation
  useEffect(() => {
    if (!recon) {
      setCleared([]);
      setUncleared([]);
      return;
    }
    setLoading(true);
    Promise.all([
      fetchAll<ClearedLine>((from, to) =>
        supabase
          .from('journal_lines')
          .select('id, debit, credit, description, journal_entries(entry_date, entry_number, memo)')
          .eq('reconciliation_id', recon.id)
          .order('id')
          .range(from, to)
      ),
      Promise.resolve(supabase.rpc('uncleared_bank_lines', { p_bank_account_id: recon.bank_account_id, p_as_of: recon.statement_date })),
    ])
      .then(([lines, unc]) => {
        setCleared(lines.map(toFlat).sort((a, b) => a.date.localeCompare(b.date)));
        setUncleared((unc.data ?? []) as UncleredLike[]);
        setError(unc.error ? unc.error.message : null);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load reconciliation detail'))
      .finally(() => setLoading(false));
  }, [recon]);

  const acct = accounts.find((a) => a.id === accountId);
  const depositsCleared = cleared.reduce((s, r) => s + r.deposit, 0);
  const paymentsCleared = cleared.reduce((s, r) => s + r.payment, 0);
  const begin = Number(recon?.beginning_balance ?? 0);
  const ending = Number(recon?.statement_ending_balance ?? 0);
  const clearedBalance = begin + depositsCleared - paymentsCleared;
  const difference = ending - clearedBalance;

  const inTransit = uncleared.reduce((s, r) => s + Number(r.debit), 0);
  const outstanding = uncleared.reduce((s, r) => s + Number(r.credit), 0);
  const reopened = recon?.status === 'reopened';

  const unclearedFlat: Flat[] = uncleared.map((r) => ({
    id: r.line_id,
    date: r.entry_date,
    number: r.entry_number,
    description: r.description ?? '',
    deposit: Number(r.debit),
    payment: Number(r.credit),
  }));

  const historyCols: Col<ReconciliationRow>[] = [
    { label: 'Statement date', value: (r) => r.statement_date, format: (r) => fmtDate(r.statement_date) },
    { label: 'Status', align: 'center', value: (r) => r.status, format: (r) => (r.status === 'reopened' ? <Chip tone="amber">Reopened</Chip> : <Chip tone="green">Completed</Chip>) },
    money<ReconciliationRow>('Beginning balance', (r) => Number(r.beginning_balance), { sum: false }),
    money<ReconciliationRow>('Cleared balance', (r) => Number(r.cleared_balance), { sum: false }),
    money<ReconciliationRow>('Statement ending', (r) => Number(r.statement_ending_balance), { sum: false }),
    money<ReconciliationRow>('Difference', (r) => Number(r.statement_ending_balance) - Number(r.cleared_balance), {
      sum: false,
      format: (r) => {
        const d = Number(r.statement_ending_balance) - Number(r.cleared_balance);
        return <span className={Math.abs(d) < 0.005 ? 'text-green-700 font-bold' : 'text-rowan-red font-bold'}>{fmt(d)}</span>;
      },
    }),
  ];

  const csv = () => {
    if (!recon) return null;
    return {
      filename: `bank-reconciliation-${acct?.code ?? 'account'}-${recon.statement_date}.csv`,
      rows: [
        ['Bank account', `${acct?.code ?? ''} ${acct?.name ?? ''}`],
        ['Statement date', recon.statement_date],
        ['Beginning balance', begin],
        ['Deposits & credits cleared', depositsCleared],
        ['Checks & payments cleared', paymentsCleared],
        ['Cleared balance', clearedBalance],
        ['Statement ending balance', ending],
        ['Difference', difference],
        [],
        ['CLEARED ITEMS'],
        ...tableCsv(lineCols, cleared),
        [],
        ['NOT YET CLEARED AT STATEMENT DATE'],
        ...tableCsv(lineCols, unclearedFlat),
      ] as (string | number | null | undefined)[][],
    };
  };

  return (
    <ReportFrame
      title="Bank Reconciliation Report"
      periodText={recon ? `${acct?.code ?? ''} ${acct?.name ?? ''} — statement ${fmtDate(recon.statement_date)}` : 'No reconciliation selected'}
      loading={loading}
      error={error}
      getCsv={csv}
      maxWidth="max-w-6xl"
      controls={
        <>
          <Field label="Bank account">
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[180px]">
              {accounts.length === 0 && <option value="">No bank accounts</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} {a.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reconciliation">
            <select value={reconId} onChange={(e) => setReconId(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm min-w-[200px]">
              {recons.length === 0 && <option value="">None yet</option>}
              {recons.map((r) => (
                <option key={r.id} value={r.id}>
                  {fmtDate(r.statement_date)}
                  {r.status === 'reopened' ? ' (reopened)' : ''}
                </option>
              ))}
            </select>
          </Field>
        </>
      }
      notes={
        <>
          <p>
            Cleared balance = beginning balance + deposits & credits cleared − checks & payments cleared. The difference should be 0.00 when the books
            agree with the bank statement.
          </p>
          <p>“Not yet cleared” lists items posted on or before the statement date that the bank statement hadn’t shown at the time.</p>
        </>
      }
    >
      {!recon ? (
        <p className="text-sm text-gray-400 italic py-8 text-center">
          {accounts.length === 0
            ? 'No bank accounts are set up. Mark an account as a bank account in the Chart of Accounts.'
            : 'No reconciliations have been completed for this account yet. Use Reconcile to start one.'}
        </p>
      ) : (
        <>
          {reopened && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded mb-4">
              This reconciliation was reopened, so its cleared items were released and are not listed below. The figures shown are those recorded when it
              was completed.
            </div>
          )}
          <StatRow
            items={[
              { label: 'Beginning balance', value: fmt(begin) },
              { label: reopened ? 'Cleared balance (recorded)' : 'Cleared balance', value: fmt(reopened ? Number(recon.cleared_balance) : clearedBalance) },
              { label: 'Statement ending balance', value: fmt(ending) },
              {
                label: 'Difference',
                value: fmt(reopened ? ending - Number(recon.cleared_balance) : difference),
                tone: Math.abs(reopened ? ending - Number(recon.cleared_balance) : difference) < 0.005 ? 'green' : 'red',
              },
            ]}
          />

          {!reopened && (
            <>
              <SectionHeading>Cleared in this reconciliation</SectionHeading>
              <DataTable cols={lineCols} rows={cleared} rowKey={(r) => r.id} empty="No cleared items" />
            </>
          )}

          <SectionHeading>Not yet cleared at {fmtDate(recon.statement_date)}</SectionHeading>
          <DataTable cols={lineCols} rows={unclearedFlat} rowKey={(r) => r.id} empty="Everything posted by this date had cleared" />
          {unclearedFlat.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Deposits in transit {fmt(inTransit)} · Outstanding checks & payments {fmt(outstanding)} · Adjusted bank balance{' '}
              <b className="text-rowan-navy">{fmt(ending + inTransit - outstanding)}</b>
            </p>
          )}
        </>
      )}

      {recons.length > 0 && (
        <>
          <SectionHeading>All reconciliations for this account</SectionHeading>
          <DataTable cols={historyCols} rows={recons} rowKey={(r) => r.id} showTotals={false} />
        </>
      )}
    </ReportFrame>
  );
}
