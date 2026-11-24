-- Preparada, no aplicada en producción.
-- Reto iniciado = fila. dia = 0 es la inscripción; dia > 0, un día completado.
-- Anónimos (web sin cuenta): tabla aparte, sin ningún GRANT ni política para anon/authenticated;
-- solo se escribe con la RPC de abajo y nadie la lee por la API (el session_id es un uuid aleatorio de cliente).

alter table public.reto_progreso drop constraint if exists reto_progreso_dia_check;
alter table public.reto_progreso add constraint reto_progreso_dia_check check (dia >= 0);

create table if not exists public.reto_progreso_anonimo (
  session_id uuid not null,
  reto_id text not null check (char_length(reto_id) between 1 and 64),
  dia int not null check (dia >= 0 and dia <= 400),
  fecha_local date,
  completed_at timestamptz,
  episode_id text check (episode_id is null or char_length(episode_id) <= 64),
  created_at timestamptz not null default now(),
  primary key (session_id, reto_id, dia)
);

alter table public.reto_progreso_anonimo enable row level security;
revoke all on table public.reto_progreso_anonimo from public, anon, authenticated;

create or replace function public.registrar_reto_anonimo(p_session_id uuid, p_reto_id text, p_dia int, p_episode_id text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_session_id is null or p_reto_id is null or char_length(p_reto_id) not between 1 and 64 or p_dia is null or p_dia not between 0 and 400 then
    raise exception 'datos no válidos';
  end if;
  insert into public.reto_progreso_anonimo (session_id, reto_id, dia, fecha_local, completed_at, episode_id)
  values (p_session_id, p_reto_id, p_dia, (now() at time zone 'utc')::date, case when p_dia > 0 then now() end, left(p_episode_id, 64))
  on conflict (session_id, reto_id, dia) do update
    set completed_at = coalesce(public.reto_progreso_anonimo.completed_at, excluded.completed_at),
        episode_id = coalesce(excluded.episode_id, public.reto_progreso_anonimo.episode_id);
end;
$$;

revoke all on function public.registrar_reto_anonimo(uuid, text, int, text) from public;
grant execute on function public.registrar_reto_anonimo(uuid, text, int, text) to anon, authenticated;
