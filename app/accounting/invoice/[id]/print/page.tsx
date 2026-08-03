'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RowanMark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  currency: string;
  status: string;
  supplier_name: string;
  supplier_address: string | null;
  supplier_phone: string | null;
  supplier_email: string | null;
  supplier_website: string | null;
  supplier_tin: string | null;
  purchaser_name: string;
  purchaser_address: string | null;
  purchaser_tin: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  bank_acc_name: string | null;
  bank_acc_no: string | null;
  payment_terms: string | null;
  vat_rate: number;
  sscl_rate: number;
};

type LineRow = {
  id: string;
  line_no: number;
  code: string | null;
  description: string;
  qty: number;
  unit_price: number;
};

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceRow | null>(null);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [ssclRegistered, setSsclRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: inv }, { data: ls }, { data: tax }] = await Promise.all([
        supabase.from('invoices').select('*').eq('id', id).single(),
        supabase.from('invoice_lines').select('*').eq('invoice_id', id).order('line_no'),
        supabase.from('tax_settings').select('sscl_registered').single(),
      ]);
      if (!inv) {
        setNotFound(true);
      } else {
        setInvoice(inv as InvoiceRow);
        setLines((ls ?? []) as LineRow[]);
        if (tax) setSsclRegistered(tax.sscl_registered);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 gap-3">
        <p className="text-rowan-navy font-bold">Invoice not found.</p>
        <Link href="/accounting/invoice" className="text-xs font-bold text-rowan-red">← Back to invoice entry</Link>
      </div>
    );
  }

  const lineTotals = lines.map((l) => l.qty * l.unit_price);
  const subtotal = lineTotals.reduce((s, n) => s + n, 0);
  const scllAmt = ssclRegistered ? subtotal * (invoice.sscl_rate / 100) : 0;
  const exclVat = subtotal + scllAmt;
  const vatAmt = exclVat * (invoice.vat_rate / 100);
  const grandTotal = exclVat + vatAmt;

  // Pad the line table out to a minimum of 8 rows so short invoices still
  // fill the page the way the approved template does.
  const displayLines = [...lines];
  while (displayLines.length < 8) {
    displayLines.push({ id: `blank-${displayLines.length}`, line_no: 0, code: null, description: '', qty: 0, unit_price: 0 });
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-hide { display: none !important; }
          .a4-page { box-shadow: none !important; margin: 0 !important; }
        }
        .a4-page { width: 210mm; height: 297mm; }
      `}</style>

      <div className="print-hide p-4 flex justify-center gap-3">
        <Link href="/accounting/invoice" className="text-rowan-navy font-bold text-xs self-center hover:text-rowan-red">← Back to entry</Link>
        <Link href={`/accounting/invoice?id=${invoice.id}`} className="border border-rowan-navy text-rowan-navy px-5 py-2.5 rounded-lg font-bold text-xs hover:bg-rowan-navy hover:text-white transition self-center">
          Edit Invoice
        </Link>
        <button onClick={() => window.print()} className="bg-rowan-navy text-white px-8 py-3 rounded-lg font-bold hover:bg-rowan-red transition shadow-lg">
          Print Invoice
        </button>
      </div>

      <div className="a4-page bg-white shadow-lg mx-auto relative overflow-hidden flex flex-col text-[#06154b]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03]">
          <RowanMark size={600} />
        </div>

        <div className="relative z-10 flex flex-col h-full p-8">
          <div className="h-2 w-full flex mb-6">
            <div className="w-2/3 bg-[#06154b]" />
            <div className="w-1/3 bg-[#e60026]" />
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <RowanMark size={40} />
              <div>
                <h1 className="font-black text-2xl leading-none font-display">ROWAN</h1>
                <p className="text-[8px] tracking-[0.2em] font-bold uppercase">Casual Wear Pvt Ltd</p>
              </div>
            </div>
            <h2 className="text-lg font-bold uppercase tracking-widest">Tax Invoice</h2>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6 text-[10px]">
            <div className="border-b border-gray-400 pb-1"><span className="text-gray-500 font-bold block">Invoice No:</span>{invoice.invoice_number}</div>
            <div className="border-b border-gray-400 pb-1"><span className="text-gray-500 font-bold block">Date:</span>{invoice.invoice_date}</div>
            <div className="border-b border-gray-400 pb-1"><span className="text-gray-500 font-bold block">Due Date:</span>{invoice.due_date ?? '—'}</div>
            <div className="border-b border-gray-400 pb-1"><span className="text-gray-500 font-bold block">Currency:</span>{invoice.currency}</div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-[10px]">
            <div className="border border-gray-400 p-3">
              <h3 className="font-bold border-b border-[#06154b] mb-2 uppercase">Supplier Details</h3>
              <div className="text-gray-500 leading-tight">
                {invoice.supplier_name}<br />
                {invoice.supplier_address || 'No. 45, Negombo Road'}<br />
                Colombo, Sri Lanka<br />
                {invoice.supplier_phone || '+94 77 123 4567'} | {invoice.supplier_email || 'accounts@rowan.lk'}<br />
                {invoice.supplier_website || 'www.rowan.lk'}<br />
                TIN/VAT: {invoice.supplier_tin || '134567890'}
              </div>
            </div>
            <div className="border border-gray-400 p-3">
              <h3 className="font-bold border-b border-[#06154b] mb-2 uppercase">Purchaser Details</h3>
              <div className="text-gray-500 leading-tight">
                {invoice.purchaser_name}<br />
                {invoice.purchaser_address || '—'}<br />
                TIN/VAT: {invoice.purchaser_tin || '—'}
              </div>
            </div>
          </div>

          <table className="w-full text-[10px] mb-6 border-collapse">
            <thead>
              <tr className="bg-[#06154b] text-white">
                <th className="p-2 text-left w-20">Code</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right w-16">Qty</th>
                <th className="p-2 text-right w-24">Unit Price</th>
                <th className="p-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="border-b border-gray-400">
              {displayLines.map((l, idx) => (
                <tr key={l.id} className="border-b border-gray-200 h-8">
                  <td className="px-2">{l.code}</td>
                  <td className="px-2">{l.description}</td>
                  <td className="px-2 text-right">{l.qty || ''}</td>
                  <td className="px-2 text-right">{l.unit_price ? fmt(l.unit_price) : ''}</td>
                  <td className="px-2 text-right">{l.description ? fmt(lineTotals[idx] ?? 0) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-6 text-[10px] mt-auto pb-4">
            <div className="space-y-4">
              <div className="border border-gray-400 p-3">
                <h3 className="font-bold border-b border-[#06154b] mb-1 uppercase">Bank Details</h3>
                <div className="grid grid-cols-2 gap-1 text-gray-600">
                  <span>Bank:</span><span>{invoice.bank_name || '—'}</span>
                  <span>Branch:</span><span>{invoice.bank_branch || '—'}</span>
                  <span>A/C Name:</span><span>{invoice.bank_acc_name || '—'}</span>
                  <span>A/C No:</span><span>{invoice.bank_acc_no || '—'}</span>
                </div>
              </div>
              <div className="border border-gray-400 p-3">
                <h3 className="font-bold border-b border-[#06154b] mb-1 uppercase">Payment Terms</h3>
                <p className="text-gray-600">{invoice.payment_terms || '—'}</p>
              </div>
            </div>

            <div className="flex flex-col">
              <table className="w-full">
                <tbody>
                  <tr><td className="p-1 text-right text-gray-600">Subtotal:</td><td className="text-right p-1 font-bold">{fmt(subtotal)}</td></tr>
                  {ssclRegistered && (
                    <tr><td className="p-1 text-right text-gray-600">SSCL ({invoice.sscl_rate}%):</td><td className="text-right p-1 font-bold">{fmt(scllAmt)}</td></tr>
                  )}
                  <tr><td className="p-1 text-right font-bold">Total (Excl. VAT):</td><td className="text-right p-1 border-t border-gray-400 font-bold">{fmt(exclVat)}</td></tr>
                  <tr><td className="p-1 text-right text-gray-600">VAT ({invoice.vat_rate}%):</td><td className="text-right p-1 font-bold">{fmt(vatAmt)}</td></tr>
                  <tr className="bg-gray-100 font-bold"><td className="p-1 text-right">Grand Total:</td><td className="text-right p-1">{invoice.currency} {fmt(grandTotal)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between items-end mt-4">
            <p className="text-[8px] text-gray-400">
              Statutory Declarations: VAT {invoice.vat_rate}% {ssclRegistered ? `| SSCL ${invoice.sscl_rate}% on 85% Turnover` : ''}
            </p>
            <div className="text-center w-32">
              <div className="h-6 border-b border-[#06154b]" />
              <p className="text-[8px] mt-1 font-bold uppercase">Authorized Signatory</p>
            </div>
          </div>

          <div className="h-2 w-full flex mt-6">
            <div className="w-2/3 bg-[#06154b]" />
            <div className="w-1/3 bg-[#e60026]" />
          </div>
        </div>
      </div>
    </div>
  );
}
