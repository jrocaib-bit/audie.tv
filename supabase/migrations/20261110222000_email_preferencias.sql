-- Preferencias de correo. Escrita, no aplicada.
-- La baja por token la hace una función; el cliente solo lee y actualiza lo suyo.

create table if not exists public.email_preferencias (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  marketing_consent bool not null default false,
  consent_at timestamptz,
  unsubscribed_at timestamptz,
  token uuid not null unique default gen_random_uuid()
);

alter table public.email_preferencias enable row level security;

revoke all on table public.email_preferencias from public;
revoke all on table public.email_preferencias from anon;
revoke all on table public.email_preferencias from authenticated;
grant select on table public.email_preferencias to authenticated;
grant insert (user_id, marketing_consent, consent_at, unsubscribed_at) on table public.email_preferencias to authenticated;
grant update (user_id, marketing_consent, consent_at, unsubscribed_at) on table public.email_preferencias to authenticated;

drop policy if exists "read own email preferences" on public.email_preferencias;
create policy "read own email preferences"
  on public.email_preferencias
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "insert own email preferences" on public.email_preferencias;
create policy "insert own email preferences"
  on public.email_preferencias
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "update own email preferences" on public.email_preferencias;
create policy "update own email preferences"
  on public.email_preferencias
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.unsubscribe_by_token(t uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.email_preferencias
  set marketing_consent = false,
      unsubscribed_at = now()
  where token = t;
end;
$$;

revoke all on function public.unsubscribe_by_token(uuid) from public;
revoke all on function public.unsubscribe_by_token(uuid) from anon;
revoke all on function public.unsubscribe_by_token(uuid) from authenticated;
grant execute on function public.unsubscribe_by_token(uuid) to anon;
grant execute on function public.unsubscribe_by_token(uuid) to authenticated;
