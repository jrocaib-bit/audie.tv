-- Listening data for a future, empty Supabase project.
-- Subscription status is plain data. There is no payment provider, price, or checkout.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.listening_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  episode_id text not null,
  position_seconds numeric not null default 0 check (position_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table public.listening_days (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

create table public.subscription_status (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'none' check (status in ('none', 'pending', 'active', 'inactive')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listening_progress enable row level security;
alter table public.listening_days enable row level security;
alter table public.subscription_status enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "read own progress"
  on public.listening_progress for select
  using (auth.uid() = user_id);

create policy "insert own progress"
  on public.listening_progress for insert
  with check (auth.uid() = user_id);

create policy "update own progress"
  on public.listening_progress for update
  using (auth.uid() = user_id);

create policy "read own listening days"
  on public.listening_days for select
  using (auth.uid() = user_id);

create policy "insert own listening days"
  on public.listening_days for insert
  with check (auth.uid() = user_id);

create policy "read own subscription"
  on public.subscription_status for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.subscription_status (user_id, status) values (new.id, 'none');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
