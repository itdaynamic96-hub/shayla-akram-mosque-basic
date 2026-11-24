-- Upgrade an existing Basic mosque database from the old global 500-word
-- rule to an 800-word limit on the history module only.
-- Run this once in the Basic project's Supabase SQL Editor.

create or replace function public.word_count_800(v text) returns boolean
language sql immutable as $$
 select case
   when btrim(coalesce(v,''))='' then 0
   else cardinality(regexp_split_to_array(btrim(v), '\\s+'))
 end <= 800
$$;

alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_body_500_check;
alter table public.mosque_entries
  drop constraint if exists mosque_entries_history_body_800_check;
alter table public.mosque_entries
  add constraint mosque_entries_history_body_800_check
  check (module <> 'itihas' or public.word_count_800(body));

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

notify pgrst, 'reload schema';
