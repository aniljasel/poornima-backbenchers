-- 1. Add new columns to profiles table
alter table profiles 
add column if not exists email text,
add column if not exists is_admin boolean default false,
add column if not exists blocked boolean default false;

-- 2. Update the trigger to sync email (Matches new schema)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, updated_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    now()
  );
  return new;
end;
$$;

-- 3. RLS Policies for Admin Access

-- Allow Admins to UPDATE any profile
create policy "Admins can update any profile"
  on profiles for update
  using ( (select is_admin from profiles where id = auth.uid()) = true );

-- Allow Admins to DELETE any profile
create policy "Admins can delete any profile"
  on profiles for delete
  using ( (select is_admin from profiles where id = auth.uid()) = true );

-- 4. IMPORTANT: Make YOURSELF an admin
-- Replace 'your_email@gmail.com' with your actual email address
-- update profiles set is_admin = true where email = 'your_email@gmail.com';
