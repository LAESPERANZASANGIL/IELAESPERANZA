-- ============================================================================
-- Campus La Esperanza - Estandarizacion de estado y auditoria
-- 1) Unifica todas las columnas booleanas de activo/inactivo en `is_active`
--    (sedes.activa, profiles.activo, grados.activo, grupos.activo).
--    Los enums de ciclo de vida con 3+ estados (anios_lectivos.estado,
--    periodos_academicos.estado, matriculas.estado, procesos_matricula.estado,
--    solicitudes_admision.estado) se DEJAN intactos: convertirlos a un booleano
--    perderia informacion de negocio real.
-- 2) Agrega `updated_at`, `created_by`, `updated_by` a las tablas principales
--    que no los tenian, y un trigger central `set_audit_fields()` que los
--    completa automaticamente usando auth.uid().
-- Idempotente: seguro de ejecutar mas de una vez.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. is_active: agregar, migrar datos, eliminar columna antigua
-- ----------------------------------------------------------------------------
alter table sedes add column if not exists is_active boolean not null default true;
update sedes set is_active = activa where activa is not null and is_active is distinct from activa;
alter table sedes drop column if exists activa;

alter table profiles add column if not exists is_active boolean not null default true;
update profiles set is_active = activo where activo is not null and is_active is distinct from activo;
alter table profiles drop column if exists activo;

alter table grados add column if not exists is_active boolean not null default true;
update grados set is_active = activo where activo is not null and is_active is distinct from activo;
alter table grados drop column if exists activo;

alter table grupos add column if not exists is_active boolean not null default true;
update grupos set is_active = activo where activo is not null and is_active is distinct from activo;
alter table grupos drop column if exists activo;

-- ----------------------------------------------------------------------------
-- 2. Funcion central de auditoria (created_by / updated_by / updated_at)
-- ----------------------------------------------------------------------------
create or replace function set_audit_fields()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.created_by is null then
      new.created_by := auth.uid();
    end if;
    new.updated_by := auth.uid();
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.updated_by := auth.uid();
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 3. Agregar updated_at / created_by / updated_by donde falten
-- ----------------------------------------------------------------------------
alter table sedes add column if not exists updated_at timestamptz not null default now();
alter table sedes add column if not exists created_by uuid references profiles (id) on delete set null;
alter table sedes add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table profiles add column if not exists created_by uuid references profiles (id) on delete set null;
alter table profiles add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table grados add column if not exists updated_at timestamptz not null default now();
alter table grados add column if not exists created_by uuid references profiles (id) on delete set null;
alter table grados add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table grupos add column if not exists updated_at timestamptz not null default now();
alter table grupos add column if not exists created_by uuid references profiles (id) on delete set null;
alter table grupos add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table asignaturas add column if not exists updated_at timestamptz not null default now();
alter table asignaturas add column if not exists created_by uuid references profiles (id) on delete set null;
alter table asignaturas add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table docentes add column if not exists updated_at timestamptz not null default now();
alter table docentes add column if not exists created_by uuid references profiles (id) on delete set null;
alter table docentes add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table estudiantes add column if not exists updated_at timestamptz not null default now();
alter table estudiantes add column if not exists created_by uuid references profiles (id) on delete set null;
alter table estudiantes add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table acudientes add column if not exists updated_at timestamptz not null default now();
alter table acudientes add column if not exists created_by uuid references profiles (id) on delete set null;
alter table acudientes add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table matriculas add column if not exists created_by uuid references profiles (id) on delete set null;
alter table matriculas add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table periodos_academicos add column if not exists updated_at timestamptz not null default now();
alter table periodos_academicos add column if not exists created_by uuid references profiles (id) on delete set null;
alter table periodos_academicos add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table anios_lectivos add column if not exists updated_at timestamptz not null default now();
alter table anios_lectivos add column if not exists created_by uuid references profiles (id) on delete set null;
alter table anios_lectivos add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table malla_curricular add column if not exists updated_at timestamptz not null default now();
alter table malla_curricular add column if not exists created_by uuid references profiles (id) on delete set null;
alter table malla_curricular add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table actividades_evaluacion add column if not exists updated_at timestamptz not null default now();
alter table actividades_evaluacion add column if not exists created_by uuid references profiles (id) on delete set null;
alter table actividades_evaluacion add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table notas add column if not exists created_by uuid references profiles (id) on delete set null;
alter table notas add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table institucion_config add column if not exists created_by uuid references profiles (id) on delete set null;
alter table institucion_config add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table procesos_matricula add column if not exists updated_at timestamptz not null default now();
alter table procesos_matricula add column if not exists created_by uuid references profiles (id) on delete set null;
alter table procesos_matricula add column if not exists updated_by uuid references profiles (id) on delete set null;

alter table solicitudes_admision add column if not exists created_by uuid references profiles (id) on delete set null;
alter table solicitudes_admision add column if not exists updated_by uuid references profiles (id) on delete set null;

-- ----------------------------------------------------------------------------
-- 4. Reemplazar triggers de updated_at por el trigger central de auditoria
-- ----------------------------------------------------------------------------
drop trigger if exists trg_profiles_updated_at on profiles;
drop trigger if exists trg_notas_updated_at on notas;
drop trigger if exists trg_matriculas_updated_at on matriculas;
drop trigger if exists trg_solicitudes_updated_at on solicitudes_admision;
drop trigger if exists trg_institucion_config_updated_at on institucion_config;

drop trigger if exists trg_sedes_audit on sedes;
create trigger trg_sedes_audit before insert or update on sedes
  for each row execute function set_audit_fields();

drop trigger if exists trg_profiles_audit on profiles;
create trigger trg_profiles_audit before insert or update on profiles
  for each row execute function set_audit_fields();

drop trigger if exists trg_grados_audit on grados;
create trigger trg_grados_audit before insert or update on grados
  for each row execute function set_audit_fields();

drop trigger if exists trg_grupos_audit on grupos;
create trigger trg_grupos_audit before insert or update on grupos
  for each row execute function set_audit_fields();

drop trigger if exists trg_asignaturas_audit on asignaturas;
create trigger trg_asignaturas_audit before insert or update on asignaturas
  for each row execute function set_audit_fields();

drop trigger if exists trg_docentes_audit on docentes;
create trigger trg_docentes_audit before insert or update on docentes
  for each row execute function set_audit_fields();

drop trigger if exists trg_estudiantes_audit on estudiantes;
create trigger trg_estudiantes_audit before insert or update on estudiantes
  for each row execute function set_audit_fields();

drop trigger if exists trg_acudientes_audit on acudientes;
create trigger trg_acudientes_audit before insert or update on acudientes
  for each row execute function set_audit_fields();

drop trigger if exists trg_matriculas_audit on matriculas;
create trigger trg_matriculas_audit before insert or update on matriculas
  for each row execute function set_audit_fields();

drop trigger if exists trg_periodos_academicos_audit on periodos_academicos;
create trigger trg_periodos_academicos_audit before insert or update on periodos_academicos
  for each row execute function set_audit_fields();

drop trigger if exists trg_anios_lectivos_audit on anios_lectivos;
create trigger trg_anios_lectivos_audit before insert or update on anios_lectivos
  for each row execute function set_audit_fields();

drop trigger if exists trg_malla_curricular_audit on malla_curricular;
create trigger trg_malla_curricular_audit before insert or update on malla_curricular
  for each row execute function set_audit_fields();

drop trigger if exists trg_actividades_evaluacion_audit on actividades_evaluacion;
create trigger trg_actividades_evaluacion_audit before insert or update on actividades_evaluacion
  for each row execute function set_audit_fields();

drop trigger if exists trg_notas_audit on notas;
create trigger trg_notas_audit before insert or update on notas
  for each row execute function set_audit_fields();

drop trigger if exists trg_institucion_config_audit on institucion_config;
create trigger trg_institucion_config_audit before insert or update on institucion_config
  for each row execute function set_audit_fields();

drop trigger if exists trg_procesos_matricula_audit on procesos_matricula;
create trigger trg_procesos_matricula_audit before insert or update on procesos_matricula
  for each row execute function set_audit_fields();

drop trigger if exists trg_solicitudes_admision_audit on solicitudes_admision;
create trigger trg_solicitudes_admision_audit before insert or update on solicitudes_admision
  for each row execute function set_audit_fields();

notify pgrst, 'reload schema';
