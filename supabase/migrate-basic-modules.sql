-- Mosque Basic website migration: use existing profiles/module_records architecture.
-- Run once in the NEW project: shayla-akram-mosque-basic.
-- Does not drop tables, profiles, functions, or existing records.

alter table public.module_records
  drop constraint if exists module_records_module_key_basic_check;
alter table public.module_records
  add constraint module_records_module_key_basic_check
  check (module_key in ('M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12','M13','M14','M15'));

create unique index if not exists module_records_one_per_module_institution
  on public.module_records (institution, module_key);

-- Grant the mosque custom_admin the ability to view and write the 15 Basic modules.
-- super_admin already bypasses module_record_access() by design.
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
on conflict (user_id, module_key)
do update set can_view = excluded.can_view, can_write = excluded.can_write;

-- Existing RLS policies and access functions remain in place.
-- module_records data JSONB shape used by this website:
-- {"body":"...","metadata":{},"public_display":true}
