-- Existing Supabase database migration: exactly 15 fixed website modules.
-- Run once in Supabase SQL Editor for shayla-akram-mosque-basic.
alter table public.mosque_entries
  drop constraint if exists mosque_entries_module_check;

alter table public.mosque_entries
  add constraint mosque_entries_module_check
  check (module in ('home','mosjid-porichiti','itihas','motawalli','committee','prayer','special-prayer','notices','news','islamic-learning','imam','services','donations','gallery','contact'));

-- The fixed module catalog contains the homepage plus 14 content sections.
-- No custom module slug can be inserted or updated outside this allowlist.
