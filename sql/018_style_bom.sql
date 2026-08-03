-- ============================================================
-- STYLE / BOM / PRODUCT COSTING
-- Adds the "Style" module: a master list of garment styles, a
-- Bill of Materials per style, and the cost inputs needed to
-- roll BOM + labour + overhead into a per-unit cost.
--
-- `items` already exists as the products/services master used by
-- invoices. Rather than inventing a second materials table, BOM
-- lines optionally link to `items` (item_type = 'inventory') so a
-- fabric/trim only needs to be defined once and can later be
-- reused by the Stock module. Each BOM line also snapshots
-- material_name/unit_cost at the time it's added, so editing or
-- deleting an item later doesn't silently change a style's costed
-- history.
-- ============================================================

alter table items add column if not exists unit_cost numeric(14,2) not null default 0;

create type style_status as enum ('active', 'sample', 'discontinued');

create table styles (
  id                     uuid primary key default gen_random_uuid(),
  style_no               text not null unique,
  name                   text not null,
  category               text,
  season                 text,
  sizes                  text[] not null default '{}',
  colorways              text[] not null default '{}',
  status                 style_status not null default 'active',
  labor_cost_per_unit    numeric(14,2) not null default 0,
  overhead_cost_per_unit numeric(14,2) not null default 0,
  selling_price          numeric(14,2) not null default 0,
  notes                  text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_styles_style_no on styles (style_no);
create index idx_styles_status on styles (status);

create table style_bom_lines (
  id               uuid primary key default gen_random_uuid(),
  style_id         uuid not null references styles(id) on delete cascade,
  item_id          uuid references items(id) on delete set null,
  material_name    text not null,
  uom              text not null default 'unit',
  consumption_qty  numeric(14,4) not null default 0,
  wastage_pct      numeric(6,2) not null default 0,
  unit_cost        numeric(14,2) not null default 0,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

create index idx_bom_lines_style on style_bom_lines (style_id);

-- ---------- updated_at maintenance (reuses touch_updated_at() from 011) ----------
create trigger trg_styles_touch_updated_at
before update on styles
for each row execute function touch_updated_at();

-- ---------- audit logging (reuses write_audit_log() from 001) ----------
create trigger trg_audit_styles after insert or update or delete on styles
for each row execute function write_audit_log();

create trigger trg_audit_style_bom_lines after insert or update or delete on style_bom_lines
for each row execute function write_audit_log();

-- ---------- RLS ----------
alter table styles enable row level security;
alter table style_bom_lines enable row level security;

create policy "authenticated read/write styles" on styles
  for all to authenticated using (true) with check (true);

create policy "authenticated read/write bom lines" on style_bom_lines
  for all to authenticated using (true) with check (true);

-- (temp, no-login) — mirrors the anon policies in 006/011/013/015 until
-- real auth/login is built. Remove alongside those once login exists.
create policy "(temp, no-login) anon manage styles" on styles
  for all to anon using (true) with check (true);

create policy "(temp, no-login) anon manage bom lines" on style_bom_lines
  for all to anon using (true) with check (true);

grant select, insert, update, delete on styles, style_bom_lines to authenticated, anon;
