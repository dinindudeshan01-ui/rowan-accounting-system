-- ============================================================
-- STANDARD COSTING: LABOR (SMV METHOD) + OVERHEAD (OAR METHOD)
--
-- Free-typing a labor/overhead number isn't costing — it's a guess.
-- This replaces that with the two standard techniques used in
-- garment manufacturing:
--
-- LABOR — Standard Minute Value (SMV) method:
--   Break production into operations (cutting, sewing steps,
--   finishing, packing...), each with a standard time (SMV) to
--   perform it once. Summed = SAM (Standard Allowed Minutes).
--   Labor Cost/Unit = (SAM ÷ Line Efficiency%) × Cost Per Minute
--   The ÷ efficiency% accounts for real production never hitting
--   100% of the time-studied standard (a line running at 80%
--   efficiency takes 1/0.80 = 1.25x the standard time in practice).
--
-- OVERHEAD — Overhead Absorption Rate (OAR), % of labor basis:
--   The standard, simplest-defensible base for a labor-intensive
--   factory (vs. machine-hour or direct-labor-hour OAR, which need
--   more data than an SME typically tracks day to day).
--   Overhead Cost/Unit = Direct Labor Cost/Unit × Overhead Absorption%
--
-- costing_settings holds the company-wide standards (cost per
-- minute, default efficiency%, default overhead%); each style can
-- override efficiency%/overhead% if a specific line or product
-- genuinely runs differently.
-- ============================================================

create table costing_settings (
  id                             int primary key default 1,
  cost_per_minute                numeric(10,4) not null default 0,
  default_line_efficiency_pct    numeric(5,2) not null default 80,
  default_overhead_absorption_pct numeric(5,2) not null default 65,
  updated_at                     timestamptz not null default now(),
  constraint costing_settings_singleton check (id = 1)
);

insert into costing_settings (id) values (1);

create trigger trg_costing_settings_touch_updated_at
before update on costing_settings
for each row execute function touch_updated_at();

create table style_operations (
  id             uuid primary key default gen_random_uuid(),
  style_id       uuid not null references styles(id) on delete cascade,
  operation_name text not null,
  smv            numeric(8,3) not null default 0,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_style_operations_style on style_operations (style_id);

alter table styles add column if not exists line_efficiency_pct numeric(5,2);
alter table styles add column if not exists overhead_absorption_pct numeric(5,2);
comment on column styles.line_efficiency_pct is 'Overrides costing_settings.default_line_efficiency_pct when set';
comment on column styles.overhead_absorption_pct is 'Overrides costing_settings.default_overhead_absorption_pct when set';

create trigger trg_audit_style_operations after insert or update or delete on style_operations
for each row execute function write_audit_log();
-- Note: costing_settings is NOT audited via write_audit_log() — that
-- trigger assumes every table's id is a uuid (audit_log.entity_id is
-- uuid), but this is a singleton row (id = 1, integer). Not worth a
-- schema special-case for one settings row.

alter table style_operations enable row level security;
alter table costing_settings enable row level security;

create policy "authenticated read/write operations" on style_operations
  for all to authenticated using (true) with check (true);
create policy "authenticated read/write costing settings" on costing_settings
  for all to authenticated using (true) with check (true);

create policy "(temp, no-login) anon manage operations" on style_operations
  for all to anon using (true) with check (true);
create policy "(temp, no-login) anon manage costing settings" on costing_settings
  for all to anon using (true) with check (true);

grant select, insert, update, delete on style_operations to authenticated, anon;
grant select, update on costing_settings to authenticated, anon;
