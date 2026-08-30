import { supabase } from '@/lib/supabase';

export type PartyTerms = 'due_on_receipt' | 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'custom';

export const TERMS_OPTIONS: { value: PartyTerms; label: string; days: number | null }[] = [
  { value: 'due_on_receipt', label: 'Due on receipt', days: 0 },
  { value: 'net_15', label: 'Net 15', days: 15 },
  { value: 'net_30', label: 'Net 30', days: 30 },
  { value: 'net_45', label: 'Net 45', days: 45 },
  { value: 'net_60', label: 'Net 60', days: 60 },
  { value: 'custom', label: 'Custom', days: null },
];

export function termsLabel(t: PartyTerms) {
  return TERMS_OPTIONS.find((o) => o.value === t)?.label ?? t;
}

export type PartyKind = 'vendor' | 'customer';

export type Party = {
  id: string;
  display_name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  tin_vat: string | null;
  payment_terms: PartyTerms;
  opening_balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

export type PartyDraft = Omit<Party, 'id' | 'created_at'>;

export const emptyPartyDraft = (): PartyDraft => ({
  display_name: '',
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  tin_vat: '',
  payment_terms: 'net_30',
  opening_balance: 0,
  notes: '',
  is_active: true,
});

export function tableFor(kind: PartyKind) {
  return kind === 'vendor' ? 'vendors' : 'customers';
}

export async function listParties(kind: PartyKind): Promise<Party[]> {
  const { data, error } = await supabase.from(tableFor(kind)).select('*').order('display_name');
  if (error) throw error;
  return data as Party[];
}

export async function createParty(kind: PartyKind, draft: PartyDraft): Promise<Party> {
  const { data, error } = await supabase.from(tableFor(kind)).insert(draft).select().single();
  if (error) throw error;
  return data as Party;
}

export async function updateParty(kind: PartyKind, id: string, draft: Partial<PartyDraft>): Promise<Party> {
  const { data, error } = await supabase.from(tableFor(kind)).update(draft).eq('id', id).select().single();
  if (error) throw error;
  return data as Party;
}

export async function deactivateParty(kind: PartyKind, id: string, isActive: boolean) {
  const { error } = await supabase.from(tableFor(kind)).update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

// ---------- Items ----------
export type ItemType = 'service' | 'inventory' | 'non_inventory';
export type MaterialClassification = 'direct_material' | 'direct_expense' | 'indirect_material';

export type InvoiceItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  item_type: ItemType;
  unit_price: number;
  unit_cost: number;
  is_active: boolean;
  quantity_on_hand: number;
  reorder_level: number | null;
  material_classification: MaterialClassification | null;
  expense_account_id: string | null;
  style_id: string | null;
};

export type ItemDraft = Omit<InvoiceItem, 'id' | 'quantity_on_hand' | 'style_id'>;

export const emptyItemDraft = (): ItemDraft => ({
  code: '',
  name: '',
  description: '',
  item_type: 'service',
  unit_price: 0,
  unit_cost: 0,
  is_active: true,
  reorder_level: null,
  material_classification: null,
  expense_account_id: null,
});

export async function listItems(): Promise<InvoiceItem[]> {
  const { data, error } = await supabase.from('items').select('*').eq('is_active', true).order('name');
  if (error) throw error;
  return data as InvoiceItem[];
}

export async function createItem(draft: ItemDraft): Promise<InvoiceItem> {
  const { data, error } = await supabase.from('items').insert(draft).select().single();
  if (error) throw error;
  return data as InvoiceItem;
}

export async function updateItem(id: string, draft: Partial<ItemDraft>): Promise<InvoiceItem> {
  const { data, error } = await supabase.from('items').update(draft).eq('id', id).select().single();
  if (error) throw error;
  return data as InvoiceItem;
}

/**
 * Deletes an item only if it currently carries zero balance — never
 * delete something with stock value sitting on the books. Also
 * re-checks the live balance (not a stale row the caller may be
 * holding) right before deleting, so a receipt that landed a second
 * ago can't slip through.
 *
 * If the item has any stock_movements history, the DB's foreign key
 * (stock_movements.item_id references items, no cascade) rejects the
 * delete even at a zero balance — that's intentional, it preserves
 * the audit trail. We surface that as a clear message instead of a
 * raw Postgres error.
 */
export async function deleteItem(id: string): Promise<void> {
  const { data: fresh, error: fetchErr } = await supabase.from('items').select('quantity_on_hand, name').eq('id', id).single();
  if (fetchErr) throw fetchErr;
  if ((fresh?.quantity_on_hand ?? 0) !== 0) {
    throw new Error(`"${fresh?.name}" still has ${fresh?.quantity_on_hand} units on hand — bring it to zero before deleting.`);
  }

  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error(`"${fresh?.name}" has stock movement history (receipts/issues) and can't be deleted — deactivate it instead to keep the audit trail intact.`);
    }
    throw error;
  }
}
