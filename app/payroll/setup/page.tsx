'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RowanWordmark, BrandRibbon } from '@/components/RowanMark';
import { PresenceIndicator } from '@/components/PresenceIndicator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect, SelectOption } from '@/components/SearchableSelect';
import {
  Department, Employee, AllowanceType, DeductionType, PayrollSettings, ApitSlab,
  listDepartments, createDepartment, updateDepartment,
  listEmployees, createEmployee, updateEmployee,
  listAllowanceTypes, createAllowanceType, updateAllowanceType,
  listDeductionTypes, createDeductionType, updateDeductionType,
  listEmployeeAllowances, upsertEmployeeAllowance,
  listEmployeeDeductions, upsertEmployeeDeduction,
  getPayrollSettings, updatePayrollSettings,
  listApitSlabs, createApitSlab, deleteApitSlab,
  fmt,
} from '@/lib/payroll';

const currentUser = { id: 'demo-user', name: 'Dinindu' };

type Account = { id: string; code: string; name: string; type: string };
type Tab = 'settings' | 'departments' | 'employees' | 'allowances' | 'deductions' | 'apit';

const TABS: { key: Tab; label: string }[] = [
  { key: 'settings', label: 'Rates & Settings' },
  { key: 'apit', label: 'APIT Tax Table' },
  { key: 'departments', label: 'Departments' },
  { key: 'employees', label: 'Employees' },
  { key: 'allowances', label: 'Allowance Types' },
  { key: 'deductions', label: 'Deduction Types' },
];

export default function PayrollSetupPage() {
  const [tab, setTab] = useState<Tab>('settings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [apitSlabs, setApitSlabs] = useState<ApitSlab[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const [d, e, at, dt, s, slabs, acc] = await Promise.all([
        listDepartments(), listEmployees(), listAllowanceTypes(), listDeductionTypes(),
        getPayrollSettings(), listApitSlabs(),
        supabase.from('chart_of_accounts').select('id, code, name, type').eq('is_active', true).order('code'),
      ]);
      setDepartments(d); setEmployees(e); setAllowanceTypes(at); setDeductionTypes(dt);
      setSettings(s); setApitSlabs(slabs);
      setAccounts((acc.data as Account[]) ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load payroll setup.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function flash(msg: string) {
    setNote(msg);
    setTimeout(() => setNote(null), 2500);
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <PresenceIndicator roomName="accounting-app" currentUser={currentUser} currentPage="Payroll Setup" />
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <BrandRibbon />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Dashboard</Link>
              <div className="flex items-center gap-2 mt-1"><RowanWordmark /></div>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold uppercase tracking-widest text-rowan-navy">Payroll Setup</h2>
              <Link href="/payroll/run" className="text-[10px] font-bold text-gray-400 hover:text-rowan-red">Go to Payroll Run →</Link>
            </div>
          </div>

          {note && <div className="mb-4 bg-green-50 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">{note}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-300 text-rowan-red text-sm px-4 py-2 rounded">{error}</div>}

          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-xs font-bold uppercase tracking-wide whitespace-nowrap border-b-2 -mb-px transition ${
                  tab === t.key ? 'border-rowan-red text-rowan-navy' : 'border-transparent text-gray-400 hover:text-rowan-navy'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'settings' && (
            <SettingsTab settings={settings} onSaved={(s) => { setSettings(s); flash('Settings saved.'); }} onError={setError} />
          )}
          {tab === 'apit' && (
            <ApitTab slabs={apitSlabs} onReload={async () => setApitSlabs(await listApitSlabs())} onError={setError} onNote={flash} />
          )}
          {tab === 'departments' && (
            <DepartmentsTab departments={departments} accounts={accounts} onReload={async () => setDepartments(await listDepartments())} onError={setError} onNote={flash} />
          )}
          {tab === 'employees' && (
            <EmployeesTab
              employees={employees}
              departments={departments}
              allowanceTypes={allowanceTypes}
              deductionTypes={deductionTypes}
              onReload={async () => setEmployees(await listEmployees())}
              onError={setError}
              onNote={flash}
            />
          )}
          {tab === 'allowances' && (
            <AllowanceTypesTab types={allowanceTypes} onReload={async () => setAllowanceTypes(await listAllowanceTypes())} onError={setError} onNote={flash} />
          )}
          {tab === 'deductions' && (
            <DeductionTypesTab types={deductionTypes} accounts={accounts} onReload={async () => setDeductionTypes(await listDeductionTypes())} onError={setError} onNote={flash} />
          )}
        </div>
        <BrandRibbon />
      </div>
    </div>
  );
}

// ============================================================
// Rates & Settings
// ============================================================
function SettingsTab({ settings, onSaved, onError }: { settings: PayrollSettings; onSaved: (s: PayrollSettings) => void; onError: (e: string) => void }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const updated = await updatePayrollSettings({
        epf_employee_pct: form.epf_employee_pct,
        epf_employer_pct: form.epf_employer_pct,
        etf_employer_pct: form.etf_employer_pct,
        apit_enabled: form.apit_enabled,
        standard_working_days: form.standard_working_days,
        ot_multiplier: form.ot_multiplier,
      });
      onSaved(updated);
    } catch (e: any) {
      onError(e.message ?? 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number" step="0.01" value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-300 rounded px-2 py-1.5"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-rowan-bg rounded-lg p-4 border border-gray-200">
        <p className="text-xs text-gray-500 mb-4">
          These rates drive every payslip calculation. Edit them here the moment the IRD changes a
          rate — nothing is hardcoded in the app.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="EPF — Employee %" value={form.epf_employee_pct} onChange={(v) => setForm({ ...form, epf_employee_pct: v })} suffix="%" />
          <Field label="EPF — Employer %" value={form.epf_employer_pct} onChange={(v) => setForm({ ...form, epf_employer_pct: v })} suffix="%" />
          <Field label="ETF — Employer %" value={form.etf_employer_pct} onChange={(v) => setForm({ ...form, etf_employer_pct: v })} suffix="%" />
          <Field label="Standard Working Days / Month" value={form.standard_working_days} onChange={(v) => setForm({ ...form, standard_working_days: v })} />
          <Field label="OT Multiplier" value={form.ot_multiplier} onChange={(v) => setForm({ ...form, ot_multiplier: v })} suffix="×" />
        </div>
      </div>

      <div className="bg-rowan-bg rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-rowan-navy">APIT Withholding</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Toggle tax deduction on/off at any time. When off, every payslip's APIT is 0 regardless
              of the tax table below — no need to delete slabs.
            </p>
          </div>
          <button
            onClick={() => setForm({ ...form, apit_enabled: !form.apit_enabled })}
            className={`relative w-12 h-6 rounded-full transition ${form.apit_enabled ? 'bg-rowan-navy' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${form.apit_enabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <button
        disabled={saving} onClick={save}
        className="px-6 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving && <LoadingSpinner size="sm" />}
        Save Settings
      </button>
    </div>
  );
}

// ============================================================
// APIT Tax Table
// ============================================================
function ApitTab({ slabs, onReload, onError, onNote }: { slabs: ApitSlab[]; onReload: () => Promise<void>; onError: (e: string) => void; onNote: (m: string) => void }) {
  const versions = useMemo(() => Array.from(new Set(slabs.map((s) => s.effective_from))).sort().reverse(), [slabs]);
  const [showNew, setShowNew] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [rows, setRows] = useState([{ band_from: '0', band_to: '', rate_pct: '0' }]);
  const [saving, setSaving] = useState(false);

  function addRow() {
    setRows((r) => [...r, { band_from: '', band_to: '', rate_pct: '' }]);
  }

  async function saveVersion() {
    if (!newDate) return onError('Set an effective date for this tax table version.');
    setSaving(true);
    try {
      let i = 1;
      for (const r of rows) {
        await createApitSlab({
          effective_from: newDate,
          band_from: parseFloat(r.band_from) || 0,
          band_to: r.band_to === '' ? null : parseFloat(r.band_to),
          rate_pct: parseFloat(r.rate_pct) || 0,
          sort_order: i++,
        });
      }
      setShowNew(false);
      setNewDate('');
      setRows([{ band_from: '0', band_to: '', rate_pct: '0' }]);
      await onReload();
      onNote('New APIT tax table version saved.');
    } catch (e: any) {
      onError(e.message ?? 'Failed to save tax table.');
    } finally {
      setSaving(false);
    }
  }

  async function removeVersion(effectiveFrom: string) {
    if (!confirm(`Delete the entire ${effectiveFrom} tax table version?`)) return;
    try {
      for (const s of slabs.filter((s) => s.effective_from === effectiveFrom)) await deleteApitSlab(s.id);
      await onReload();
      onNote('Version deleted.');
    } catch (e: any) {
      onError(e.message ?? 'Failed to delete.');
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Every payslip looks up the version that was effective on that period's date, so past payslips
        never recalculate against a newer table. Add a new version whenever the IRD updates the bands
        — don't edit an old one.
      </p>

      {versions.map((v) => (
        <div key={v} className="mb-5 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-rowan-bg px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-rowan-navy">Effective from {new Date(v).toLocaleDateString()}</span>
            <button onClick={() => removeVersion(v)} className="text-[10px] font-bold text-rowan-red hover:underline">Delete version</button>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 text-left"><th className="p-2">From (LKR)</th><th className="p-2">To (LKR)</th><th className="p-2 text-right">Rate</th></tr></thead>
            <tbody>
              {slabs.filter((s) => s.effective_from === v).sort((a, b) => a.sort_order - b.sort_order).map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="p-2">{fmt(s.band_from)}</td>
                  <td className="p-2">{s.band_to === null ? 'and above' : fmt(s.band_to)}</td>
                  <td className="p-2 text-right font-bold">{s.rate_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="text-xs font-bold text-rowan-navy hover:text-rowan-red">+ Add new tax table version</button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-rowan-bg">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Effective from</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 mb-3" />
          <table className="w-full text-xs mb-2">
            <thead><tr className="text-gray-400 text-left"><th className="p-1 w-1/3">From</th><th className="p-1 w-1/3">To (blank = open-ended)</th><th className="p-1">Rate %</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="p-1"><input value={r.band_from} onChange={(e) => setRows((rs) => rs.map((x, xi) => xi === i ? { ...x, band_from: e.target.value } : x))} className="w-full border border-gray-300 rounded px-1 py-1" /></td>
                  <td className="p-1"><input value={r.band_to} onChange={(e) => setRows((rs) => rs.map((x, xi) => xi === i ? { ...x, band_to: e.target.value } : x))} className="w-full border border-gray-300 rounded px-1 py-1" /></td>
                  <td className="p-1"><input value={r.rate_pct} onChange={(e) => setRows((rs) => rs.map((x, xi) => xi === i ? { ...x, rate_pct: e.target.value } : x))} className="w-full border border-gray-300 rounded px-1 py-1" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mr-4">+ Add band</button>
          <div className="mt-3 flex gap-2">
            <button disabled={saving} onClick={saveVersion} className="px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red disabled:opacity-50">Save version</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-1.5 rounded border border-gray-300 text-xs font-bold text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Departments
// ============================================================
function DepartmentsTab({ departments, accounts, onReload, onError, onNote }: {
  departments: Department[]; accounts: Account[]; onReload: () => Promise<void>; onError: (e: string) => void; onNote: (m: string) => void;
}) {
  const [newName, setNewName] = useState('');
  const wageAccounts: SelectOption[] = accounts.filter((a) => a.type === 'expense').map((a) => ({ value: a.id, label: a.name, sublabel: a.code }));

  async function add() {
    if (!newName.trim()) return;
    try {
      await createDepartment({ name: newName.trim() });
      setNewName('');
      await onReload();
      onNote('Department added.');
    } catch (e: any) { onError(e.message ?? 'Failed to add department.'); }
  }

  async function setWageAccount(id: string, accountId: string) {
    try {
      await updateDepartment(id, { default_wage_account_id: accountId || null });
      await onReload();
    } catch (e: any) { onError(e.message ?? 'Failed to update.'); }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Each department needs a wage account mapped — that's what payroll debits when a period is
        posted, and what the (upcoming) labour costing engine reads to know each department's actual cost.
      </p>
      <table className="w-full text-xs mb-4">
        <thead><tr className="bg-rowan-navy text-white text-left"><th className="p-2">Department</th><th className="p-2 w-72">Wage GL account</th></tr></thead>
        <tbody>
          {departments.map((d) => (
            <tr key={d.id} className="border-b border-gray-100">
              <td className="p-2 font-bold text-rowan-navy">{d.name}</td>
              <td className="p-2">
                <SearchableSelect
                  value={d.default_wage_account_id ?? ''}
                  options={wageAccounts}
                  onChange={(v) => setWageAccount(d.id, v)}
                  placeholder="Select wage account…"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New department name" className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 max-w-xs" />
        <button onClick={add} className="px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red">+ Add department</button>
      </div>
    </div>
  );
}

// ============================================================
// Allowance types
// ============================================================
function AllowanceTypesTab({ types, onReload, onError, onNote }: { types: AllowanceType[]; onReload: () => Promise<void>; onError: (e: string) => void; onNote: (m: string) => void }) {
  const [newName, setNewName] = useState('');
  const [epfQ, setEpfQ] = useState(false);
  const [taxable, setTaxable] = useState(true);

  async function add() {
    if (!newName.trim()) return;
    try {
      await createAllowanceType({ name: newName.trim(), is_epf_qualifying: epfQ, is_taxable: taxable });
      setNewName(''); setEpfQ(false); setTaxable(true);
      await onReload();
      onNote('Allowance type added.');
    } catch (e: any) { onError(e.message ?? 'Failed to add.'); }
  }

  async function toggle(t: AllowanceType, field: 'is_epf_qualifying' | 'is_taxable' | 'is_active') {
    try {
      await updateAllowanceType(t.id, { [field]: !t[field] } as any);
      await onReload();
    } catch (e: any) { onError(e.message ?? 'Failed to update.'); }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Accountants add or remove these freely. "EPF-qualifying" controls whether the amount counts
        toward the 8/12/3% EPF/ETF base; "Taxable" controls whether it counts toward APIT.
      </p>
      <table className="w-full text-xs mb-4">
        <thead><tr className="bg-rowan-navy text-white text-left"><th className="p-2">Name</th><th className="p-2 text-center">EPF-qualifying</th><th className="p-2 text-center">Taxable</th><th className="p-2 text-center">Active</th></tr></thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="border-b border-gray-100">
              <td className="p-2 font-bold text-rowan-navy">{t.name}</td>
              <td className="p-2 text-center"><input type="checkbox" checked={t.is_epf_qualifying} onChange={() => toggle(t, 'is_epf_qualifying')} /></td>
              <td className="p-2 text-center"><input type="checkbox" checked={t.is_taxable} onChange={() => toggle(t, 'is_taxable')} /></td>
              <td className="p-2 text-center"><input type="checkbox" checked={t.is_active} onChange={() => toggle(t, 'is_active')} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3 bg-rowan-bg p-3 rounded-lg border border-gray-200">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New allowance name" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={epfQ} onChange={(e) => setEpfQ(e.target.checked)} /> EPF-qualifying</label>
        <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} /> Taxable</label>
        <button onClick={add} className="px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red">+ Add</button>
      </div>
    </div>
  );
}

// ============================================================
// Deduction types
// ============================================================
function DeductionTypesTab({ types, accounts, onReload, onError, onNote }: { types: DeductionType[]; accounts: Account[]; onReload: () => Promise<void>; onError: (e: string) => void; onNote: (m: string) => void }) {
  const [newName, setNewName] = useState('');
  const [accountId, setAccountId] = useState('');
  const acctOptions: SelectOption[] = accounts.map((a) => ({ value: a.id, label: a.name, sublabel: a.code }));

  async function add() {
    if (!newName.trim()) return;
    try {
      await createDeductionType({ name: newName.trim(), is_statutory: false, account_id: accountId || null });
      setNewName(''); setAccountId('');
      await onReload();
      onNote('Deduction type added.');
    } catch (e: any) { onError(e.message ?? 'Failed to add.'); }
  }

  async function setAccount(t: DeductionType, id: string) {
    try { await updateDeductionType(t.id, { account_id: id || null }); await onReload(); }
    catch (e: any) { onError(e.message ?? 'Failed to update.'); }
  }
  async function toggleActive(t: DeductionType) {
    try { await updateDeductionType(t.id, { is_active: !t.is_active }); await onReload(); }
    catch (e: any) { onError(e.message ?? 'Failed to update.'); }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        EPF, ETF and APIT are computed automatically — they don't appear here. Add deductions like
        staff loans or salary advances, and map each to the GL account it should credit on posting
        (e.g. a "Staff Loan Receivable" asset account). Leave unmapped and it posts to "Other Payroll
        Deductions Payable" instead.
      </p>
      <table className="w-full text-xs mb-4">
        <thead><tr className="bg-rowan-navy text-white text-left"><th className="p-2">Name</th><th className="p-2 w-64">Credits to (GL account)</th><th className="p-2 text-center">Active</th></tr></thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="border-b border-gray-100">
              <td className="p-2 font-bold text-rowan-navy">{t.name}</td>
              <td className="p-2">
                <SearchableSelect value={t.account_id ?? ''} options={acctOptions} onChange={(v) => setAccount(t, v)} placeholder="Default (Other Payroll Deductions Payable)" />
              </td>
              <td className="p-2 text-center"><input type="checkbox" checked={t.is_active} onChange={() => toggleActive(t)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-3 bg-rowan-bg p-3 rounded-lg border border-gray-200">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New deduction name (e.g. Staff Loan)" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        <div className="w-64"><SearchableSelect value={accountId} options={acctOptions} onChange={setAccountId} placeholder="GL account (optional)" /></div>
        <button onClick={add} className="px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red">+ Add</button>
      </div>
    </div>
  );
}

// ============================================================
// Employees (+ each employee's recurring allowances/deductions)
// ============================================================
function EmployeesTab({ employees, departments, allowanceTypes, deductionTypes, onReload, onError, onNote }: {
  employees: Employee[]; departments: Department[]; allowanceTypes: AllowanceType[]; deductionTypes: DeductionType[];
  onReload: () => Promise<void>; onError: (e: string) => void; onNote: (m: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', department_id: '', designation: '', basic_salary: '', epf_no: '', join_date: '' });

  const deptOptions: SelectOption[] = departments.map((d) => ({ value: d.id, label: d.name }));

  async function addEmployee() {
    if (!form.name.trim()) return onError('Employee name is required.');
    try {
      await createEmployee({
        name: form.name.trim(),
        department_id: form.department_id || null,
        designation: form.designation || null,
        basic_salary: parseFloat(form.basic_salary) || 0,
        epf_no: form.epf_no || null,
        join_date: form.join_date || null,
      });
      setForm({ name: '', department_id: '', designation: '', basic_salary: '', epf_no: '', join_date: '' });
      setShowNew(false);
      await onReload();
      onNote('Employee added.');
    } catch (e: any) { onError(e.message ?? 'Failed to add employee.'); }
  }

  async function saveField(emp: Employee, patch: Partial<Employee>) {
    try { await updateEmployee(emp.id, patch); await onReload(); }
    catch (e: any) { onError(e.message ?? 'Failed to update employee.'); }
  }

  return (
    <div>
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="bg-rowan-navy text-white text-left">
            <th className="p-2">No.</th><th className="p-2">Name</th><th className="p-2">Department</th>
            <th className="p-2">Designation</th><th className="p-2 text-right">Basic</th><th className="p-2 text-center">Status</th><th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <React.Fragment key={emp.id}>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-2 font-mono">{emp.employee_no}</td>
                <td className="p-2 font-bold text-rowan-navy">{emp.name}</td>
                <td className="p-2">
                  <SearchableSelect
                    value={emp.department_id ?? ''}
                    options={deptOptions}
                    onChange={(v) => saveField(emp, { department_id: v || null })}
                    placeholder="Assign department…"
                  />
                </td>
                <td className="p-2">
                  <input
                    defaultValue={emp.designation ?? ''}
                    onBlur={(e) => e.target.value !== (emp.designation ?? '') && saveField(emp, { designation: e.target.value })}
                    className="border border-gray-200 rounded px-1 py-1 w-full"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number" defaultValue={emp.basic_salary}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (v !== emp.basic_salary) saveField(emp, { basic_salary: v });
                    }}
                    className="border border-gray-200 rounded px-1 py-1 w-24 text-right"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => saveField(emp, { status: emp.status === 'active' ? 'inactive' : 'active' })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {emp.status}
                  </button>
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => setExpanded(expanded === emp.id ? null : emp.id)} className="text-rowan-navy font-bold hover:text-rowan-red">
                    {expanded === emp.id ? 'Close' : 'Allowances / Deductions'}
                  </button>
                </td>
              </tr>
              {expanded === emp.id && (
                <tr>
                  <td colSpan={7} className="p-3 bg-rowan-bg">
                    <EmployeeLinesEditor employee={emp} allowanceTypes={allowanceTypes} deductionTypes={deductionTypes} onError={onError} onNote={onNote} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="text-xs font-bold text-rowan-navy hover:text-rowan-red">+ Add employee</button>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-rowan-bg grid grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
          <SearchableSelect value={form.department_id} options={deptOptions} onChange={(v) => setForm({ ...form, department_id: v })} placeholder="Department" />
          <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Designation" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
          <input type="number" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} placeholder="Basic salary" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
          <input value={form.epf_no} onChange={(e) => setForm({ ...form, epf_no: e.target.value })} placeholder="EPF number" className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
          <input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
          <div className="col-span-3 flex gap-2">
            <button onClick={addEmployee} className="px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold hover:bg-rowan-red">Save employee</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-1.5 rounded border border-gray-300 text-xs font-bold text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeLinesEditor({ employee, allowanceTypes, deductionTypes, onError, onNote }: {
  employee: Employee; allowanceTypes: AllowanceType[]; deductionTypes: DeductionType[]; onError: (e: string) => void; onNote: (m: string) => void;
}) {
  const [allowances, setAllowances] = useState<Record<string, number>>({});
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([listEmployeeAllowances(employee.id), listEmployeeDeductions(employee.id)]).then(([a, d]) => {
      const am: Record<string, number> = {}; a.forEach((x) => { if (x.is_active) am[x.allowance_type_id] = x.amount; });
      const dm: Record<string, number> = {}; d.forEach((x) => { if (x.is_active) dm[x.deduction_type_id] = x.amount; });
      setAllowances(am); setDeductions(dm); setLoaded(true);
    });
  }, [employee.id]);

  async function saveAllowance(typeId: string, amount: number) {
    try {
      await upsertEmployeeAllowance({ employee_id: employee.id, allowance_type_id: typeId, amount, is_active: amount > 0 });
      onNote('Saved.');
    } catch (e: any) { onError(e.message ?? 'Failed to save allowance.'); }
  }
  async function saveDeduction(typeId: string, amount: number) {
    try {
      await upsertEmployeeDeduction({ employee_id: employee.id, deduction_type_id: typeId, amount, is_active: amount > 0 });
      onNote('Saved.');
    } catch (e: any) { onError(e.message ?? 'Failed to save deduction.'); }
  }

  if (!loaded) return <LoadingSpinner size="sm" />;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Recurring allowances</p>
        <div className="space-y-1">
          {allowanceTypes.filter((t) => t.is_active).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <span className="text-xs">{t.name}</span>
              <input
                type="number" defaultValue={allowances[t.id] ?? 0}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  if (v !== (allowances[t.id] ?? 0)) { setAllowances((a) => ({ ...a, [t.id]: v })); saveAllowance(t.id, v); }
                }}
                className="w-24 border border-gray-200 rounded px-1 py-0.5 text-right text-xs"
              />
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Recurring deductions</p>
        <div className="space-y-1">
          {deductionTypes.filter((t) => t.is_active && !t.is_statutory).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <span className="text-xs">{t.name}</span>
              <input
                type="number" defaultValue={deductions[t.id] ?? 0}
                onBlur={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  if (v !== (deductions[t.id] ?? 0)) { setDeductions((d) => ({ ...d, [t.id]: v })); saveDeduction(t.id, v); }
                }}
                className="w-24 border border-gray-200 rounded px-1 py-0.5 text-right text-xs"
              />
            </div>
          ))}
          {deductionTypes.filter((t) => t.is_active && !t.is_statutory).length === 0 && (
            <p className="text-xs text-gray-400">No custom deduction types yet — add one in the Deduction Types tab.</p>
          )}
        </div>
      </div>
    </div>
  );
}
