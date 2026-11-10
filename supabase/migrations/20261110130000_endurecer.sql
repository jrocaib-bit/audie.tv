-- Endurece lo que marcan los advisors. Idempotente.
-- No cambia el comportamiento de «Juntos»: la pantalla solo genera un código
-- en el cliente y no escribe salas ni sala_miembros.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
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

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
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
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

create index if not exists notas_user_id_idx on public.notas (user_id);
create index if not exists sala_miembros_user_id_idx on public.sala_miembros (user_id);

revoke insert, update, delete on table public.subscription_status from public;
revoke insert, update, delete on table public.subscription_status from anon;
revoke insert, update, delete on table public.subscription_status from authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

drop policy if exists "read own progress" on public.listening_progress;
create policy "read own progress"
  on public.listening_progress for select
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own progress" on public.listening_progress;
create policy "insert own progress"
  on public.listening_progress for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "update own progress" on public.listening_progress;
create policy "update own progress"
  on public.listening_progress for update
  using ((select auth.uid()) = user_id);

drop policy if exists "read own listening days" on public.listening_days;
create policy "read own listening days"
  on public.listening_days for select
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own listening days" on public.listening_days;
create policy "insert own listening days"
  on public.listening_days for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "read own subscription" on public.subscription_status;
create policy "read own subscription"
  on public.subscription_status for select
  using ((select auth.uid()) = user_id);

drop policy if exists "read own favorites" on public.favoritos;
create policy "read own favorites"
  on public.favoritos for select
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own favorites" on public.favoritos;
create policy "insert own favorites"
  on public.favoritos for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete own favorites" on public.favoritos;
create policy "delete own favorites"
  on public.favoritos for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "read own notes" on public.notas;
create policy "read own notes"
  on public.notas for select
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own notes" on public.notas;
create policy "insert own notes"
  on public.notas for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "update own notes" on public.notas;
create policy "update own notes"
  on public.notas for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "delete own notes" on public.notas;
create policy "delete own notes"
  on public.notas for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "members read rooms" on public.salas;
create policy "members read rooms"
  on public.salas for select
  using (exists (
    select 1 from public.sala_miembros m
    where m.codigo = salas.codigo and m.user_id = (select auth.uid())
  ));

drop policy if exists "members read membership" on public.sala_miembros;
create policy "members read membership"
  on public.sala_miembros for select
  using ((select auth.uid()) = user_id);
