-- ============================================================
-- STEP 2 of 4 — assign roles to the three logins.
-- Create the users first in Supabase → Authentication → Users
-- ("Add user" → "Create new user", tick "Auto Confirm User"), then run this.
-- Safe to run again; it just re-applies the role.
--
-- Roles:
--   admin, accountant → full access
--   auditor           → view only (enforced by 044)
-- ============================================================
insert into user_roles (user_id, role, full_name)
select id, 'admin', 'Admin' from auth.users where email = 'admin@rowan.lk'
on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;

insert into user_roles (user_id, role, full_name)
select id, 'accountant', 'Accountant' from auth.users where email = 'accountant@rowan.lk'
on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;

insert into user_roles (user_id, role, full_name)
select id, 'auditor', 'Auditors' from auth.users where email = 'auditors@rowan.lk'
on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;

-- Check: you should see all three rows.
select u.email, r.role
from user_roles r join auth.users u on u.id = r.user_id
order by u.email;
