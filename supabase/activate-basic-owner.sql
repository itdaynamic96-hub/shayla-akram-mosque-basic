-- প্রধান প্রশাসক সক্রিয়করণ: শুধুমাত্র NEW shayla-akram-mosque-basic Project-এ চালান.
-- UUID এবং ইমেইল auth.users-এ না মিললে এই script থেমে যাবে.
do $$
declare
  v_id uuid := 'ee25faa6-ecd8-4e5f-a651-aa6a87764273';
  v_email text := 'itdaynamic96@gmail.com';
begin
  if not exists (
    select 1 from auth.users
    where id = v_id and lower(email) = lower(v_email) and deleted_at is null
  ) then
    raise exception 'Auth user ID/email pair not found in this Supabase project. No profile was changed.';
  end if;

  insert into public.admin_profiles(user_id, display_name, role)
  values (v_id, 'প্রধান প্রশাসক', 'owner')
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        role = 'owner';
end $$;

notify pgrst, 'reload schema';
