import { supabase } from '@/lib/supabase';

export type StyleStatus = 'active' | 'sample' | 'discontinued';

export type Style = {
  id: string;
  style_no: string;
  name: string;
  category: string | null;
  season: string | null;
  sizes: string[];
  colorways: string[];
  status: StyleStatus;
  labor_cost_per_unit: number;
  overhead_cost_per_unit: number;
  line_efficiency_pct: number | null;
  overhead_absorption_pct: number | null;
  selling_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StyleDraft = Omit<Style, 'id' | 'created_at' | 'updated_at'>;

export const emptyStyleDraft = (): StyleDraft => ({
  style_no: '',
  name: '',
  category: '',
  season: '',
  sizes: [],
  colorways: [],
  status: 'active',
  labor_cost_per_unit: 0,
  overhead_cost_per_unit: 0,
  line_efficiency_pct: null,
  overhead_absorption_pct: null,
  selling_price: 0,
  notes: '',
});

export type BomLine = {
  id: string;
  style_id: string;
  item_id: string | null;
  material_name: string;
  uom: string;
  consumption_qty: number;
  wastage_pct: number;
  unit_cost: number;
  sort_order: number;
};

export type BomLineDraft = Omit<BomLine, 'id' | 'style_id'>;

export const emptyBomLineDraft = (sortOrder: number): BomLineDraft => ({
  item_id: null,
  material_name: '',
  uom: 'unit',
  consumption_qty: 0,
  wastage_pct: 0,
  unit_cost: 0,
  sort_order: sortOrder,
});

export type StyleOperation = {
  id: string;
  style_id: string;
  operation_name: string;
  smv: number;
  sort_order: number;
};

export type StyleOperationDraft = Omit<StyleOperation, 'id' | 'style_id'>;

export const emptyOperationDraft = (sortOrder: number): StyleOperationDraft => ({
  operation_name: '',
  smv: 0,
  sort_order: sortOrder,
});

export type CostingSettings = {
  cost_per_minute: number;
  default_line_efficiency_pct: number;
  default_overhead_absorption_pct: number;
};

/** Standard SMV labor costing: (total SAM ÷ line efficiency%) × cost per minute. */
export function calcLaborCost(totalSam: number, efficiencyPct: number, costPerMinute: number): number {
  if (efficiencyPct <= 0) return 0;
  return (totalSam / (efficiencyPct / 100)) * costPerMinute;
}

/** Standard OAR overhead absorption, % of direct labor cost basis. */
export function calcOverheadCost(laborCost: number, overheadAbsorptionPct: number): number {
  return laborCost * (overheadAbsorptionPct / 100);
}

/** Line cost including wastage, used consistently by the BOM builder and the Costing tab. */
export function bomLineCost(line: { consumption_qty: number; wastage_pct: number; unit_cost: number }) {
  return line.consumption_qty * (1 + line.wastage_pct / 100) * line.unit_cost;
}

export async function listStyles(): Promise<Style[]> {
  const { data, error } = await supabase.from('styles').select('*').order('style_no');
  if (error) throw error;
  return data as Style[];
}

export async function getStyle(id: string): Promise<Style> {
  const { data, error } = await supabase.from('styles').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Style;
}

export async function createStyle(draft: StyleDraft): Promise<Style> {
  const { data, error } = await supabase.from('styles').insert(draft).select().single();
  if (error) throw error;
  return data as Style;
}

export async function updateStyle(id: string, draft: Partial<StyleDraft>): Promise<Style> {
  const { data, error } = await supabase.from('styles').update(draft).eq('id', id).select().single();
  if (error) throw error;
  return data as Style;
}

/**
 * Deletes a style — BOM lines and standard-costing rows cascade
 * automatically (they belong to the style, not shared data). Blocked
 * (with a clear message, not a raw Postgres error) if:
 *  - the style's linked finished-goods item still has stock on hand
 *  - the style has any stock_movements, absorption-costing, or
 *    department-output history — that's real production/accounting
 *    history and deleting it would silently break those records.
 * The linked catalog item itself, if any and if at zero balance, is
 * deleted first so the style doesn't leave an orphaned item behind.
 */
export async function deleteStyle(id: string): Promise<void> {
  // These two lookups don't depend on each other — run them in
  // parallel instead of one after another, cuts a full network
  // round trip off the delete.
  const [{ data: style, error: styleErr }, { data: linkedItem }] = await Promise.all([
    supabase.from('styles').select('style_no, name').eq('id', id).single(),
    supabase.from('items').select('id, quantity_on_hand').eq('style_id', id).maybeSingle(),
  ]);
  if (styleErr) throw styleErr;

  if (linkedItem && linkedItem.quantity_on_hand !== 0) {
    throw new Error(
      `"${style.style_no} — ${style.name}" still has ${linkedItem.quantity_on_hand} finished units on hand — issue or adjust that stock to zero before deleting.`
    );
  }

  if (linkedItem) {
    const { error: itemDelErr } = await supabase.from('items').delete().eq('id', linkedItem.id);
    if (itemDelErr) {
      if (itemDelErr.code === '23503') {
        throw new Error(
          `"${style.style_no} — ${style.name}" has stock movement history on its finished-goods item and can't be deleted — deactivate the style instead to keep the audit trail intact.`
        );
      }
      throw itemDelErr;
    }
  }

  const { error } = await supabase.from('styles').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error(
        `"${style.style_no} — ${style.name}" has production or costing history and can't be deleted — set its status to Discontinued instead to keep the audit trail intact.`
      );
    }
    throw error;
  }
}

/** Suggests the next style number as STY-0001, STY-0002, ... — a starting point the user can freely edit. */
export async function suggestNextStyleNo(): Promise<string> {
  const { count } = await supabase.from('styles').select('*', { count: 'exact', head: true });
  const n = (count ?? 0) + 1;
  return `STY-${String(n).padStart(4, '0')}`;
}

export async function listBomLines(styleId: string): Promise<BomLine[]> {
  const { data, error } = await supabase.from('style_bom_lines').select('*').eq('style_id', styleId).order('sort_order');
  if (error) throw error;
  return data as BomLine[];
}

/** Every BOM line across every style — for the BOM hub's summary cards (material count/cost per style). */
export async function listAllBomLines(): Promise<BomLine[]> {
  const { data, error } = await supabase.from('style_bom_lines').select('*');
  if (error) throw error;
  return data as BomLine[];
}

/** Replaces every BOM line for a style in one call — simplest consistent way to save the whole builder. */
export async function replaceBomLines(styleId: string, lines: BomLineDraft[]): Promise<void> {
  const { error: delError } = await supabase.from('style_bom_lines').delete().eq('style_id', styleId);
  if (delError) throw delError;
  if (lines.length === 0) return;
  const rows = lines.map((l, i) => ({ ...l, style_id: styleId, sort_order: i }));
  const { error: insError } = await supabase.from('style_bom_lines').insert(rows);
  if (insError) throw insError;
}

export async function listOperations(styleId: string): Promise<StyleOperation[]> {
  const { data, error } = await supabase.from('style_operations').select('*').eq('style_id', styleId).order('sort_order');
  if (error) throw error;
  return data as StyleOperation[];
}

/** Replaces every operation (SMV) line for a style in one call, same pattern as replaceBomLines. */
export async function replaceOperations(styleId: string, lines: StyleOperationDraft[]): Promise<void> {
  const { error: delError } = await supabase.from('style_operations').delete().eq('style_id', styleId);
  if (delError) throw delError;
  if (lines.length === 0) return;
  const rows = lines.map((l, i) => ({ ...l, style_id: styleId, sort_order: i }));
  const { error: insError } = await supabase.from('style_operations').insert(rows);
  if (insError) throw insError;
}

export async function getCostingSettings(): Promise<CostingSettings> {
  const { data, error } = await supabase.from('costing_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data as CostingSettings;
}

export async function updateCostingSettings(patch: Partial<CostingSettings>): Promise<void> {
  const { error } = await supabase.from('costing_settings').update(patch).eq('id', 1);
  if (error) throw error;
}

/** Publishes (or re-publishes) a style as a sellable item, rolling up BOM + labor + overhead into unit_cost. Safe to call repeatedly — updates the same linked item rather than duplicating. */
export async function publishStyleToCatalog(styleId: string): Promise<string> {
  const { data, error } = await supabase.rpc('publish_style_to_catalog', { p_style_id: styleId });
  if (error) throw error;
  return data as string;
}

/** Auto-consumes every BOM line for a production run — atomic, all-or-nothing against current stock. */
export async function produceStyle(styleId: string, qty: number, memo: string | null): Promise<string> {
  const { data, error } = await supabase.rpc('produce_style', {
    p_style_id: styleId,
    p_qty: qty,
    p_memo: memo,
    p_created_by_name: 'Dinindu',
  });
  if (error) throw error;
  return data as string;
}

/** The item this style is currently published as, if any. */
export async function getLinkedItem(styleId: string): Promise<{ id: string; code: string; name: string; unit_price: number; unit_cost: number } | null> {
  const { data, error } = await supabase
    .from('items')
    .select('id, code, name, unit_price, unit_cost')
    .eq('style_id', styleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
