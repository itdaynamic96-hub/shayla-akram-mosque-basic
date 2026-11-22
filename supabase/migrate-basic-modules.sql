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

-- Keep all 15 fixed modules and enforce the server-side 500-word limit.
alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_module_check;
alter table public.mosque_entries
  add constraint mosque_entries_basic_module_check
  check (module in (
    'home','mosjid-porichiti','itihas','motawalli','committee',
    'prayer','special-prayer','notices','news','islamic-learning',
    'imam','services','donations','gallery','contact'
  ));

alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_body_500_check;
alter table public.mosque_entries
  add constraint mosque_entries_basic_body_500_check
  check (public.word_count_500(body));

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
notify pgrst, 'reload schema';
