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
      'm01','m02','m03','m04','m05',
      'm06','m07','m08','m09','m10',
      'm11','m12','m13','m14','m15'
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
 ('m01'),('m02'),('m03'),('m04'),('m05'),
 ('m06'),('m07'),('m08'),('m09'),('m10'),
 ('m11'),('m12'),('m13'),('m14'),('m15')
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


-- Enable the public media bucket used by the Basic website gallery.
-- Upload permission is checked against the existing module-level permission function.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mosque-media',
  'mosque-media',
  true,
  10485760,
  array['image/*','video/mp4','video/webm']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "basic mosque media public read" on storage.objects;
create policy "basic mosque media public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'mosque-media');

drop policy if exists "basic mosque media permitted upload" on storage.objects;
create policy "basic mosque media permitted upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'mosque-media'
  and public.module_record_access('m14', 'mosque', true)
);

drop policy if exists "basic mosque media permitted update" on storage.objects;
create policy "basic mosque media permitted update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'mosque-media'
  and public.module_record_access('m14', 'mosque', true)
)
with check (
  bucket_id = 'mosque-media'
  and public.module_record_access('m14', 'mosque', true)
);

drop policy if exists "basic mosque media permitted delete" on storage.objects;
create policy "basic mosque media permitted delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'mosque-media'
  and public.module_record_access('m14', 'mosque', true)
);
