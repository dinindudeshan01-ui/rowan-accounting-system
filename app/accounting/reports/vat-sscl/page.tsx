'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';
import {
  Chip,
  DataTable,
  Field,
  ReportFrame,
  SectionHeading,
  StatRow,
  ToggleGroup,
  fmt,
  fmtDate,
  money,
  tableCsv,
  usePeriod,
  type Col,
} from '@/components/ReportKit';

type Inv = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  purchaser_name: string;
  purchaser_tin: string | null;
  subtotal: number;
  vat_amount: number;
  sscl_amount: number;
  total_amount: number;
  status: string;
};

type TaxSettings = {
  vat_registered: boolean;
  vat_rate: number;
  sscl_registered: boolean;
  sscl_rate: number;
  sscl_base_pct: number;
  sscl_threshold: number;
};

type MonthRow = { key: string; label: string; invoices: number; sales: number; taxable: number; vat: number; sscl: number };

export default function VatSsclReport() {
  const p = usePeriod('month');
  const [rows, setRows] = useState<Inv[]>([]);
  const [settings, setSettings] = useState<TaxSettings | null>(null);
  const [turnover, setTurnover] = useState<number | null>(null);
  const [ledgerVat, setLedgerVat] = useState<number | null>(null);
  const [ledgerSscl, setLedgerSscl] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'summary' | 'detail'>('summary');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const invoicesP = fetchAll<Inv>((from, to) =>
      supabase
        .from('invoices')
        .select('id, invoice_number, invoice_date, purchaser_name, purchaser_tin, subtotal, vat_amount, sscl_amount, total_amount, status')
        .in('status', ['issued', 'paid'])
        .gte('invoice_date', p.start)
        .lte('invoice_date', p.end)
        .order('invoice_date')
        .order('id')
        .range(from, to)
    );

    // Ledger side: credits to the VAT Payable / SSCL Payable accounts for the same period
    const ledgerP = (async () => {
      const acc = await supabase.from('chart_of_accounts').select('id, system_role').in('system_role', ['vat_payable', 'sscl_payable']);
      if (acc.error) throw new Error(acc.error.message);
      const ids = (acc.data ?? []).map((a: { id: string }) => a.id);
      if (!ids.length) return { vat: null as number | null, sscl: null as number | null };
      const lines = await fetchAll<{ credit: number; debit: number; account_id: string }>((from, to) =>
        supabase
          .from('journal_lines')
          .select('credit, debit, account_id, journal_entries!inner(entry_date, status)')
          .in('account_id', ids)
          .eq('journal_entries.status', 'posted')
          .gte('journal_entries.entry_date', p.start)
          .lte('journal_entries.entry_date', p.end)
          .order('id')
          .range(from, to)
      );
      const role = new Map<string, string>((acc.data ?? []).map((a: { id: string; system_role: string }) => [a.id, a.system_role]));
      let vat = 0;
      let sscl = 0;
      for (const l of lines) {
        const net = Number(l.credit) - Number(l.debit);
        if (role.get(l.account_id) === 'vat_payable') vat += net;
        else sscl += net;
      }
      return { vat, sscl };
    })();

    const settingsP = Promise.resolve(supabase.from('tax_settings').select('*').limit(1));
    const turnoverP = Promise.resolve(supabase.from('quarterly_turnover').select('turnover').limit(1));

    Promise.allSettled([invoicesP, ledgerP, settingsP, turnoverP]).then(([inv, led, set, tov]) => {
      if (cancelled) return;
      if (inv.status === 'fulfilled') {
        setRows(inv.value);
        setError(null);
      } else {
        setRows([]);
        setError(inv.reason?.message ?? 'Failed to load invoices');
      }
      if (led.status === 'fulfilled') {
        setLedgerVat(led.value.vat);
        setLedgerSscl(led.value.sscl);
      } else {
        setLedgerVat(null);
        setLedgerSscl(null);
      }
      if (set.status === 'fulfilled' && !set.value.error) setSettings(((set.value.data ?? [])[0] as TaxSettings) ?? null);
      if (tov.status === 'fulfilled' && !tov.value.error) {
        const v = (tov.value.data ?? [])[0] as { turnover: number } | undefined;
        setTurnover(v ? Number(v.turnover) : null);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [p.start, p.end]);

  const months: MonthRow[] = useMemo(() => {
    const m = new Map<string, MonthRow>();
    for (const r of rows) {
      const key = r.invoice_date.slice(0, 7);
      const label = new Date(key + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      const e = m.get(key) ?? { key, label, invoices: 0, sales: 0, taxable: 0, vat: 0, sscl: 0 };
      e.invoices += 1;
      e.sales += Number(r.subtotal);
      if (Number(r.vat_amount) > 0) e.taxable += Number(r.subtotal);
      e.vat += Number(r.vat_amount);
      e.sscl += Number(r.sscl_amount);
      m.set(key, e);
    }
    return Array.from(m.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [rows]);

  const sales = rows.reduce((s, r) => s + Number(r.subtotal), 0);
  const vat = rows.reduce((s, r) => s + Number(r.vat_amount), 0);
  const sscl = rows.reduce((s, r) => s + Number(r.sscl_amount), 0);
  const taxable = rows.filter((r) => Number(r.vat_amount) > 0).reduce((s, r) => s + Number(r.subtotal), 0);

  const vatGap = ledgerVat === null ? 0 : vat - ledgerVat;
  const ssclGap = ledgerSscl === null ? 0 : sscl - ledgerSscl;
  const mismatch = Math.abs(vatGap) >= 1 || Math.abs(ssclGap) >= 1;

  const monthCols: Col<MonthRow>[] = [
    { label: 'Month', value: (r) => r.label },
    { label: 'Invoices', align: 'right', value: (r) => r.invoices, sum: true, totalFormat: (n) => n },
    money<MonthRow>('Total sales (net)', (r) => r.sales),
    money<MonthRow>('VAT-able sales', (r) => r.taxable),
    money<MonthRow>('Output VAT', (r) => r.vat, { format: (r) => <b>{fmt(r.vat)}</b> }),
    money<MonthRow>('SSCL', (r) => r.sscl, { format: (r) => <b>{fmt(r.sscl)}</b> }),
  ];

  const detailCols: Col<Inv>[] = [
    { label: 'Date', value: (r) => r.invoice_date, format: (r) => fmtDate(r.invoice_date) },
    { label: 'Invoice #', value: (r) => r.invoice_number },
    { label: 'Customer', value: (r) => r.purchaser_name },
    { label: 'Customer TIN', value: (r) => r.purchaser_tin ?? '' },
    money<Inv>('Value (net)', (r) => Number(r.subtotal)),
    money<Inv>('VAT', (r) => Number(r.vat_amount)),
    money<Inv>('SSCL', (r) => Number(r.sscl_amount)),
    money<Inv>('Invoice total', (r) => Number(r.total_amount)),
  ];

  return (
    <ReportFrame
      title="VAT / SSCL Return"
      printTitle={`VAT / SSCL Return — ${view === 'summary' ? 'Summary' : 'Invoice listing'}`}
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
              { value: 'detail', label: 'Invoice listing' },
            ]}
          />
          {settings && (
            <Field label="Registration">
              <div className="flex gap-1.5 py-1">
                <Chip tone={settings.vat_registered ? 'green' : 'gray'}>VAT {settings.vat_registered ? `${settings.vat_rate}%` : 'not registered'}</Chip>
                <Chip tone={settings.sscl_registered ? 'green' : 'gray'}>SSCL {settings.sscl_registered ? `${settings.sscl_rate}%` : 'not registered'}</Chip>
              </div>
            </Field>
          )}
        </>
      }
      getCsv={() =>
        view === 'summary'
          ? { filename: `vat-sscl-${p.start}-to-${p.end}.csv`, rows: tableCsv(monthCols, months) }
          : { filename: `vat-sscl-invoices-${p.start}-to-${p.end}.csv`, rows: tableCsv(detailCols, rows) }
      }
      notes={
        <>
          <p>
            Output tax is taken from issued and paid invoices dated in the period (VAT and SSCL as charged on each invoice). Voided and draft invoices are
            excluded.
          </p>
          <p className="text-amber-700">
            Input VAT on purchases is not recorded in this system, so nothing is deducted here: VAT payable shown is output tax only. Deduct any input VAT
            credit you are entitled to before filing, and check the figures against your accountant’s working.
          </p>
          {settings && turnover !== null && (
            <p>
              Turnover over the last 3 months: <b>{fmt(turnover)}</b> (SSCL threshold in settings: {fmt(settings.sscl_threshold)}). SSCL is charged on{' '}
              {settings.sscl_base_pct}% of the value at {settings.sscl_rate}%.
            </p>
          )}
        </>
      }
    >
      <StatRow
        items={[
          { label: 'Total sales (net)', value: fmt(sales) },
          { label: 'VAT-able sales', value: fmt(taxable) },
          { label: 'Output VAT', value: fmt(vat), tone: 'navy' },
          { label: 'SSCL', value: fmt(sscl), tone: 'navy' },
        ]}
      />

      {ledgerVat !== null && (
        <div
          className={`mb-5 rounded-lg border px-3.5 py-2.5 text-xs ${
            mismatch ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {mismatch ? (
            <>
              <b>Invoices and the ledger don’t agree for this period.</b> Invoices show VAT {fmt(vat)} and SSCL {fmt(sscl)}; the ledger (VAT Payable / SSCL
              Payable) shows VAT {fmt(ledgerVat)} and SSCL {fmt(ledgerSscl ?? 0)} — a difference of VAT {fmt(vatGap)} and SSCL {fmt(ssclGap)}. This usually
              means an invoice isn’t posted to the ledger, or its posting date differs from its invoice date.
            </>
          ) : (
            <>
              <b>Matches the ledger.</b> VAT {fmt(vat)} and SSCL {fmt(sscl)} agree with the VAT Payable and SSCL Payable accounts for this period.
            </>
          )}
        </div>
      )}

      {view === 'summary' ? (
        <>
          <SectionHeading>By month</SectionHeading>
          <DataTable cols={monthCols} rows={months} rowKey={(r) => r.key} empty="No invoices in this period" />
        </>
      ) : (
        <DataTable cols={detailCols} rows={rows} rowKey={(r) => r.id} empty="No invoices in this period" />
      )}
    </ReportFrame>
  );
}
