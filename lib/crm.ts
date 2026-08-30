import { supabase } from '@/lib/supabase';
import { emptyPartyDraft, Party } from '@/lib/parties';

export type LeadStage = 'inquiry' | 'quoted' | 'sample_sent' | 'confirmed' | 'lost';

export const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'sample_sent', label: 'Sample Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'lost', label: 'Lost' },
];

export function stageLabel(s: LeadStage) {
  return STAGE_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

export type Lead = {
  id: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: LeadStage;
  estimated_value: number;
  notes: string | null;
  lost_reason: string | null;
  converted_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDraft = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'converted_customer_id'>;

export const emptyLeadDraft = (): LeadDraft => ({
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  source: '',
  stage: 'inquiry',
  estimated_value: 0,
  notes: '',
  lost_reason: '',
});

export async function listLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data as Lead[];
}

export async function createLead(draft: LeadDraft): Promise<Lead> {
  const { data, error } = await supabase.from('leads').insert(draft).select().single();
  if (error) throw error;
  return data as Lead;
}

export async function updateLead(id: string, draft: Partial<LeadDraft>): Promise<Lead> {
  const { data, error } = await supabase.from('leads').update(draft).eq('id', id).select().single();
  if (error) throw error;
  return data as Lead;
}

export async function setLeadStage(id: string, stage: LeadStage, lostReason?: string): Promise<Lead> {
  const patch: Partial<LeadDraft> = { stage };
  if (stage === 'lost' && lostReason) patch.lost_reason = lostReason;
  return updateLead(id, patch);
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw error;
}

/** Wins the lead: creates a real Customer Center record from it (or
 * reuses one if already converted) and marks the lead confirmed. */
export async function convertLeadToCustomer(lead: Lead): Promise<Party> {
  if (lead.converted_customer_id) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', lead.converted_customer_id).single();
    if (error) throw error;
    return data as Party;
  }

  const draft = {
    ...emptyPartyDraft(),
    display_name: lead.company_name,
    company_name: lead.company_name,
    contact_person: lead.contact_person ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    notes: lead.notes ?? '',
  };

  const { data: customer, error: custErr } = await supabase.from('customers').insert(draft).select().single();
  if (custErr) throw custErr;

  const { error: updErr } = await supabase
    .from('leads')
    .update({ stage: 'confirmed', converted_customer_id: (customer as Party).id })
    .eq('id', lead.id);
  if (updErr) throw updErr;

  return customer as Party;
}

// ---------- Activities / follow-ups ----------

export type LeadActivityType = 'note' | 'call' | 'email' | 'meeting' | 'follow_up';

export type LeadActivity = {
  id: string;
  lead_id: string;
  activity_type: LeadActivityType;
  content: string;
  follow_up_date: string | null;
  completed: boolean;
  created_at: string;
};

export async function listActivities(leadId: string): Promise<LeadActivity[]> {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as LeadActivity[];
}

export async function addActivity(
  leadId: string,
  activity: { activity_type: LeadActivityType; content: string; follow_up_date?: string | null }
): Promise<LeadActivity> {
  const { data, error } = await supabase
    .from('lead_activities')
    .insert({ lead_id: leadId, ...activity })
    .select()
    .single();
  if (error) throw error;
  return data as LeadActivity;
}

export async function completeActivity(id: string): Promise<void> {
  const { error } = await supabase.from('lead_activities').update({ completed: true }).eq('id', id);
  if (error) throw error;
}

/** Open (incomplete) follow-ups across every lead, soonest first —
 * for a "what do I need to call this week" list on the CRM hub. */
export async function listUpcomingFollowUps(): Promise<(LeadActivity & { lead: Pick<Lead, 'id' | 'company_name'> })[]> {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*, lead:leads(id, company_name)')
    .not('follow_up_date', 'is', null)
    .eq('completed', false)
    .order('follow_up_date', { ascending: true });
  if (error) throw error;
  return data as any;
}
