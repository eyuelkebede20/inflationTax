-- ===========================================================================
-- Seed a superadmin. Run AFTER schema.sql, in the Supabase SQL editor.
--
-- ⚠️  Change the email + password before running, and rotate the password
--     after first login. This inserts straight into auth.users (email/password
--     login) and promotes the row to 'superadmin' in public.profiles.
-- ===========================================================================

do $$
declare
  v_email    text := 'superadmin@inflatax.local';   -- <- change me
  v_password text := 'ChangeMe!2018';               -- <- change me
  v_uid      uuid;
begin
  select id into v_uid from auth.users where email = v_email;

  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      v_email, crypt(v_password, gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Super Admin"}'::jsonb,
      now(), now()
    );
  end if;

  -- handle_new_user() may have created the profile; force the superadmin role.
  insert into public.profiles (id, full_name, role)
  values (v_uid, 'Super Admin', 'superadmin')
  on conflict (id) do update set role = 'superadmin';
end $$;
