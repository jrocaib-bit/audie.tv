-- Límite atómico de formularios. Escrita, no aplicada.
-- Solo la service role la ejecuta: no hay grant para anon ni authenticated.

create or replace function public.consumir_limite(p_clave text, p_periodo text, p_inicio timestamptz, p_tope int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual int;
begin
  insert into public.limites_envio as fila (clave, periodo, inicio, cuenta)
  values (p_clave, p_periodo, p_inicio, 1)
  on conflict (clave, periodo, inicio)
  do update set cuenta = fila.cuenta + 1
  where fila.cuenta < p_tope
  returning cuenta into actual;
  return actual is not null;
end;
$$;

revoke all on function public.consumir_limite(text, text, timestamptz, int) from public, anon, authenticated;
