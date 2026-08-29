-- ============================================================
-- Run this FIRST, as its own SQL editor execution, before
-- 036_bank_operations.sql. je_source (001_core_schema.sql) is a fixed
-- enum, and Postgres will not let a newly added enum value be used
-- inside the same transaction that added it — so this has to be a
-- separate migration/commit from the one that inserts journal_entries
-- rows with these source_type values.
-- ============================================================
alter type je_source add value if not exists 'write_check';
alter type je_source add value if not exists 'make_deposit';
alter type je_source add value if not exists 'pay_bills';
