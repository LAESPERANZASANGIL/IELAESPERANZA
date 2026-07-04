-- ============================================================================
-- Campus La Esperanza - is_active en asignaturas y estudiantes
-- Confirma la regla: entidades de activacion simple (grados, cursos, docentes,
-- estudiantes, areas/asignaturas) usan `is_active`; entidades con ciclo de vida
-- (matriculas, periodos, anios lectivos, procesos de matricula, solicitudes de
-- admision, asistencia, certificados) conservan su columna `estado`.
--
-- docentes ya hereda su estado de profiles.is_active (docentes.id referencia
-- profiles.id 1:1), por lo que no necesita columna propia.
--
-- estudiantes.estado_general ('activo'|'inactivo'|'graduado') se reemplaza por
-- is_active: el estado de graduacion/retiro real ya vive en matriculas.estado
-- (activa|retirada|trasladada|graduada) por año lectivo, asi que estado_general
-- era una duplicacion a nivel de persona.
--
-- Idempotente: seguro de ejecutar mas de una vez.
-- ============================================================================

alter table asignaturas add column if not exists is_active boolean not null default true;

alter table estudiantes add column if not exists is_active boolean not null default true;
update estudiantes set is_active = (estado_general = 'activo')
  where estado_general is not null and is_active is distinct from (estado_general = 'activo');
alter table estudiantes drop column if exists estado_general;

notify pgrst, 'reload schema';
