-- ============================================================
-- CRM MODULE
-- Leads pipeline (Inquiry -> Quoted -> Sample Sent -> Confirmed,
-- or Lost) plus a simple activity/follow-up log per lead. This is
-- separate from Customer Center: a lead lives here until it's won,
-- at which point it converts into a real customer row.
-- ============================================================

create type lead_stage as enum ('inquiry', 'quoted', 'sample_sent', 'confirmed', 'lost');
create type lead_activity_type as enum ('note', 'call', 'email', 'meeting', 'follow_up');

create table leads (
  id                    uuid primary key default gen_random_uuid(),
  company_name          text not null,
  contact_person        text,
  email                 text,
  phone                 text,
  source                text,
  stage                 lead_stage not null default 'inquiry',
  estimated_value       numeric(14,2) not null default 0,
  notes                 text,
  lost_reason           text,
  converted_customer_id uuid references customers(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_leads_stage on leads (stage);
create index idx_leads_company_name on leads (company_name);

create table lead_activities (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  activity_type  lead_activity_type not null default 'note',
  content        text not null,
  follow_up_date date,
  completed      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index idx_lead_activities_lead on lead_activities (lead_id);
create index idx_lead_activities_follow_up on lead_activities (follow_up_date) where follow_up_date is not null and completed = false;

-- updated_at maintenance (reuses touch_updated_at() from 011)
create trigger trg_leads_touch before update on leads
  for each row execute function touch_updated_at();

-- audit log (reuses write_audit_log() from 001)
create trigger trg_audit_leads after insert or update or delete on leads
  for each row execute function write_audit_log();

-- ============================================================
-- RLS — same posture as the rest of the app (003 + temp 006):
-- authenticated gets full access; anon gets full access too until
-- real login exists. Remove the anon policies once auth ships.
-- ============================================================
alter table leads enable row level security;
alter table lead_activities enable row level security;

create policy "authenticated read/write" on leads for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated read/write" on lead_activities for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "(temp, no-login) anon manages leads" on leads
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manages lead_activities" on lead_activities
  for all to anon using (true) with check (true);

grant select, insert, update, delete on leads, lead_activities to authenticated, anon;
