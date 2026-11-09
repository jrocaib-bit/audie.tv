-- Esquema para sincronizar favoritos y notas en el futuro.
-- No está aplicado. No crea cuentas ni cambia la autenticación.
-- La app guarda estos datos solo en el dispositivo.

create table public.favoritos (
  user_id uuid not null references public.profiles (id) on delete cascade,
  episode_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

create table public.notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  episode_id text not null,
  versiculo text,
  texto text not null,
  segundo numeric check (segundo is null or segundo >= 0),
  created_at timestamptz not null default now()
);

alter table public.favoritos enable row level security;
alter table public.notas enable row level security;

create policy "read own favorites"
  on public.favoritos for select
  using (auth.uid() = user_id);

create policy "insert own favorites"
  on public.favoritos for insert
  with check (auth.uid() = user_id);

create policy "delete own favorites"
  on public.favoritos for delete
  using (auth.uid() = user_id);

create policy "read own notes"
  on public.notas for select
  using (auth.uid() = user_id);

create policy "insert own notes"
  on public.notas for insert
  with check (auth.uid() = user_id);

create policy "delete own notes"
  on public.notas for delete
  using (auth.uid() = user_id);
