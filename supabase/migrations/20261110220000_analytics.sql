-- Medición y progreso de retos. Escrita, no aplicada.
-- INSERT anónimo o del propio usuario. Nadie lee los eventos por la API.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id uuid references public.profiles (id) on delete set null,
  session_id text,
  platform text check (platform in ('web', 'ios', 'android')),
  app_version text,
  locale text,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  constraint analytics_events_name_chk check (event_name ~ '^[a-z_]{2,48}$'),
  constraint analytics_events_properties_chk check (octet_length(properties::text) < 4096)
);

create index if not exists analytics_events_occurred_at_idx on public.analytics_events (occurred_at);
create index if not exists analytics_events_name_occurred_idx on public.analytics_events (event_name, occurred_at);
create index if not exists analytics_events_user_occurred_idx on public.analytics_events (user_id, occurred_at);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from public;
revoke all on table public.analytics_events from anon;
revoke all on table public.analytics_events from authenticated;
grant insert on table public.analytics_events to anon;
grant insert on table public.analytics_events to authenticated;

drop policy if exists "anon insert anonymous events" on public.analytics_events;
create policy "anon insert anonymous events"
  on public.analytics_events
  for insert
  to anon
  with check (user_id is null);

drop policy if exists "authenticated insert own events" on public.analytics_events;
create policy "authenticated insert own events"
  on public.analytics_events
  for insert
  to authenticated
  with check (user_id is null or user_id = (select auth.uid()));

create table if not exists public.reto_progreso (
  user_id uuid not null references public.profiles (id) on delete cascade,
  reto_id text not null,
  dia int not null check (dia > 0),
  fecha_local date,
  completed_at timestamptz,
  episode_id text,
  primary key (user_id, reto_id, dia)
);

alter table public.reto_progreso enable row level security;

revoke all on table public.reto_progreso from public;
revoke all on table public.reto_progreso from anon;
revoke all on table public.reto_progreso from authenticated;
grant select, insert, update on table public.reto_progreso to authenticated;

drop policy if exists "read own challenge progress" on public.reto_progreso;
create policy "read own challenge progress"
  on public.reto_progreso
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own challenge progress" on public.reto_progreso;
create policy "insert own challenge progress"
  on public.reto_progreso
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "update own challenge progress" on public.reto_progreso;
create policy "update own challenge progress"
  on public.reto_progreso
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
