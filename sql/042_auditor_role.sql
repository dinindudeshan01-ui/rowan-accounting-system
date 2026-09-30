-- ============================================================
-- STEP 1 of 4 — run this file ALONE (by itself).
-- Adds the 'auditor' role to the existing user_role enum
-- (staff, accountant, admin). Postgres won't let a new enum value be
-- used in the same run that adds it, which is why this is its own file.
-- ============================================================
alter type user_role add value if not exists 'auditor';
