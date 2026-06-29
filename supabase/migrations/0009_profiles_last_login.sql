-- ============================================================================
-- Campus La Esperanza - Profiles: base solida de columnas de usuario
-- 1) last_login_at: registra el ultimo inicio de sesion exitoso.
-- 2) Permisos explicitos sobre must_change_password para PostgREST
--    (evita errores de schema cache en proyectos con cache desactualizado).
-- 3) Funcion update_last_login() para registrar el login desde el cliente.
-- Idempotente: seguro de ejecutar mas de una vez.
-- ============================================================================

alter table profiles add column if not exists last_login_at timestamptz;

-- Permisos explicitos para que PostgREST exponga las columnas nuevas
grant select (must_change_password) on profiles to authenticated;
grant update (must_change_password) on profiles to authenticated;
grant select (last_login_at) on profiles to authenticated;
grant update (last_login_at) on profiles to authenticated;

-- Funcion para registrar el ultimo login (llamada desde el cliente tras auth exitosa)
create or replace function update_last_login()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set last_login_at = now() where id = auth.uid();
$$;

grant execute on function update_last_login() to authenticated;

-- Funcion para leer must_change_password sin depender del schema cache
create or replace function get_must_change_password(user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select must_change_password from profiles where id = user_id;
$$;

grant execute on function get_must_change_password(uuid) to authenticated;

-- Funcion para limpiar must_change_password tras cambio de contrasena
create or replace function clear_must_change_password()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set must_change_password = false where id = auth.uid();
$$;

grant execute on function clear_must_change_password() to authenticated;

notify pgrst, 'reload schema';
