-- Formularios públicos. Escrita, no aplicada.
-- Sin políticas para anon ni authenticated: escribe el servidor con la service role.

create table if not exists public.mensajes_soporte (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  email text not null,
  asunto text not null,
  mensaje text not null,
  ip_hash text
);

create table if not exists public.suscripciones_correo (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  lista text not null check (lista in ('boletin', 'lanzamiento_app')),
  plataforma text check (plataforma in ('ios', 'android', 'ambas')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'baja')),
  token_hash text not null,
  expira timestamptz not null,
  consent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  ip_hash text,
  politica text,
  unique (email, lista)
);

create table if not exists public.limites_envio (
  clave text not null,
  periodo text not null check (periodo in ('hora', 'dia')),
  inicio timestamptz not null,
  cuenta int not null default 0,
  primary key (clave, periodo, inicio)
);

alter table public.mensajes_soporte enable row level security;
alter table public.suscripciones_correo enable row level security;
alter table public.limites_envio enable row level security;

revoke all on table public.mensajes_soporte from public, anon, authenticated;
revoke all on table public.suscripciones_correo from public, anon, authenticated;
revoke all on table public.limites_envio from public, anon, authenticated;
