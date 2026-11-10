-- Borrado de cuenta que pide Apple. Escrita, no aplicada.
-- Borrar auth.users arrastra el perfil y, en cascada, el progreso, las notas,
-- los favoritos y los retos. analytics_events.user_id queda null.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
revoke all on function public.delete_my_account() from authenticated;
grant execute on function public.delete_my_account() to authenticated;
