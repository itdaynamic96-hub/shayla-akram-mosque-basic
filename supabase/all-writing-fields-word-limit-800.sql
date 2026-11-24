-- Apply the Basic Mosque 800-word cap to every free-form content field.
-- Run once in the Basic project's Supabase SQL Editor.
create or replace function public.word_count_800(v text) returns boolean
language sql immutable as $$
  select case
    when btrim(coalesce(v,'')) = '' then true
    else cardinality(regexp_split_to_array(btrim(v), '\s+')) <= 800
  end
$$;

create or replace function public.enforce_all_writing_fields_800() returns trigger
language plpgsql as $$
begin
  if not public.word_count_800(new.title) then
    raise exception 'শিরোনাম সর্বোচ্চ ৮০০ শব্দ হতে পারবে।' using errcode='22023';
  end if;
  if not public.word_count_800(new.body) then
    raise exception 'বিবরণ সর্বোচ্চ ৮০০ শব্দ হতে পারবে।' using errcode='22023';
  end if;
  if not public.word_count_800(new.metadata::text) then
    raise exception 'অতিরিক্ত তথ্যের ঘরে সর্বোচ্চ ৮০০ শব্দ হতে পারবে।' using errcode='22023';
  end if;
  return new;
end;
$$;

drop trigger if exists mosque_entry_all_writing_fields_800 on public.mosque_entries;
create trigger mosque_entry_all_writing_fields_800
before insert or update on public.mosque_entries
for each row execute function public.enforce_all_writing_fields_800();

notify pgrst, 'reload schema';
