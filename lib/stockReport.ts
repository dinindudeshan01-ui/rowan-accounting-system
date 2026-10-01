import { supabase } from '@/lib/supabase';
import { fetchAll } from '@/lib/fetchAll';

export type StockItem = {
  id: string;
  code: string;
  name: string;
  quantity_on_hand: number | null;
  unit_cost: number | null;
  reorder_level: number | null;
  style_id: string | null;
  stock_class: string | null;
  material_classification: string | null;
  styles?: { category: string | null } | { category: string | null }[] | null;
};

/** Same rule as the Stock Valuation page and the dashboard. */
export const isFinishedGood = (r: StockItem) => !!r.style_id || r.stock_class === 'finished_good';

export const styleCategory = (r: StockItem): string => {
  const s = Array.isArray(r.styles) ? r.styles[0] : r.styles;
  return s?.category?.trim() || 'Uncategorised';
};

export const MATERIAL_CLASS_LABEL: Record<string, string> = {
  direct_material: 'Direct materials',
  direct_expense: 'Direct expenses',
  indirect_material: 'Indirect materials',
};

export const materialClass = (r: StockItem) => (r.material_classification ? (MATERIAL_CLASS_LABEL[r.material_classification] ?? r.material_classification) : 'Unclassified');

export const itemValue = (r: StockItem) => Number(r.quantity_on_hand ?? 0) * Number(r.unit_cost ?? 0);

/** Active stock items (not services). Falls back to no category if the styles relationship isn't available. */
export async function loadStockItems(): Promise<StockItem[]> {
  const base = 'id, code, name, quantity_on_hand, unit_cost, reorder_level, style_id, stock_class, material_classification';
  const run = (select: string) =>
    fetchAll<StockItem>((from, to) =>
      supabase.from('items').select(select).eq('is_active', true).eq('item_type', 'inventory').order('code').range(from, to)
    );
  try {
    return await run(`${base}, styles(category)`);
  } catch {
    return await run(base);
  }
}
