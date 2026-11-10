-- Alta y borrado de cuenta. No está aplicada.
-- Las tablas de perfil, progreso, favoritos y notas viven en las migraciones anteriores.
-- Esta añade el perfil automático y el borrado que iOS exige.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  insert into public.subscription_status (user_id, status)
  values (new.id, 'none')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notas where user_id = auth.uid();
  delete from public.favoritos where user_id = auth.uid();
  delete from public.listening_progress where user_id = auth.uid();
  delete from public.listening_days where user_id = auth.uid();
  delete from public.subscription_status where user_id = auth.uid();
  delete from public.profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
