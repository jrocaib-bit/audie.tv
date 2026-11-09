-- Escuchar juntos. Migración no aplicada. Sin cuentas nuevas ni servidor en la app.

create table public.salas (
  codigo text primary key,
  episodio_id text,
  segundo numeric not null default 0 check (segundo >= 0),
  creada timestamptz not null default now()
);

create table public.sala_miembros (
  codigo text not null references public.salas (codigo) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  unido timestamptz not null default now(),
  primary key (codigo, user_id)
);

alter table public.salas enable row level security;
alter table public.sala_miembros enable row level security;

create policy "members read rooms"
  on public.salas for select
  using (exists (select 1 from public.sala_miembros m where m.codigo = salas.codigo and m.user_id = auth.uid()));

create policy "members read membership"
  on public.sala_miembros for select
  using (auth.uid() = user_id);
