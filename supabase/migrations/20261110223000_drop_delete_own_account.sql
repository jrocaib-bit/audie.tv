-- Quita el borrado antiguo de auth_cuenta. Lo sustituye public.delete_my_account().
-- Escrita, no aplicada.

drop function if exists public.delete_own_account();
