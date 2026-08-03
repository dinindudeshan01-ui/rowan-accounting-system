'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { RowanWordmark } from '@/components/RowanMark';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ComboBox, ComboOption } from '@/components/ComboBox';
import { ItemModal } from '@/components/ItemModal';
import { InvoiceItem, ItemDraft, listItems, createItem } from '@/lib/parties';
import {
  Style,
  StyleDraft,
  StyleStatus,
  BomLine,
  BomLineDraft,
  emptyBomLineDraft,
  bomLineCost,
  StyleOperation,
  StyleOperationDraft,
  emptyOperationDraft,
  CostingSettings,
  calcLaborCost,
  calcOverheadCost,
  getStyle,
  updateStyle,
  listBomLines,
  replaceBomLines,
  listOperations,
  replaceOperations,
  getCostingSettings,
  publishStyleToCatalog,
  produceStyle,
  getLinkedItem,
} from '@/lib/styles';

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [text, setText] = useState('');
  function commit() {
    const v = text.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setText('');
  }
  return (
    <div className="border border-gray-300 rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center">
      {values.map((v) => (
        <span key={v} className="bg-rowan-navy/10 text-rowan-navy text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-rowan-navy/50 hover:text-rowan-red">✕</button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); } }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 min-w-[80px] text-[12px] outline-none py-0.5"
      />
    </div>
  );
}

type Tab = 'details' | 'bom' | 'labor' | 'costing';

export default function StyleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <StyleDetailInner />
    </Suspense>
  );
}

function StyleDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const initialTab = (searchParams.get('tab') as Tab) || 'details';
  const [tab, setTab] = useState<Tab>(['details', 'bom', 'labor', 'costing'].includes(initialTab) ? initialTab : 'details');
  const [loading, setLoading] = useState(true);
  const [style, setStyle] = useState<Style | null>(null);
  const [draft, setDraft] = useState<StyleDraft | null>(null);
  const [bomLines, setBomLines] = useState<(BomLineDraft & { key: string })[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [showItemModal, setShowItemModal] = useState<{ key: string; seed: string } | null>(null);

  const [savingDetails, setSavingDetails] = useState(false);
  const [savingBom, setSavingBom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const [linkedItem, setLinkedItem] = useState<{ id: string; code: string; name: string; unit_price: number; unit_cost: number } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const [produceQty, setProduceQty] = useState('');
  const [produceMemo, setProduceMemo] = useState('');
  const [producing, setProducing] = useState(false);

  const [operations, setOperations] = useState<(StyleOperationDraft & { key: string })[]>([]);
  const [costingSettings, setCostingSettings] = useState<CostingSettings | null>(null);
  const [savingLabor, setSavingLabor] = useState(false);

  useEffect(() => {
    Promise.all([getStyle(id), listBomLines(id), listItems(), getLinkedItem(id), listOperations(id), getCostingSettings()])
      .then(([s, lines, itemList, linked, ops, settings]) => {
        setStyle(s);
        setDraft({
          style_no: s.style_no,
          name: s.name,
          category: s.category,
          season: s.season,
          sizes: s.sizes,
          colorways: s.colorways,
          status: s.status,
          labor_cost_per_unit: s.labor_cost_per_unit,
          overhead_cost_per_unit: s.overhead_cost_per_unit,
          line_efficiency_pct: s.line_efficiency_pct,
          overhead_absorption_pct: s.overhead_absorption_pct,
          selling_price: s.selling_price,
          notes: s.notes,
        });
        setBomLines(lines.map((l) => ({ ...l, key: l.id })));
        setItems(itemList);
        setLinkedItem(linked);
        setOperations(ops.length > 0 ? ops.map((o) => ({ ...o, key: o.id })) : [{ ...emptyOperationDraft(0), key: crypto.randomUUID() }]);
        setCostingSettings(settings);
      })
      .catch((e) => setError(e.message ?? 'Failed to load style.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      await publishStyleToCatalog(id);
      const [linked, itemList] = await Promise.all([getLinkedItem(id), listItems()]);
      setLinkedItem(linked);
      setItems(itemList);
      setSavedNote(linkedItem ? 'Catalog listing updated with latest cost & price.' : 'Published — this style can now be added to invoices.');
    } catch (e: any) {
      setError(e.message ?? 'Failed to publish to the sales catalog.');
    } finally {
      setPublishing(false);
    }
  }

  const produceQtyNum = parseFloat(produceQty) || 0;
  const producePreview = useMemo(
    () =>
      bomLines
        .filter((l) => l.material_name.trim())
        .map((l) => {
          const stockItem = items.find((it) => it.id === l.item_id);
          const needed = l.consumption_qty * (1 + l.wastage_pct / 100) * produceQtyNum;
          const available = stockItem?.quantity_on_hand ?? 0;
          return { key: l.key, name: l.material_name, needed, available, short: produceQtyNum > 0 && needed > available, linked: !!stockItem };
        }),
    [bomLines, items, produceQtyNum]
  );
  const canProduce = produceQtyNum > 0 && producePreview.length > 0 && producePreview.every((p) => p.linked && !p.short) && !!linkedItem;

  async function handleProduce() {
    if (!canProduce) return;
    setProducing(true);
    setError(null);
    try {
      const entryNumber = await produceStyle(id, produceQtyNum, produceMemo || null);
      const [itemList, linked] = await Promise.all([listItems(), getLinkedItem(id)]);
      setItems(itemList);
      setLinkedItem(linked);
      setProduceQty('');
      setProduceMemo('');
      setSavedNote(`Produced ${produceQtyNum} units. BOM consumed, posted as ${entryNumber}.`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to produce.');
    } finally {
      setProducing(false);
    }
  }

  function setD<K extends keyof StyleDraft>(key: K, val: StyleDraft[K]) {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  }

  async function handleSaveDetails() {
    if (!draft) return;
    setSavingDetails(true);
    setError(null);
    setSavedNote(null);
    try {
      const updated = await updateStyle(id, draft);
      setStyle(updated);
      setSavedNote('Saved.');
    } catch (e: any) {
      setError(e.message?.includes('duplicate') ? `Style # "${draft.style_no}" is already in use.` : e.message ?? 'Failed to save.');
    } finally {
      setSavingDetails(false);
    }
  }

  function updateBomLine(key: string, patch: Partial<BomLineDraft>) {
    setBomLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function addBomLine() {
    setBomLines((prev) => [...prev, { ...emptyBomLineDraft(prev.length), key: crypto.randomUUID() }]);
  }
  function removeBomLine(key: string) {
    setBomLines((prev) => prev.filter((l) => l.key !== key));
  }
  function selectLineItem(key: string, opt: ComboOption | null) {
    if (!opt) {
      updateBomLine(key, { item_id: null });
      return;
    }
    const item = items.find((i) => i.id === opt.id);
    if (item) {
      updateBomLine(key, { item_id: item.id, material_name: item.name, unit_cost: item.unit_cost || 0 });
    }
  }
  async function handleCreateItem(draftItem: ItemDraft) {
    if (!showItemModal) return;
    const created = await createItem({ ...draftItem, item_type: 'inventory' });
    setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    selectLineItem(showItemModal.key, { id: created.id, label: created.name });
    setShowItemModal(null);
  }

  async function handleSaveBom() {
    setSavingBom(true);
    setError(null);
    setSavedNote(null);
    try {
      const clean = bomLines
        .filter((l) => l.material_name.trim())
        .map(({ key, ...rest }) => rest);
      await replaceBomLines(id, clean);
      setSavedNote('BOM saved.');
    } catch (e: any) {
      setError(e.message ?? 'Failed to save BOM.');
    } finally {
      setSavingBom(false);
    }
  }

  function updateOperation(key: string, patch: Partial<StyleOperationDraft>) {
    setOperations((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)));
  }
  function addOperation() {
    setOperations((prev) => [...prev, { ...emptyOperationDraft(prev.length), key: crypto.randomUUID() }]);
  }
  function removeOperation(key: string) {
    setOperations((prev) => prev.filter((o) => o.key !== key));
  }

  const totalSam = useMemo(() => operations.reduce((s, o) => s + (o.smv || 0), 0), [operations]);
  const effectiveEfficiencyPct = draft?.line_efficiency_pct ?? costingSettings?.default_line_efficiency_pct ?? 80;
  const effectiveOverheadPct = draft?.overhead_absorption_pct ?? costingSettings?.default_overhead_absorption_pct ?? 65;
  const costPerMinute = costingSettings?.cost_per_minute ?? 0;

  const materialCost = useMemo(() => bomLines.reduce((s, l) => s + bomLineCost(l), 0), [bomLines]);
  const laborCost = calcLaborCost(totalSam, effectiveEfficiencyPct, costPerMinute);
  const overheadCost = calcOverheadCost(laborCost, effectiveOverheadPct);

  async function handleSaveLabor() {
    if (!draft) return;
    setSavingLabor(true);
    setError(null);
    setSavedNote(null);
    try {
      const clean = operations
        .filter((o) => o.operation_name.trim())
        .map(({ key, ...rest }) => rest);
      await replaceOperations(id, clean);
      await updateStyle(id, {
        line_efficiency_pct: effectiveEfficiencyPct,
        overhead_absorption_pct: effectiveOverheadPct,
        labor_cost_per_unit: laborCost,
        overhead_cost_per_unit: overheadCost,
      });
      setDraft((d) => (d ? { ...d, line_efficiency_pct: effectiveEfficiencyPct, overhead_absorption_pct: effectiveOverheadPct, labor_cost_per_unit: laborCost, overhead_cost_per_unit: overheadCost } : d));
      setSavedNote('Labour & overhead costing saved.');
    } catch (e: any) {
      setError(e.message ?? 'Failed to save labour costing.');
    } finally {
      setSavingLabor(false);
    }
  }
  const totalCost = materialCost + laborCost + overheadCost;
  const sellingPrice = draft?.selling_price ?? 0;
  const marginAmt = sellingPrice - totalCost;
  const marginPct = sellingPrice > 0 ? (marginAmt / sellingPrice) * 100 : 0;

  if (loading || !draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rowan-bg">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rowan-bg p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link href="/style" className="text-xs font-bold text-rowan-navy hover:text-rowan-red">← Style Numbers</Link>
            <h1 className="text-xl font-black text-rowan-navy mt-1">
              {style?.style_no} — {style?.name}
            </h1>
          </div>
          <RowanWordmark markSize={32} />
        </div>

        <div className="flex gap-2 mb-4 print:hidden">
          {(['details', 'bom', 'labor', 'costing'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${tab === t ? 'bg-rowan-navy text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t === 'bom' ? 'Bill of Materials' : t === 'labor' ? 'Labour & Overhead' : t}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 text-rowan-red text-xs font-bold px-3 py-2 rounded mb-3">{error}</div>}
        {savedNote && <div className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded mb-3">{savedNote}</div>}

        <div className="bg-white rounded-lg shadow-lg p-6 text-sm">
          {tab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Style #</label>
                  <input value={draft.style_no} onChange={(e) => setD('style_no', e.target.value.toUpperCase())} className="w-full border border-gray-300 rounded px-2 py-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Status</label>
                  <SearchableSelect
                    value={draft.status}
                    onChange={(v) => setD('status', v as StyleStatus)}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'sample', label: 'Sample' },
                      { value: 'discontinued', label: 'Discontinued' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[12px]">Style Name</label>
                <input value={draft.name} onChange={(e) => setD('name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Category</label>
                  <input value={draft.category ?? ''} onChange={(e) => setD('category', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Season</label>
                  <input value={draft.season ?? ''} onChange={(e) => setD('season', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[12px]">Sizes</label>
                <TagInput values={draft.sizes} onChange={(v) => setD('sizes', v)} placeholder="Type a size and press Enter" />
              </div>
              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[12px]">Colourways</label>
                <TagInput values={draft.colorways} onChange={(v) => setD('colorways', v)} placeholder="Type a colour and press Enter" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Labour Cost / Unit</label>
                  <div className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-gray-600">
                    {fmt(draft.labor_cost_per_unit)}
                  </div>
                  <button onClick={() => setTab('labor')} className="text-[10px] font-bold text-rowan-navy hover:text-rowan-red mt-0.5">
                    Calculate in Labour & Overhead →
                  </button>
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Overhead Cost / Unit</label>
                  <div className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-gray-600">
                    {fmt(draft.overhead_cost_per_unit)}
                  </div>
                  <button onClick={() => setTab('labor')} className="text-[10px] font-bold text-rowan-navy hover:text-rowan-red mt-0.5">
                    Calculate in Labour & Overhead →
                  </button>
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1 text-[12px]">Selling Price</label>
                  <input type="number" value={draft.selling_price} onChange={(e) => setD('selling_price', parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded px-2 py-1.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 mb-1 text-[12px]">Notes</label>
                <textarea value={draft.notes ?? ''} onChange={(e) => setD('notes', e.target.value)} rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 resize-none" />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={savingDetails}
                  className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {savingDetails && <LoadingSpinner size="sm" />}
                  Save Details
                </button>
              </div>
            </div>
          )}

          {tab === 'bom' && (
            <div>
              <p className="text-xs text-gray-500 mb-4">
                Add every fabric, trim, and accessory that goes into one unit of this style. Wastage % is applied on top of
                consumption when costing.
              </p>
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-left text-[11px] text-gray-400 uppercase">
                    <th className="p-2">Material</th>
                    <th className="p-2 w-24">UOM</th>
                    <th className="p-2 w-28 text-right">Consumption</th>
                    <th className="p-2 w-24 text-right">Wastage %</th>
                    <th className="p-2 w-28 text-right">Unit Cost</th>
                    <th className="p-2 w-28 text-right">Line Cost</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {bomLines.map((l) => (
                    <tr key={l.key} className="border-t border-gray-100">
                      <td className="p-2 min-w-[200px]">
                        <ComboBox
                          options={items.map((i) => ({ id: i.id, label: i.name, sublabel: i.code }))}
                          value={l.item_id ? { id: l.item_id, label: l.material_name } : l.material_name ? { id: '__free__', label: l.material_name } : null}
                          onSelect={(opt) => selectLineItem(l.key, opt)}
                          onCreateNew={(text) => setShowItemModal({ key: l.key, seed: text })}
                          createLabel="Add new material"
                          placeholder="Search materials…"
                        />
                        {!l.item_id && (
                          <input
                            value={l.material_name}
                            onChange={(e) => updateBomLine(l.key, { material_name: e.target.value })}
                            placeholder="Or type a material name directly"
                            className="w-full border border-gray-200 rounded px-2 py-1 mt-1 text-[11px]"
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <input value={l.uom} onChange={(e) => updateBomLine(l.key, { uom: e.target.value })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-right" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={l.consumption_qty} onChange={(e) => updateBomLine(l.key, { consumption_qty: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-right" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={l.wastage_pct} onChange={(e) => updateBomLine(l.key, { wastage_pct: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-right" />
                      </td>
                      <td className="p-2">
                        <input type="number" value={l.unit_cost} onChange={(e) => updateBomLine(l.key, { unit_cost: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded px-2 py-1.5 text-right" />
                      </td>
                      <td className="p-2 text-right font-semibold text-rowan-navy">{fmt(bomLineCost(l))}</td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeBomLine(l.key)} className="text-gray-300 hover:text-rowan-red">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={addBomLine} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-4">
                + Add material
              </button>

              <div className="flex justify-between items-center border-t-2 border-rowan-navy pt-3">
                <span className="font-bold text-gray-500 text-xs uppercase">Total Material Cost / Unit</span>
                <span className="font-black text-rowan-navy text-lg">{fmt(materialCost)}</span>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveBom}
                  disabled={savingBom}
                  className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {savingBom && <LoadingSpinner size="sm" />}
                  Save BOM
                </button>
              </div>
            </div>
          )}

          {tab === 'labor' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 max-w-lg">
                  Standard costing, not guesswork. Labour is built from a Standard Minute Value (SMV) per operation —
                  time-study the line, not estimate the cost. Overhead is absorbed as a % of labour cost, the standard
                  basis for a labour-intensive factory.
                </p>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Operation Breakdown (SMV)</h4>
              <table className="w-full text-sm mb-2">
                <thead>
                  <tr className="bg-rowan-navy text-white text-[11px] uppercase">
                    <th className="p-2 text-left">Operation</th>
                    <th className="p-2 text-right w-40">SMV (minutes)</th>
                    <th className="p-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((o) => (
                    <tr key={o.key} className="border-b border-gray-100">
                      <td className="p-2">
                        <input
                          value={o.operation_name}
                          onChange={(e) => updateOperation(o.key, { operation_name: e.target.value })}
                          placeholder="e.g. Collar Attach"
                          className="w-full border border-gray-300 rounded px-2 py-1.5"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={o.smv}
                          onChange={(e) => updateOperation(o.key, { smv: parseFloat(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-right"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => removeOperation(o.key)} className="text-gray-300 hover:text-rowan-red">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={addOperation} className="text-xs font-bold text-rowan-navy hover:text-rowan-red mb-4">
                + Add operation
              </button>

              <div className="flex justify-between items-center border-t-2 border-rowan-navy pt-3 mb-6">
                <span className="font-bold text-gray-500 text-xs uppercase">Total SAM (Standard Allowed Minutes)</span>
                <span className="font-black text-rowan-navy text-lg">{totalSam.toFixed(2)} min</span>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-3">Labour Cost</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 text-[11px]">Line Efficiency %</label>
                      <input
                        type="number"
                        value={draft.line_efficiency_pct ?? effectiveEfficiencyPct}
                        onChange={(e) => setD('line_efficiency_pct', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5"
                      />
                      <p className="text-[10px] text-gray-400 mt-0.5">Company default: {costingSettings?.default_line_efficiency_pct ?? '—'}%</p>
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 text-[11px]">Cost Per Minute</label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1.5 text-gray-500">{fmt(costPerMinute)}</div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Set in Admin → Costing Standards</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-1">(SAM ÷ Efficiency%) × Cost Per Minute</p>
                  <div className="flex justify-between items-baseline border-t border-gray-300 pt-2">
                    <span className="text-xs font-bold text-gray-600">Labour Cost / Unit</span>
                    <span className="font-black text-rowan-navy text-xl">{fmt(laborCost)}</span>
                  </div>
                </div>

                <div className="bg-rowan-bg border border-gray-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-3">Manufacturing Overhead</h4>
                  <div className="mb-3 text-sm">
                    <label className="block font-bold text-gray-500 mb-1 text-[11px]">Overhead Absorption % (of Labour Cost)</label>
                    <input
                      type="number"
                      value={draft.overhead_absorption_pct ?? effectiveOverheadPct}
                      onChange={(e) => setD('overhead_absorption_pct', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5"
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">Company default: {costingSettings?.default_overhead_absorption_pct ?? '—'}%</p>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-1">Labour Cost × Overhead Absorption%</p>
                  <div className="flex justify-between items-baseline border-t border-gray-300 pt-2">
                    <span className="text-xs font-bold text-gray-600">Overhead Cost / Unit</span>
                    <span className="font-black text-rowan-navy text-xl">{fmt(overheadCost)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSaveLabor}
                  disabled={savingLabor}
                  className="bg-rowan-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-rowan-red transition inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {savingLabor && <LoadingSpinner size="sm" />}
                  Save Labour &amp; Overhead
                </button>
              </div>
            </div>
          )}

          {tab === 'costing' && (
            <div>
              <div className="flex justify-between items-start mb-6 print:hidden">
                <p className="text-xs text-gray-500 max-w-md">
                  Rolls up the saved BOM plus labour and overhead from the Details tab into a per-unit cost, compared against
                  the selling price.
                </p>
                <button onClick={() => window.print()} className="px-4 py-2 rounded-lg border border-rowan-navy text-rowan-navy font-bold text-sm hover:bg-gray-50">
                  Print / PDF
                </button>
              </div>

              <div className="hidden print:block mb-6 text-center">
                <RowanWordmark markSize={40} />
                <h2 className="text-lg font-black text-rowan-navy font-display uppercase tracking-widest mt-3">Product Costing Sheet</h2>
                <p className="text-xs text-gray-500">{style?.style_no} — {style?.name}</p>
              </div>

              <table className="w-full text-sm mb-6">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Material Cost (from BOM)</td>
                    <td className="p-2 text-right font-semibold">{fmt(materialCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Labour Cost</td>
                    <td className="p-2 text-right font-semibold">{fmt(laborCost)}</td>
                  </tr>
                  <tr className="border-b-2 border-rowan-navy">
                    <td className="p-2 text-gray-600">Overhead Cost</td>
                    <td className="p-2 text-right font-semibold">{fmt(overheadCost)}</td>
                  </tr>
                  <tr className="border-b-2 border-rowan-navy font-bold">
                    <td className="p-2 text-right">Total Cost / Unit</td>
                    <td className="p-2 text-right">{fmt(totalCost)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-2 text-gray-600">Selling Price</td>
                    <td className="p-2 text-right font-semibold">{fmt(sellingPrice)}</td>
                  </tr>
                  <tr className={`font-bold text-base ${marginAmt >= 0 ? 'text-green-700' : 'text-rowan-red'}`}>
                    <td className="p-2 text-right">Margin / Unit ({marginPct.toFixed(1)}%)</td>
                    <td className="p-2 text-right">{fmt(marginAmt)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex items-center justify-between bg-rowan-bg border border-gray-200 rounded-lg px-4 py-3 mb-6 print:hidden">
                <div>
                  {linkedItem ? (
                    <>
                      <p className="text-xs font-bold text-green-700">✓ Live on invoices as {linkedItem.code} — {linkedItem.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Catalog price {fmt(linkedItem.unit_price)} · cost {fmt(linkedItem.unit_cost)}
                        {(linkedItem.unit_price !== sellingPrice || Math.abs(linkedItem.unit_cost - totalCost) > 0.01) && (
                          <span className="text-amber-700 font-bold"> — out of date, republish to sync</span>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-bold text-gray-500">Not yet published — this style won't appear on invoices until you publish it.</p>
                  )}
                </div>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-2 rounded-lg bg-rowan-navy text-white font-bold text-xs hover:bg-rowan-red transition disabled:opacity-50 inline-flex items-center gap-2 shrink-0"
                >
                  {publishing && <LoadingSpinner size="sm" />}
                  {linkedItem ? 'Republish (sync cost & price)' : 'Publish to Sales Catalog'}
                </button>
              </div>

              {linkedItem && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6 print:hidden">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-1">Produce This Style</h4>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Auto-consumes every BOM line for the quantity below — no need to issue each material by hand.
                    Currently in stock: <strong>{linkedItem ? items.find((it) => it.id === linkedItem.id)?.quantity_on_hand ?? 0 : 0}</strong> units.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 text-[11px]">Quantity to Produce</label>
                      <input
                        type="number"
                        value={produceQty}
                        onChange={(e) => setProduceQty(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded px-2 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500 mb-1 text-[11px]">Memo (optional)</label>
                      <input
                        value={produceMemo}
                        onChange={(e) => setProduceMemo(e.target.value)}
                        placeholder="e.g. Batch for order #142"
                        className="w-full border border-gray-300 rounded px-2 py-1.5"
                      />
                    </div>
                  </div>

                  {produceQtyNum > 0 && (
                    <table className="w-full text-[11px] mb-3">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="p-1 font-bold">Material</th>
                          <th className="p-1 font-bold text-right">Needed</th>
                          <th className="p-1 font-bold text-right">Available</th>
                          <th className="p-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {producePreview.map((p) => (
                          <tr key={p.key} className="border-t border-gray-100">
                            <td className="p-1">{p.name}</td>
                            <td className="p-1 text-right">{p.needed.toFixed(3)}</td>
                            <td className="p-1 text-right">{p.linked ? p.available.toFixed(3) : '—'}</td>
                            <td className="p-1 text-right">
                              {!p.linked ? (
                                <span className="text-rowan-red font-bold">not linked to an item</span>
                              ) : p.short ? (
                                <span className="text-rowan-red font-bold">short</span>
                              ) : (
                                <span className="text-green-600 font-bold">✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <button
                    onClick={handleProduce}
                    disabled={!canProduce || producing}
                    className="w-full bg-rowan-navy text-white px-4 py-2.5 rounded-lg font-bold text-xs hover:bg-rowan-red transition disabled:opacity-40 inline-flex items-center justify-center gap-2"
                  >
                    {producing && <LoadingSpinner size="sm" />}
                    Produce {produceQtyNum > 0 ? produceQtyNum : ''} Units
                  </button>
                </div>
              )}

              <h4 className="text-xs font-bold uppercase tracking-widest text-rowan-navy mb-2">Bulk Reference</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-[11px] uppercase text-gray-500 text-right">
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2">Total Cost</th>
                    <th className="p-2">Total Revenue</th>
                    <th className="p-2">Total Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {[12, 100, 1000].map((qty) => (
                    <tr key={qty} className="border-t border-gray-100 text-right">
                      <td className="p-2 text-left text-gray-600">{qty.toLocaleString()} units</td>
                      <td className="p-2">{fmt(totalCost * qty)}</td>
                      <td className="p-2">{fmt(sellingPrice * qty)}</td>
                      <td className={`p-2 font-semibold ${marginAmt >= 0 ? 'text-green-700' : 'text-rowan-red'}`}>{fmt(marginAmt * qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showItemModal && (
        <ItemModal
          initialName={showItemModal.seed}
          onClose={() => setShowItemModal(null)}
          onSave={handleCreateItem}
        />
      )}
    </div>
  );
}
