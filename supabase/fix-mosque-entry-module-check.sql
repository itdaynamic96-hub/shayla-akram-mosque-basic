-- Fix the legacy module constraint in the NEW shayla-akram-mosque-basic project.
-- This replaces the older module allow-list with the website's 15 fixed module slugs.
do $$
begin
  if to_regclass('public.mosque_entries') is null then
    raise exception 'public.mosque_entries table was not found. Confirm the NEW Basic Supabase project is selected.';
  end if;
end $$;

alter table public.mosque_entries
  drop constraint if exists mosque_entries_module_check;
alter table public.mosque_entries
  drop constraint if exists mosque_entries_basic_module_check;

alter table public.mosque_entries
  add constraint mosque_entries_module_check
  check (module in (
    'home',
    'mosjid-porichiti',
    'itihas',
    'motawalli',
    'committee',
    'prayer',
    'special-prayer',
    'notices',
    'news',
    'islamic-learning',
    'imam',
    'services',
    'donations',
    'gallery',
    'contact'
  ));

notify pgrst, 'reload schema';
