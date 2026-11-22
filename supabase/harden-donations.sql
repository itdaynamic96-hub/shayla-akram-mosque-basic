-- Run only in the NEW shayla-akram-mosque-basic project.
-- Editors can register donations as pending only.
-- Only owner/admin can verify, reject, or delete donation records.
do $$
begin
 if to_regclass('public.donation_records') is null or to_regclass('public.admin_profiles') is null then
  raise exception 'Expected donation_records and admin_profiles tables in the Basic project.';
 end if;
end $$;
alter table public.donation_records enable row level security;
drop policy if exists "staff manage donations" on public.donation_records;
drop policy if exists "basic donations read" on public.donation_records;
drop policy if exists "basic donations insert" on public.donation_records;
drop policy if exists "basic donations update" on public.donation_records;
drop policy if exists "basic donations delete" on public.donation_records;
create policy "basic donations read" on public.donation_records
for select to authenticated using(public.current_admin_role() in ('owner','admin','editor'));
create policy "basic donations insert" on public.donation_records
for insert to authenticated with check (
 (public.current_admin_role() in ('owner','admin'))
 or (public.current_admin_role()='editor' and created_by=auth.uid() and payment_status='pending')
);
create policy "basic donations update" on public.donation_records
for update to authenticated using(public.current_admin_role() in ('owner','admin'))
with check(public.current_admin_role() in ('owner','admin'));
create policy "basic donations delete" on public.donation_records
for delete to authenticated using(public.current_admin_role() in ('owner','admin'));
notify pgrst,'reload schema';
