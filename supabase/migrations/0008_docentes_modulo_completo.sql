-- ============================================================================
-- Campus La Esperanza - Fase 3: modulo completo de docentes
-- 1) Datos extendidos de hoja de vida en `docentes`.
-- 2) `profiles.must_change_password`: fuerza cambio de contrasena en el primer
--    ingreso cuando un administrador crea el usuario con contrasena temporal.
-- 3) Un docente solo puede ser director de UN curso por anio lectivo
--    (un curso ya solo admite un director porque director_grupo_id es una
--    sola columna en grupos).
-- 4) Los usuarios no-staff no pueden modificar campos restringidos de su
--    propio perfil (role, is_active, sede_id, documento_tipo, documento_numero).
-- Idempotente: seguro de ejecutar mas de una vez.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Datos extendidos de docentes
-- ----------------------------------------------------------------------------
alter table docentes add column if not exists fecha_nacimiento date;
alter table docentes add column if not exists sexo text;
alter table docentes add column if not exists direccion text;
alter table docentes add column if not exists municipio text;
alter table docentes add column if not exists departamento text;
alter table docentes add column if not exists telefono text;
alter table docentes add column if not exists correo_personal text;
alter table docentes add column if not exists profesion text;
alter table docentes add column if not exists escalafon text;

-- ----------------------------------------------------------------------------
-- 2. must_change_password
-- ----------------------------------------------------------------------------
alter table profiles add column if not exists must_change_password boolean not null default false;

-- ----------------------------------------------------------------------------
-- 3. Un docente, un curso director por anio lectivo
-- ----------------------------------------------------------------------------
create unique index if not exists ux_grupos_director_unico_por_anio
  on grupos (anio_lectivo_id, director_grupo_id)
  where director_grupo_id is not null;

-- ----------------------------------------------------------------------------
-- 4. Restringir auto-edicion de campos sensibles del perfil
-- ----------------------------------------------------------------------------
create or replace function guard_profile_self_update()
returns trigger as $$
begin
  if not is_staff() then
    new.role := old.role;
    new.is_active := old.is_active;
    new.sede_id := old.sede_id;
    new.documento_tipo := old.documento_tipo;
    new.documento_numero := old.documento_numero;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_guard_profile_self_update on profiles;
create trigger trg_guard_profile_self_update before update on profiles
  for each row execute function guard_profile_self_update();

notify pgrst, 'reload schema';
