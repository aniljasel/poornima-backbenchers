-- 1. Sync emails from auth.users to profiles (Backfill existing users)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

-- 2. Make the specific user an admin
update public.profiles 
set is_admin = true 
where email = 'schedule.manager4@gmail.com';

-- 3. Verify the result (Optional: Check the output in Supabase)
select email, is_admin from public.profiles where email = 'schedule.manager4@gmail.com';
