'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getCheckForPrint, CheckForPrint } from '@/lib/bank';
import { amountToWords } from '@/lib/numberToWords';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// ------------------------------------------------------------------
// Standard "voucher check" layout — the same 8.5x11 arrangement used
// by QuickBooks, Odoo, Sage, etc. for laser check stock:
//   - top third: the check itself (payee, amount, amount-in-words,
//     signature line) positioned to land in a check-stock window/MICR
//     area
//   - middle + bottom thirds: two identical remittance stubs (one to
//     detach for the payee, one for the company's own file copy),
//     each listing the expense lines the check pays
// Each third is exactly 3.6667in tall so it lines up with standard
// 3-per-page perforated check stock. Fields are laid out to match the
// usual "Pay to the order of" / dollar-box / MICR-line conventions so
// it can be fed straight into a check printer.
// ------------------------------------------------------------------

const COMPANY_KEY = 'rowan_check_company_info';

type CompanyInfo = { name: string; address: string };

function loadCompanyInfo(): CompanyInfo {
  if (typeof window === 'undefined') return { name: 'Rowan Casual Wear (Pvt) Ltd', address: '' };
  try {
    const raw = window.localStorage.getItem(COMPANY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: 'Rowan Casual Wear (Pvt) Ltd', address: '' };
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function payeeName(check: CheckForPrint): string {
  if (check.payee_type === 'vendor') return check.vendor?.display_name ?? '—';
  if (check.payee_type === 'customer') return check.customer?.display_name ?? '—';
  return check.payee_name ?? '—';
}

function payeeAddress(check: CheckForPrint): string {
  const p = check.payee_type === 'vendor' ? check.vendor : check.payee_type === 'customer' ? check.customer : null;
  if (!p) return '';
  return [p.address, p.city].filter(Boolean).join(', ');
}

function Stub({ check, label }: { check: CheckForPrint; label: string }) {
  return (
    <div className="stub">
      <div className="stub-header">
        <span className="stub-label">{label}</span>
        <span>
          Check #{check.check_number} &nbsp;·&nbsp; {new Date(check.check_date).toLocaleDateString()}
        </span>
      </div>
      <table className="stub-table">
        <thead>
          <tr>
            <th className="col-acct">Account</th>
            <th>Description</th>
            <th className="col-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          {check.lines.map((l) => (
            <tr key={l.line_no}>
              <td className="col-acct">{l.account ? `${l.account.code} ${l.account.name}` : '—'}</td>
              <td>{l.description ?? ''}</td>
              <td className="col-amt">{fmt(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="stub-total">
        Pay to: {payeeName(check)} &nbsp;·&nbsp; Total: {fmt(check.total_amount)}
        {check.memo ? ` · Memo: ${check.memo}` : ''}
      </div>
    </div>
  );
}

export default function PrintCheckPage() {
  const params = useParams();
  const id = params?.id as string;
  const [check, setCheck] = useState<CheckForPrint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyInfo>({ name: '', address: '' });
  const [editingCompany, setEditingCompany] = useState(false);

  useEffect(() => {
    setCompany(loadCompanyInfo());
    getCheckForPrint(id)
      .then(setCheck)
      .catch((e) => setError(e.message ?? 'Failed to load check.'));
  }, [id]);

  function saveCompany() {
    window.localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
    setEditingCompany(false);
  }

  if (error) return <div className="p-8 text-sm text-rowan-red">{error}</div>;
  if (!check) return <div className="p-8 flex justify-center"><LoadingSpinner size="md" label="Loading check…" /></div>;

  return (
    <div className="print-check-root">
      <style jsx global>{`
        .print-check-root {
          font-family: 'Courier New', Courier, monospace;
          color: #000;
        }
        .no-print { }
        @media print {
          .no-print { display: none !important; }
          @page { size: letter; margin: 0; }
          body { margin: 0; }
        }
        .sheet {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          background: #fff;
        }
        .third {
          height: 3.6667in;
          box-sizing: border-box;
          padding: 0.3in 0.5in;
          position: relative;
          border-bottom: 1px dashed #bbb;
        }
        .third:last-child { border-bottom: none; }

        /* ---- check portion ---- */
        .check-top-row {
          display: flex;
          justify-content: space-between;
          font-size: 10pt;
        }
        .check-date {
          text-align: right;
        }
        .check-payee-row {
          display: flex;
          align-items: baseline;
          margin-top: 0.35in;
          font-size: 11pt;
          gap: 0.15in;
        }
        .check-payee-label { white-space: nowrap; font-weight: bold; }
        .check-payee-line { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .check-amount-box {
          border: 1px solid #000;
          padding: 2px 8px;
          font-weight: bold;
          white-space: nowrap;
        }
        .check-words-row {
          display: flex;
          align-items: baseline;
          margin-top: 0.2in;
          font-size: 10pt;
          gap: 0.15in;
        }
        .check-words-line { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; text-transform: capitalize; }
        .check-address {
          margin-top: 0.3in;
          font-size: 9pt;
          line-height: 1.4;
        }
        .check-memo-sig-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 0.55in;
          font-size: 9pt;
        }
        .check-memo-line, .check-sig-line {
          border-bottom: 1px solid #000;
          width: 2.6in;
          padding-bottom: 2px;
        }
        .void-stamp {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          font-size: 40pt;
          font-weight: bold;
          color: rgba(200, 0, 0, 0.4);
          letter-spacing: 0.1em;
          pointer-events: none;
        }

        /* ---- stub portion ---- */
        .stub { font-size: 9pt; }
        .stub-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .stub-label { text-transform: uppercase; letter-spacing: 0.08em; }
        .stub-table { width: 100%; border-collapse: collapse; }
        .stub-table th, .stub-table td { text-align: left; padding: 2px 4px; font-size: 8.5pt; }
        .stub-table th { border-bottom: 1px solid #999; }
        .col-amt { text-align: right; width: 1in; }
        .col-acct { width: 2.3in; }
        .stub-total {
          margin-top: 8px;
          padding-top: 4px;
          border-top: 1px solid #000;
          font-weight: bold;
        }
      `}</style>

      <div className="no-print p-4 flex items-center justify-between gap-4 bg-rowan-bg border-b border-gray-300">
        <div className="flex items-center gap-3">
          <Link href="/accounting/write-check" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">
            ← Back to Write Checks
          </Link>
          <button
            onClick={() => setEditingCompany((v) => !v)}
            className="text-xs font-bold text-rowan-navy hover:text-rowan-red underline"
          >
            {editingCompany ? 'Close' : 'Edit bank/company header'}
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-lg bg-rowan-navy text-white font-bold text-sm hover:bg-rowan-red transition"
        >
          Print Check
        </button>
      </div>

      {editingCompany && (
        <div className="no-print p-4 bg-white border-b border-gray-300 flex flex-col gap-2 max-w-xl text-sm">
          <label className="text-[10px] font-bold text-gray-400 uppercase">
            Company / bank header (printed at top of check — matches your pre-printed check stock)
          </label>
          <input
            value={company.name}
            onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1.5"
            placeholder="Company name"
          />
          <textarea
            value={company.address}
            onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1.5"
            rows={2}
            placeholder="Address / bank account line"
          />
          <button onClick={saveCompany} className="self-start px-4 py-1.5 rounded bg-rowan-navy text-white text-xs font-bold">
            Save
          </button>
        </div>
      )}

      <div className="sheet">
        {/* ---- top third: the actual check ---- */}
        <div className="third">
          {check.status === 'void' && <div className="void-stamp">VOID</div>}
          <div className="check-top-row">
            <div>
              <div style={{ fontWeight: 'bold' }}>{company.name}</div>
              <div style={{ whiteSpace: 'pre-line', fontSize: '8.5pt' }}>{company.address}</div>
              {check.bank_account && <div style={{ fontSize: '8.5pt' }}>{check.bank_account.name}</div>}
            </div>
            <div className="check-date">
              <div>No. {check.check_number}</div>
              <div>Date: {new Date(check.check_date).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="check-payee-row">
            <span className="check-payee-label">Pay to the order of</span>
            <span className="check-payee-line">{payeeName(check)}</span>
            <span className="check-amount-box">Rs. {fmt(check.total_amount)}</span>
          </div>

          <div className="check-words-row">
            <span className="check-words-line">{amountToWords(check.total_amount)}</span>
          </div>

          <div className="check-address">{payeeAddress(check)}</div>

          <div className="check-memo-sig-row">
            <div>
              <div className="check-memo-line">{check.memo ?? ''}</div>
              <div style={{ fontSize: '7.5pt', marginTop: 2 }}>Memo</div>
            </div>
            <div>
              <div className="check-sig-line">&nbsp;</div>
              <div style={{ fontSize: '7.5pt', marginTop: 2, textAlign: 'center' }}>Authorized Signature</div>
            </div>
          </div>
        </div>

        {/* ---- middle third: payee's stub copy ---- */}
        <div className="third">
          <Stub check={check} label="Payee Copy" />
        </div>

        {/* ---- bottom third: company file copy ---- */}
        <div className="third">
          <Stub check={check} label="Company Copy" />
        </div>
      </div>
    </div>
  );
}
