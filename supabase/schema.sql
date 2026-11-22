-- নতুন Basic mosque website: আলাদা Supabase project-এ SQL Editor থেকে চালাতে হবে।
create extension if not exists pgcrypto;
create table if not exists public.admin_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 role text not null default 'editor' check (role in ('owner','admin','editor','reviewer')),
 created_at timestamptz not null default now()
);
create table if not exists public.mosque_entries (
 id uuid primary key default gen_random_uuid(),
 module text not null check (module in ('mosjid-porichiti','itihas','motawalli','committee','prayer','special-prayer','notices','news','islamic-learning','imam','services','donations','gallery','contact')),
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
create or replace function public.word_count_500(v text) returns boolean language sql immutable as $$
 select cardinality(regexp_split_to_array(trim(coalesce(v,'')), '\s+')) <= 500
$$;
create or replace function public.enforce_entry_word_limit() returns trigger language plpgsql as $$
begin
 if not public.word_count_500(new.body) then
   raise exception 'বিবরণ সর্বোচ্চ ৫০০ শব্দ হতে পারবে।' using errcode='22023';
 end if;
 new.updated_at=now();
 if new.status='published' and old.status is distinct from 'published' then new.published_at=now(); end if;
 return new;
end; $$;
drop trigger if exists mosque_entry_word_limit on public.mosque_entries;
create trigger mosque_entry_word_limit before insert or update on public.mosque_entries for each row execute function public.enforce_entry_word_limit();
create or replace function public.current_admin_role() returns text language sql stable security definer set search_path=public as $$
 select role from public.admin_profiles where user_id=auth.uid()
$$;
alter table public.admin_profiles enable row level security;
alter table public.mosque_entries enable row level security;
alter table public.donation_records enable row level security;
drop policy if exists "public read published entries" on public.mosque_entries;
create policy "public read published entries" on public.mosque_entries for select to anon,authenticated using (status='published');
drop policy if exists "staff read all entries" on public.mosque_entries;
create policy "staff read all entries" on public.mosque_entries for select to authenticated using (public.current_admin_role() in ('owner','admin','editor','reviewer'));
drop policy if exists "editors create entries" on public.mosque_entries;
create policy "editors create entries" on public.mosque_entries for insert to authenticated with check (public.current_admin_role() in ('owner','admin','editor') and created_by=auth.uid());
drop policy if exists "editors update entries" on public.mosque_entries;
create policy "editors update entries" on public.mosque_entries for update to authenticated using (public.current_admin_role() in ('owner','admin','editor','reviewer')) with check (public.current_admin_role() in ('owner','admin','editor','reviewer'));
drop policy if exists "admin read own profile" on public.admin_profiles;
create policy "admin read own profile" on public.admin_profiles for select to authenticated using (user_id=auth.uid() or public.current_admin_role() in ('owner','admin'));
drop policy if exists "staff manage donations" on public.donation_records;
create policy "staff manage donations" on public.donation_records for all to authenticated using (public.current_admin_role() in ('owner','admin','editor')) with check (public.current_admin_role() in ('owner','admin','editor'));
-- Storage bucket (public read, authenticated admin upload). Run after checking bucket does not already exist.
insert into storage.buckets(id,name,public) values('mosque-media','mosque-media',true) on conflict(id) do nothing;
drop policy if exists "public view mosque media" on storage.objects;
create policy "public view mosque media" on storage.objects for select to anon,authenticated using(bucket_id='mosque-media');
drop policy if exists "staff upload mosque media" on storage.objects;
create policy "staff upload mosque media" on storage.objects for insert to authenticated with check(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin','editor'));
drop policy if exists "staff update mosque media" on storage.objects;
create policy "staff update mosque media" on storage.objects for update to authenticated using(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin')) with check(bucket_id='mosque-media' and public.current_admin_role() in ('owner','admin'));
-- প্রথম অ্যাডমিন Auth > Users থেকে তৈরি করার পর নিচের statement-এ তার UUID বসিয়ে একবার চালান।
-- insert into public.admin_profiles(user_id,display_name,role) values('AUTH_USER_UUID','প্রধান প্রশাসক','owner');
