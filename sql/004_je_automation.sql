-- ============================================================
-- JOURNAL ENTRY AUTOMATION
-- Adds what's needed for a QuickBooks-style JE workflow:
--   - is_adjusting flag (Adjusting Entry checkbox)
--   - a way to preview the next JE number WITHOUT consuming it
--     from je_number_seq (the real number is still assigned by
--     the existing trg_je_number trigger at insert time)
-- Run this after 001, 002, 003.
-- ============================================================

alter table journal_entries
  add column if not exists is_adjusting boolean not null default false;

-- Reversal entries link back to the entry they reverse via the
-- existing source_id column (source_type stays 'manual'), so no
-- new column is needed for that.

create or replace function next_je_number_preview()
returns text as $$
declare
  v_next bigint;
begin
  select case when is_called then last_value + 1 else last_value end
    into v_next
    from je_number_seq;
  return 'JE-' || lpad(v_next::text, 6, '0');
end;
$$ language plpgsql stable security definer;

grant execute on function next_je_number_preview() to authenticated;
