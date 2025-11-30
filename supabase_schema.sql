-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  course text,
  enrollment_no text,
  updated_at timestamp with time zone,
  last_login timestamp with time zone,
  login_count integer default 0,
  is_admin boolean default false,
  constraint username_length check (char_length(full_name) >= 3)
);

-- Safely add columns if they don't exist (for existing tables)
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text default 'student' check (role in ('admin', 'moderator', 'teacher', 'student', 'guest'));
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean default false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count integer default 0;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS enrollment_no text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Set up Row Level Security (RLS) for profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- NOTES TABLE
create table if not exists public.notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  subject text,
  "fileUrl" text, -- Quoted because code uses camelCase
  storagePath text,
  user_id uuid references auth.users,
  download_count integer default 0,
  status text default 'approved' check (status in ('pending', 'approved', 'rejected')),
  version integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Safely add columns for notes
DO $$
BEGIN
    ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS user_id uuid references auth.users;
    ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS storagePath text;
    ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS download_count integer default 0;
    ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS status text default 'approved' check (status in ('pending', 'approved', 'rejected'));
    ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS version integer default 1;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  type text default 'info' check (type in ('info', 'warning', 'success', 'important')),
  target_audience text default 'all' check (target_audience in ('all', 'students', 'teachers')),
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for announcements
alter table public.announcements enable row level security;

drop policy if exists "Announcements are viewable by everyone" on announcements;
create policy "Announcements are viewable by everyone"
  on announcements for select
  using ( true );

drop policy if exists "Admins can insert announcements" on announcements;
create policy "Admins can insert announcements"
  on announcements for insert
  with check ( exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or is_admin = true)) );

drop policy if exists "Admins can delete announcements" on announcements;
create policy "Admins can delete announcements"
  on announcements for delete
  using ( exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or is_admin = true)) );

-- RLS for notes
alter table public.notes enable row level security;

drop policy if exists "Notes are viewable by everyone" on notes;
create policy "Notes are viewable by everyone"
  on notes for select
  using ( true );

-- TODOS TABLE
create table if not exists public.todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  task text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for todos
alter table public.todos enable row level security;

drop policy if exists "Users can view their own todos" on todos;
create policy "Users can view their own todos"
  on todos for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own todos" on todos;
create policy "Users can insert their own todos"
  on todos for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own todos" on todos;
create policy "Users can update their own todos"
  on todos for update
  using ( auth.uid() = user_id );

drop policy if exists "Users can delete their own todos" on todos;
create policy "Users can delete their own todos"
  on todos for delete
  using ( auth.uid() = user_id );

-- REMINDERS TABLE
create table if not exists public.reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  reminder_date timestamp with time zone not null,
  type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for reminders
alter table public.reminders enable row level security;

drop policy if exists "Users can view their own reminders" on reminders;
create policy "Users can view their own reminders"
  on reminders for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own reminders" on reminders;
create policy "Users can insert their own reminders"
  on reminders for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can delete their own reminders" on reminders;
create policy "Users can delete their own reminders"
  on reminders for delete
  using ( auth.uid() = user_id );

-- BOOKMARKS TABLE
create table if not exists public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  note_id uuid references public.notes(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, note_id)
);

-- RLS for bookmarks
alter table public.bookmarks enable row level security;

drop policy if exists "Users can view their own bookmarks" on bookmarks;
create policy "Users can view their own bookmarks"
  on bookmarks for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own bookmarks" on bookmarks;
create policy "Users can insert their own bookmarks"
  on bookmarks for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can delete their own bookmarks" on bookmarks;
create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using ( auth.uid() = user_id );

-- NOTE_HISTORY TABLE
create table if not exists public.note_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  note_id uuid references public.notes(id) on delete cascade not null,
  action_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for note_history
alter table public.note_history enable row level security;

drop policy if exists "Users can view their own history" on note_history;
create policy "Users can view their own history"
  on note_history for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own history" on note_history;
create policy "Users can insert their own history"
  on note_history for insert
  with check ( auth.uid() = user_id );

-- Function to handle new user signup (automatically create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
