-- Sección de libros: catálogo, capítulos, referencias y anotaciones del lector.
-- No está aplicada. No crea cuentas ni cambia la autenticación. No inserta manuscritos.
-- El texto lo cargará un job de ingesta con la service role. El repositorio es público y no lo contiene.
--
-- Reglas:
--   * El catálogo es de lectura pública solo en metadatos (privilegios por columna).
--   * `json_contenido` no se puede seleccionar con anon ni authenticated. Solo se sirve por la función
--     `libros_capitulo_contenido`, que lo devuelve si el capítulo es de adelanto o si la cuenta tiene
--     `subscription_status.status = 'active'`.
--   * Las tablas de usuario son de cada cual (auth.uid() = user_id).
--   * `amazon_kindle_url` no es legible desde el cliente: solo la web lo lee, con la service role.
--
-- Anclas: `capitulo_id` en las tablas de usuario es la clave del capítulo dentro del libro, igual que
-- en el JSON canónico (`prologo`, `capitulo-01`, `epilogo`, `bibliografia`) y que en la web y la app.
-- Por eso `libros_capitulos` lleva `capitulo_clave` además de su id global.

create table public.libros (
  id text primary key,
  slug text unique not null,
  volumen integer not null,
  titulo text not null,
  subtitulo text,
  libro_biblico text not null,
  libro_id text not null,
  estado text not null check (estado in ('borrador', 'completo', 'publicado')),
  idioma text not null default 'es',
  palabras integer,
  adelanto_hasta_capitulo_id text,
  audiolibro_estado text not null default 'previsto' check (audiolibro_estado in ('previsto', 'disponible')),
  amazon_paperback_url text,
  amazon_kindle_url text,
  sinopsis text,
  portada_url text,
  publicado_at timestamptz
);

create table public.libros_capitulos (
  id text primary key,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_clave text not null,
  orden integer not null,
  tipo text not null check (tipo in ('prologo', 'capitulo', 'epilogo', 'bibliografia')),
  numero integer,
  titulo text not null,
  es_adelanto boolean not null default false,
  json_contenido jsonb not null,
  unique (libro_id, capitulo_clave),
  unique (libro_id, orden)
);

create table public.libros_referencias (
  id bigint generated always as identity primary key,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_id text not null references public.libros_capitulos (id) on delete cascade,
  bloque_id text not null,
  raw text not null,
  escritura_libro_id text not null,
  capitulo_inicio integer not null,
  versiculo_inicio integer,
  capitulo_fin integer,
  versiculo_fin integer,
  episodio_id text
);

create index libros_referencias_episodio_idx on public.libros_referencias (episodio_id);
create index libros_referencias_libro_escritura_idx on public.libros_referencias (libro_id, escritura_libro_id);

create table public.libros_progreso (
  user_id uuid not null references public.profiles (id) on delete cascade,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_id text not null,
  bloque_id text,
  ratio numeric check (ratio is null or (ratio >= 0 and ratio <= 1)),
  updated_at timestamptz not null default now(),
  primary key (user_id, libro_id)
);

create table public.libros_marcadores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_id text not null,
  bloque_id text,
  created_at timestamptz not null default now()
);

create table public.libros_subrayados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_id text not null,
  bloque_id text not null,
  inicio integer not null default 0 check (inicio >= 0),
  fin integer not null,
  color text not null default 'oro',
  created_at timestamptz not null default now(),
  check (fin > inicio)
);

create table public.libros_notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  libro_id text not null references public.libros (id) on delete cascade,
  capitulo_id text not null,
  bloque_id text,
  subrayado_id uuid references public.libros_subrayados (id) on delete set null,
  texto text not null check (char_length(texto) between 1 and 600),
  created_at timestamptz not null default now()
);

create index libros_marcadores_usuario_idx on public.libros_marcadores (user_id, libro_id);
create index libros_subrayados_usuario_idx on public.libros_subrayados (user_id, libro_id);
create index libros_notas_usuario_idx on public.libros_notas (user_id, libro_id);

alter table public.libros enable row level security;
alter table public.libros_capitulos enable row level security;
alter table public.libros_referencias enable row level security;
alter table public.libros_progreso enable row level security;
alter table public.libros_marcadores enable row level security;
alter table public.libros_subrayados enable row level security;
alter table public.libros_notas enable row level security;

-- Catálogo: solo metadatos y solo lo que no es borrador.
create policy "read libros no borrador"
  on public.libros for select
  to anon, authenticated
  using (estado in ('completo', 'publicado'));

create policy "read capitulos metadatos"
  on public.libros_capitulos for select
  to anon, authenticated
  using (exists (select 1 from public.libros l where l.id = libros_capitulos.libro_id and l.estado in ('completo', 'publicado')));

create policy "read referencias"
  on public.libros_referencias for select
  to anon, authenticated
  using (exists (select 1 from public.libros l where l.id = libros_referencias.libro_id and l.estado in ('completo', 'publicado')));

-- Privilegios por columna: el contenido y el enlace de Kindle quedan fuera del alcance del cliente.
revoke all on table public.libros from anon, authenticated;
revoke all on table public.libros_capitulos from anon, authenticated;
revoke all on table public.libros_referencias from anon, authenticated;

grant select (id, slug, volumen, titulo, subtitulo, libro_biblico, libro_id, estado, idioma, palabras, adelanto_hasta_capitulo_id, audiolibro_estado, amazon_paperback_url, sinopsis, portada_url, publicado_at)
  on public.libros to anon, authenticated;
grant select (id, libro_id, capitulo_clave, orden, tipo, numero, titulo, es_adelanto)
  on public.libros_capitulos to anon, authenticated;
grant select on public.libros_referencias to anon, authenticated;

-- Contenido de un capítulo: adelanto para todos, el resto solo con suscripción activa.
create function public.libros_capitulo_contenido(p_libro_id text, p_capitulo_clave text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select c.json_contenido
  from public.libros_capitulos c
  join public.libros l on l.id = c.libro_id
  where c.libro_id = p_libro_id
    and c.capitulo_clave = p_capitulo_clave
    and l.estado in ('completo', 'publicado')
    and (
      c.es_adelanto
      or exists (
        select 1 from public.subscription_status s
        where s.user_id = auth.uid() and s.status = 'active'
      )
    );
$$;

revoke all on function public.libros_capitulo_contenido(text, text) from public;
grant execute on function public.libros_capitulo_contenido(text, text) to anon, authenticated;

-- Anotaciones: cada cual lo suyo.
create policy "read own libros progreso" on public.libros_progreso for select using (auth.uid() = user_id);
create policy "insert own libros progreso" on public.libros_progreso for insert with check (auth.uid() = user_id);
create policy "update own libros progreso" on public.libros_progreso for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own libros progreso" on public.libros_progreso for delete using (auth.uid() = user_id);

create policy "read own libros marcadores" on public.libros_marcadores for select using (auth.uid() = user_id);
create policy "insert own libros marcadores" on public.libros_marcadores for insert with check (auth.uid() = user_id);
create policy "delete own libros marcadores" on public.libros_marcadores for delete using (auth.uid() = user_id);

create policy "read own libros subrayados" on public.libros_subrayados for select using (auth.uid() = user_id);
create policy "insert own libros subrayados" on public.libros_subrayados for insert with check (auth.uid() = user_id);
create policy "update own libros subrayados" on public.libros_subrayados for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own libros subrayados" on public.libros_subrayados for delete using (auth.uid() = user_id);

create policy "read own libros notas" on public.libros_notas for select using (auth.uid() = user_id);
create policy "insert own libros notas" on public.libros_notas for insert with check (auth.uid() = user_id);
create policy "update own libros notas" on public.libros_notas for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own libros notas" on public.libros_notas for delete using (auth.uid() = user_id);

revoke all on table public.libros_progreso, public.libros_marcadores, public.libros_subrayados, public.libros_notas from anon;
grant select, insert, update, delete on public.libros_progreso, public.libros_marcadores, public.libros_subrayados, public.libros_notas to authenticated;
