-- নতুন Basic mosque website-এর নতুন Supabase project-এ একবার চালান।
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'editor' check (role in ('owner','admin','editor','reviewer')),
 created_at timestamptz not null default now()
);

create table if not exists public.mosque_entries (
 id uuid primary key default gen_random_uuid(),
 module text not null check (module in ('home','mosjid-porichiti','itihas','motawalli','committee','prayer','special-prayer','notices','news','islamic-learning','imam','services','donations','gallery','contact')),
 title text not null check (char_length(title) between 1 and 180),
 body text not null default '',
 metadata jsonb not null default '{}'::jsonb,
 status text not null default 'draft' check (status in ('draft','pending','approved','published','rejected')),
 created_by uuid references auth.users(id) on delete set null,
 reviewed_by uuid references auth.users(id) on delete set null,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.donation_records (
 id uuid primary key default gen_random_uuid(),
 donor_name text,
 amount numeric(12,2) not null check(amount>0),
 currency text not null default 'BDT',
 source text not null default 'manual',
 received_on date not null default current_date,
 receipt_no text,
 payment_status text not null default 'pending' check(payment_status in ('pending','verified','rejected')),
 note text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create index if not exists mosque_entries_public_idx on public.mosque_entries(status,module,published_at desc);
create index if not exists mosque_entries_created_idx on public.mosque_entries(created_at desc);
create index if not exists donations_received_idx on public.donation_records(received_on desc);

create or replace function public.word_count_500(v text) returns boolean
language sql immutable as $$
 select case
   when btrim(coalesce(v,''))='' then 0
   else cardinality(regexp_split_to_array(btrim(v), '\s+'))
 end <= 500
$$;

create or replace function public.word_count_800(v text) returns boolean
language sql immutable as $
 select case
   when btrim(coalesce(v,''))='' then 0
   else cardinality(regexp_split_to_array(btrim(v), '\s+'))
 end <= 800
$;

create or replace function public.current_admin_role() returns text
language sql stable security definer set search_path=public,pg_temp as $$
 select role from public.admin_profiles where user_id=auth.uid()
$$;
revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to anon,authenticated;

create or replace function public.enforce_entry_rules() returns trigger
language plpgsql security invoker as $$
declare actor_role text;
begin
 if new.module='itihas' and not public.word_count_800(new.body) then
   raise exception 'মসজিদের ইতিহাস সর্বোচ্চ ৮০০ শব্দ হতে পারবে।' using errcode='22023';
 end if;

 actor_role:=public.current_admin_role();

 if actor_role is null then
   raise exception 'এই অ্যাকাউন্টের প্রশাসনিক অনুমতি নেই।' using errcode='42501';
 end if;

 if tg_op='UPDATE' and actor_role not in ('owner','admin')
    and (new.created_by is distinct from old.created_by or new.module is distinct from old.module) then
   raise exception 'তথ্যের মালিক বা বিভাগ পরিবর্তনের অনুমতি নেই।' using errcode='42501';
 end if;

 if actor_role='reviewer' and new.status not in ('approved','rejected') then
   raise exception 'পর্যালোচক কেবল অনুমোদন বা বাতিল করতে পারবেন।' using errcode='42501';
 end if;

 if tg_op='UPDATE' and actor_role='reviewer'
    and (new.title is distinct from old.title or new.body is distinct from old.body or new.metadata is distinct from old.metadata) then
   raise exception 'পর্যালোচক কেবল অনুমোদন/বাতিলের অবস্থা পরিবর্তন করতে পারবেন।' using errcode='42501';
 end if;

 if new.status in ('approved','rejected') and actor_role not in ('owner','admin','reviewer') then
   raise exception 'এই তথ্য অনুমোদন বা বাতিলের অনুমতি নেই।' using errcode='42501';
 end if;

 if new.status='published' then
   if actor_role not in ('owner','admin') then
     raise exception 'শুধু প্রশাসক প্রকাশ করতে পারবেন।' using errcode='42501';
   end if;
   new.published_at:=coalesce(new.published_at,now());
 end if;

 if new.status in ('approved','rejected') then
   new.reviewed_by:=auth.uid();
 end if;

 new.updated_at:=now();
 return new;
end;
$$;

drop trigger if exists mosque_entry_rules on public.mosque_entries;
create trigger mosque_entry_rules before insert or update on public.mosque_entries
for each row execute function public.enforce_entry_rules();

alter table public.admin_profiles enable row level security;
alter table public.mosque_entries enable row level security;
alter table public.donation_records enable row level security;

drop policy if exists "public read published entries" on public.mosque_entries;
create policy "public read published entries" on public.mosque_entries
for select to anon,authenticated using(status='published');

drop policy if exists "staff read all entries" on public.mosque_entries;
create policy "staff read all entries" on public.mosque_entries
for select to authenticated using(public.current_admin_role() in ('owner','admin','editor','reviewer'));

drop policy if exists "editors create entries" on public.mosque_entries;
create policy "editors create entries" on public.mosque_entries
for insert to authenticated with check(public.current_admin_role() in ('owner','admin','editor') and created_by=auth.uid());

drop policy if exists "staff update entries" on public.mosque_entries;
create policy "staff update entries" on public.mosque_entries
for update to authenticated
using(public.current_admin_role() in ('owner','admin','reviewer') or (public.current_admin_role()='editor' and created_by=auth.uid()))
with check(public.current_admin_role() in ('owner','admin','reviewer') or (public.current_admin_role()='editor' and created_by=auth.uid()));

drop policy if exists "admins delete entries" on public.mosque_entries;
create policy "admins delete entries" on public.mosque_entries
for delete to authenticated using(public.current_admin_role() in ('owner','admin'));

drop policy if exists "admin read own profile" on public.admin_profiles;
create policy "admin read own profile" on public.admin_profiles
for select to authenticated using(user_id=auth.uid() or public.current_admin_role() in ('owner','admin'));

drop policy if exists "staff manage donations" on public.donation_records;
create policy "staff manage donations" on public.donation_records
for all to authenticated
using(public.current_admin_role() in ('owner','admin','editor'))
with check(public.current_admin_role() in ('owner','admin','editor'));

insert into storage.buckets(id,name,public)
values('mosque-media','mosque-media',true) on conflict(id) do nothing;

drop policy if exists "public view mosque media" on storage.objects;
create policy "public view mosque media" on storage.objects
for select to anon,authenticated using(bucket_id='mosque-media');

drop policy if exists "staff upload mosque media" on storage.objects;
create policy "staff upload mosque media" on storage.objects
for insert to authenticated
with check(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin','editor'));

drop policy if exists "staff update mosque media" on storage.objects;
create policy "staff update mosque media" on storage.objects
for update to authenticated
using(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin'))
with check(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin'));

-- প্রথম admin তৈরি করুন Auth > Users থেকে; তারপর user UUID দিয়ে:
-- insert into public.admin_profiles(user_id,display_name,role)
-- values('AUTH_USER_UUID','প্রধান প্রশাসক','owner');
