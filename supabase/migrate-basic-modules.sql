-- Mosque Basic website migration. Run once in the NEW Supabase project.
-- Scope is institution='mosque'; other institutions and their module keys remain unchanged.

create or replace function public.basic_mosque_body_within_500(v jsonb)
returns boolean
language sql
immutable
as $$
  select case
    when btrim(coalesce(v->>'body','')) = '' then true
    else cardinality(regexp_split_to_array(btrim(v->>'body'), '\s+')) <= 500
  end
$$;

alter table public.module_records
  drop constraint if exists module_records_mosque_basic_module_key_check;

alter table public.module_records
  add constraint module_records_mosque_basic_module_key_check
  check (
    institution <> 'mosque'
    or module_key in (
      'M01','M02','M03','M04','M05',
      'M06','M07','M08','M09','M10',
      'M11','M12','M13','M14','M15'
    )
  );

alter table public.module_records
  drop constraint if exists module_records_mosque_basic_body_500_check;

alter table public.module_records
  add constraint module_records_mosque_basic_body_500_check
  check (
    institution <> 'mosque'
    or public.basic_mosque_body_within_500(data)
  );

-- Grant the mosque custom_admin access to all 15 website modules.
-- super_admin already has access through the existing module_record_access() function.
insert into public.admin_module_permissions (user_id, module_key, can_view, can_write)
select p.id, k.module_key, true, true
from public.profiles p
cross join (values
 ('M01'),('M02'),('M03'),('M04'),('M05'),
 ('M06'),('M07'),('M08'),('M09'),('M10'),
 ('M11'),('M12'),('M13'),('M14'),('M15')
) as k(module_key)
where p.role = 'custom_admin'
  and p.institution in ('mosque','both')
  and not exists (
    select 1
    from public.admin_module_permissions old
    where old.user_id = p.id
      and old.module_key = k.module_key
  );

-- Data shape in module_records.data:
-- {"body":"...","metadata":{},"public_display":true}
-- Existing RLS policies/functions are intentionally preserved.
