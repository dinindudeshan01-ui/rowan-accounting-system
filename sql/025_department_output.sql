-- ============================================================
-- DEPARTMENT OUTPUT — daily output entries, department + style
-- wise. This is Phase 2 of the labour costing plan, and it's built
-- to be filled from a Google Sheet by floor staff, not the app —
-- see the Apps Script under sql/../google-sheets-sync/ for the
-- other half of this.
--
-- Sync design: the Sheet is the source of truth for NEW entries.
-- Each sheet row gets a stable sheet_row_key (spreadsheetId + row
-- number) written by Apps Script. sync_department_output() upserts
-- on that key, so re-running a sync after someone edits a quantity
-- updates the same row instead of creating a duplicate. Department
-- and style are resolved from the plain text the floor staff typed
-- (validated against a dropdown in the Sheet, but re-checked here
-- too) so a typo fails loudly with a row-specific error instead of
-- silently creating bad data.
-- ============================================================

create table department_output (
  id                uuid primary key default gen_random_uuid(),
  department_id     uuid not null references departments(id),
  style_id          uuid references styles(id), -- nullable: some output entries may be general/unassigned
  style_no          text, -- snapshot of what was typed, kept even if style_id is null or later changes
  production_date   date not null,
  quantity          numeric(14,2) not null check (quantity >= 0),
  notes             text,
  entered_by        text,
  source            text not null default 'app' check (source in ('app', 'sheet')),
  sheet_row_key     text unique, -- null for app-entered rows; unique per sheet row for sheet-entered rows
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_dept_output_department on department_output (department_id, production_date);
create index idx_dept_output_style on department_output (style_id);
create index idx_dept_output_date on department_output (production_date);

create trigger trg_dept_output_touch before update on department_output
  for each row execute function touch_updated_at();
create trigger trg_audit_dept_output after insert or update or delete on department_output
  for each row execute function write_audit_log();

alter table department_output enable row level security;
create policy "authenticated read/write" on department_output for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "(temp, no-login) anon manages department_output" on department_output
  for all to anon using (true) with check (true);
grant select, insert, update, delete on department_output to authenticated, anon;

-- ============================================================
-- sync_department_output — the one entry point the Sheet calls.
-- p_rows shape:
-- '[{"sheet_row_key":"1AbC...!row12","department":"Sewing / Swing",
--    "style_no":"STY-0042","production_date":"2026-07-20",
--    "quantity":180,"notes":"","entered_by":"Kamala"}, ...]'
-- Returns one result row per input row: {sheet_row_key, ok, error}
-- so Apps Script can write a per-row status back into the Sheet
-- instead of failing the whole batch on one bad row.
-- ============================================================
create or replace function sync_department_output(p_rows jsonb)
returns table(row_key text, success boolean, error_message text) as $$
declare
  v_row jsonb;
  v_dept_id uuid;
  v_style_id uuid;
  v_key text;
begin
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_key := v_row->>'sheet_row_key';
    begin
      if v_key is null or v_key = '' then
        raise exception 'Missing sheet_row_key';
      end if;
      if (v_row->>'production_date') is null then
        raise exception 'Missing production_date';
      end if;
      if (v_row->>'quantity') is null or (v_row->>'quantity')::numeric < 0 then
        raise exception 'Missing or invalid quantity';
      end if;

      select id into v_dept_id from departments
        where lower(name) = lower(trim(v_row->>'department')) and is_active;
      if v_dept_id is null then
        raise exception 'Unknown department: %', v_row->>'department';
      end if;

      v_style_id := null;
      if coalesce(v_row->>'style_no', '') <> '' then
        select id into v_style_id from styles where style_no = trim(v_row->>'style_no');
        if v_style_id is null then
          raise exception 'Unknown style number: %', v_row->>'style_no';
        end if;
      end if;

      insert into department_output (department_id, style_id, style_no, production_date, quantity, notes, entered_by, source, sheet_row_key)
      values (v_dept_id, v_style_id, nullif(trim(v_row->>'style_no'), ''), (v_row->>'production_date')::date,
              (v_row->>'quantity')::numeric, v_row->>'notes', v_row->>'entered_by', 'sheet', v_key)
      on conflict (sheet_row_key) do update set
        department_id = excluded.department_id,
        style_id = excluded.style_id,
        style_no = excluded.style_no,
        production_date = excluded.production_date,
        quantity = excluded.quantity,
        notes = excluded.notes,
        entered_by = excluded.entered_by;

      row_key := v_key;
      success := true;
      error_message := null;
      return next;
    exception when others then
      row_key := v_key;
      success := false;
      error_message := SQLERRM;
      return next;
    end;
  end loop;
end;
$$ language plpgsql security definer;

grant execute on function sync_department_output(jsonb) to authenticated, anon;

-- ============================================================
-- Summary view the Sheet reads back — the "both ways" half.
-- One row per department per month, so the write-back to the
-- Summary tab is a small, fast pull.
-- ============================================================
create or replace view department_output_summary as
select
  d.name as department,
  date_trunc('month', o.production_date)::date as month,
  sum(o.quantity) as total_output,
  count(*) as entries,
  max(o.updated_at) as last_updated
from department_output o
join departments d on d.id = o.department_id
group by d.name, date_trunc('month', o.production_date)
order by month desc, department;

grant select on department_output_summary to authenticated, anon;

-- ============================================================
-- Reference lists the Sheet pulls to keep its dropdowns current —
-- exposed as simple views so Apps Script doesn't need to know
-- column names on the real tables.
-- ============================================================
create or replace view department_output_dept_list as
  select name from departments where is_active order by name;
create or replace view department_output_style_list as
  select style_no, name from styles where status = 'active' order by style_no;

grant select on department_output_dept_list, department_output_style_list to authenticated, anon;

-- ============================================================
-- Fold into admin reset (transactions only — department/style
-- master data is untouched).
-- ============================================================
create or replace function reset_all_transactions()
returns void as $$
begin
  truncate table journal_lines, journal_entries, invoice_lines, invoices,
                 payment_allocations, payments, expense_lines, expenses,
                 payroll_entry_lines, payroll_entries, payroll_periods,
                 department_output, audit_log;

  alter sequence je_number_seq restart with 1;
  alter sequence invoice_number_seq restart with 1;
  alter sequence payment_number_seq restart with 1;
  alter sequence expense_number_seq restart with 1;
end;
$$ language plpgsql security definer;
