-- Basic mosque website migration for the existing schema:
-- admin_profiles, mosque_entries, donation_records.
-- Run only in the NEW shayla-akram-mosque-basic Supabase project.

do $$
begin
  if to_regclass('public.admin_profiles') is null
     or to_regclass('public.mosque_entries') is null
     or to_regclass('public.donation_records') is null then
    raise exception 'Expected admin_profiles, mosque_entries and donation_records tables. Check the selected Supabase project.';
  end if;
end $$;

-- Keep all 15 fixed modules; only the history module has an 800-word limit.
alter table public.mosque_entries
  drop constraint if exists mosque_entries_module_check;
alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_module_check;
alter table public.mosque_entries
  add constraint mosque_entries_module_check
  check (module in (
    'home','mosjid-porichiti','itihas','motawalli','committee',
    'prayer','special-prayer','notices','news','islamic-learning',
    'imam','services','donations','gallery','contact'
  ));

alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_body_500_check;
create or replace function public.word_count_800(v text) returns boolean
language sql immutable as $
 select case
   when btrim(coalesce(v,''))='' then 0
   else cardinality(regexp_split_to_array(btrim(v), '\s+'))
 end <= 800
$;

alter table public.mosque_entries
  drop constraint if exists mosque_entries_history_body_800_check;
alter table public.mosque_entries
  add constraint mosque_entries_history_body_800_check
  check (module <> 'itihas' or public.word_count_800(body));

-- Row-level security policies remain authoritative.
grant select on public.mosque_entries to anon, authenticated;
grant insert, update, delete on public.mosque_entries to authenticated;
grant select on public.admin_profiles to authenticated;
grant select, insert, update, delete on public.donation_records to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mosque-media','mosque-media',true,10485760,array['image/*','video/mp4','video/webm'])
on conflict (id) do update
set public=excluded.public,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

-- Remove obsolete Storage policies from the incompatible authorization model.
drop policy if exists "basic mosque media permitted upload" on storage.objects;
drop policy if exists "basic mosque media permitted update" on storage.objects;
drop policy if exists "basic mosque media permitted delete" on storage.objects;
drop policy if exists "basic mosque media public read" on storage.objects;
drop policy if exists "basic mosque media staff delete" on storage.objects;
create policy "basic mosque media public read"
on storage.objects for select to anon, authenticated
using (bucket_id='mosque-media');

-- Permit cleanup of files uploaded by staff if a corresponding entry cannot be saved.
drop policy if exists "basic mosque media staff delete" on storage.objects;
create policy "basic mosque media staff delete"
on storage.objects for delete to authenticated
using (
  bucket_id='mosque-media'
  and public.current_admin_role() in ('owner','admin','editor')
);

-- Existing schema.sql upload/update policies use current_admin_role().

-- Donation hardening: editors may register only pending donations.
-- Only owner/admin can verify, reject, or delete donation records.
alter table public.donation_records enable row level security;
drop policy if exists "staff manage donations" on public.donation_records;
drop policy if exists "basic donations read" on public.donation_records;
drop policy if exists "basic donations insert" on public.donation_records;
drop policy if exists "basic donations update" on public.donation_records;
drop policy if exists "basic donations delete" on public.donation_records;
create policy "basic donations read" on public.donation_records
for select to authenticated
using (public.current_admin_role() in ('owner','admin','editor'));
create policy "basic donations insert" on public.donation_records
for insert to authenticated
with check (
  (public.current_admin_role() in ('owner','admin'))
  or (public.current_admin_role()='editor' and created_by=auth.uid() and payment_status='pending')
);
create policy "basic donations update" on public.donation_records
for update to authenticated
using (public.current_admin_role() in ('owner','admin'))
with check (public.current_admin_role() in ('owner','admin'));
create policy "basic donations delete" on public.donation_records
for delete to authenticated
using (public.current_admin_role() in ('owner','admin'));

notify pgrst, 'reload schema';
