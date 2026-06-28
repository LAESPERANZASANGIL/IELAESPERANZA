-- ============================================================================
-- IE La Esperanza - Esquema inicial (Fase 1: nucleo + matricula + academico)
-- Ver docs/adr/0001-matriculas-como-entidad-central.md para el razonamiento
-- detras de `matriculas` como entidad central del modelo academico.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum (
  'rector',
  'administrador',
  'secretaria',
  'docente',
  'padre_familia',
  'estudiante'
);

create type estado_anio_lectivo as enum ('planeado', 'activo', 'cerrado');
create type estado_proceso_matricula as enum ('planeado', 'abierto', 'cerrado');
create type estado_solicitud_admision as enum ('pendiente', 'en_revision', 'admitido', 'rechazado');
create type estado_matricula as enum ('activa', 'retirada', 'trasladada', 'graduada');
create type estado_periodo as enum ('planeado', 'activo', 'cerrado');
create type estado_asistencia as enum ('presente', 'ausente', 'tarde', 'excusa');
create type nivel_educativo as enum ('preescolar', 'primaria', 'secundaria', 'media');

-- ----------------------------------------------------------------------------
-- Core: sedes, anios lectivos, perfiles
-- ----------------------------------------------------------------------------
create table sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  codigo_dane text,
  direccion text,
  telefono text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

create table anios_lectivos (
  id uuid primary key default gen_random_uuid(),
  anio int not null unique,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado estado_anio_lectivo not null default 'planeado',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  phone text,
  documento_tipo text,
  documento_numero text,
  avatar_url text,
  sede_id uuid references sedes (id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_profiles_documento on profiles (documento_numero) where documento_numero is not null;

-- ----------------------------------------------------------------------------
-- Academico: grados, grupos, docentes, asignaturas, periodos, malla curricular
-- ----------------------------------------------------------------------------
create table grados (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel nivel_educativo not null,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

create table grupos (
  id uuid primary key default gen_random_uuid(),
  grado_id uuid not null references grados (id) on delete cascade,
  anio_lectivo_id uuid not null references anios_lectivos (id) on delete cascade,
  sede_id uuid references sedes (id) on delete set null,
  nombre text not null, -- ej. "6-1"
  director_grupo_id uuid references profiles (id) on delete set null,
  capacidad int,
  created_at timestamptz not null default now(),
  unique (grado_id, anio_lectivo_id, nombre)
);

create table docentes (
  id uuid primary key references profiles (id) on delete cascade,
  especialidad text,
  tipo_contrato text,
  fecha_ingreso date,
  created_at timestamptz not null default now()
);

create table asignaturas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  area text,
  descripcion text,
  created_at timestamptz not null default now()
);

create table periodos_academicos (
  id uuid primary key default gen_random_uuid(),
  anio_lectivo_id uuid not null references anios_lectivos (id) on delete cascade,
  nombre text not null, -- ej. "Periodo 1"
  orden int not null default 0,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado estado_periodo not null default 'planeado',
  created_at timestamptz not null default now(),
  unique (anio_lectivo_id, nombre)
);

-- Malla curricular: que asignatura se imparte en que grupo y quien la ensena
create table malla_curricular (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos (id) on delete cascade,
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  docente_id uuid references docentes (id) on delete set null,
  intensidad_horaria int,
  created_at timestamptz not null default now(),
  unique (grupo_id, asignatura_id)
);

-- ----------------------------------------------------------------------------
-- Estudiantes y acudientes (entidades atemporales, sin grupo directo)
-- ----------------------------------------------------------------------------
create table estudiantes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null, -- null si el estudiante no tiene cuenta propia
  documento_tipo text,
  documento_numero text,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date,
  genero text,
  estado_general text not null default 'activo', -- activo | inactivo | graduado
  created_at timestamptz not null default now()
);

create unique index idx_estudiantes_documento on estudiantes (documento_numero) where documento_numero is not null;

create table acudientes (
  id uuid primary key references profiles (id) on delete cascade,
  ocupacion text,
  lugar_trabajo text,
  created_at timestamptz not null default now()
);

create table estudiante_acudientes (
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  acudiente_id uuid not null references acudientes (id) on delete cascade,
  parentesco text,
  es_acudiente_principal boolean not null default false,
  primary key (estudiante_id, acudiente_id)
);

-- ----------------------------------------------------------------------------
-- Matricula: procesos, solicitudes y matriculas (entidad central)
-- ----------------------------------------------------------------------------
create table procesos_matricula (
  id uuid primary key default gen_random_uuid(),
  anio_lectivo_id uuid not null references anios_lectivos (id) on delete cascade,
  nombre text not null,
  fecha_apertura date not null,
  fecha_cierre date not null,
  estado estado_proceso_matricula not null default 'planeado',
  created_at timestamptz not null default now()
);

create table solicitudes_admision (
  id uuid primary key default gen_random_uuid(),
  proceso_matricula_id uuid not null references procesos_matricula (id) on delete cascade,
  aspirante_nombres text not null,
  aspirante_apellidos text not null,
  aspirante_documento text,
  fecha_nacimiento date,
  grado_solicitado_id uuid references grados (id) on delete set null,
  acudiente_id uuid references acudientes (id) on delete set null,
  estado estado_solicitud_admision not null default 'pendiente',
  documentos_adjuntos jsonb not null default '[]'::jsonb,
  observaciones text,
  revisado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Entidad central: amarra a un estudiante con su grupo/año lectivo concreto.
-- notas, asistencia y disciplina referencian matricula_id, nunca estudiante_id
-- directamente, para que cada registro quede contextualizado a un año/grupo.
create table matriculas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete restrict,
  anio_lectivo_id uuid not null references anios_lectivos (id) on delete restrict,
  grupo_id uuid not null references grupos (id) on delete restrict,
  proceso_matricula_id uuid references procesos_matricula (id) on delete set null,
  solicitud_admision_id uuid references solicitudes_admision (id) on delete set null,
  estado estado_matricula not null default 'activa',
  fecha_matricula date not null default current_date,
  fecha_retiro date,
  motivo_retiro text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (estudiante_id, anio_lectivo_id)
);

-- ----------------------------------------------------------------------------
-- Calificaciones y asistencia (atadas a matricula_id)
-- ----------------------------------------------------------------------------
create table tipos_evaluacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  peso_porcentual numeric(5, 2)
);

create table notas (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas (id) on delete cascade,
  malla_curricular_id uuid not null references malla_curricular (id) on delete cascade,
  periodo_academico_id uuid not null references periodos_academicos (id) on delete cascade,
  tipo_evaluacion_id uuid references tipos_evaluacion (id) on delete set null,
  valor numeric(3, 1) not null check (valor >= 0 and valor <= 5.0),
  descripcion text,
  docente_id uuid references docentes (id) on delete set null,
  anulado_en timestamptz,
  anulado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table asistencia (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas (id) on delete cascade,
  grupo_id uuid not null references grupos (id) on delete cascade,
  fecha date not null,
  estado estado_asistencia not null,
  observacion text,
  registrado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (matricula_id, fecha)
);

-- ----------------------------------------------------------------------------
-- Disciplina (observador del estudiante)
-- ----------------------------------------------------------------------------
create table tipos_falta (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null, -- leve | grave | gravisima
  descripcion text
);

create table observador_estudiante (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas (id) on delete cascade,
  tipo_falta_id uuid references tipos_falta (id) on delete set null,
  descripcion text not null,
  fecha date not null default current_date,
  reportado_por uuid references profiles (id) on delete set null,
  seguimiento_requerido boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Mensajeria, boletines y certificados (se mantienen de la Fase 0,
-- ajustados a referenciar matricula_id donde aplica)
-- ----------------------------------------------------------------------------
create table mensajes (
  id uuid primary key default gen_random_uuid(),
  remitente_id uuid not null references profiles (id) on delete cascade,
  destinatario_id uuid not null references profiles (id) on delete cascade,
  asunto text not null,
  contenido text not null,
  leido boolean not null default false,
  parent_id uuid references mensajes (id) on delete set null,
  created_at timestamptz not null default now()
);

create table boletines (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas (id) on delete cascade,
  periodo_academico_id uuid not null references periodos_academicos (id) on delete cascade,
  url_pdf text,
  generado_en timestamptz,
  generado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (matricula_id, periodo_academico_id)
);

create type tipo_certificado as enum ('estudio', 'conducta', 'notas', 'paz_y_salvo');
create type estado_certificado as enum ('solicitado', 'en_proceso', 'generado', 'entregado', 'rechazado');

create table certificados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  anio_lectivo_id uuid references anios_lectivos (id) on delete set null,
  tipo tipo_certificado not null,
  estado estado_certificado not null default 'solicitado',
  url_pdf text,
  solicitado_por uuid references profiles (id) on delete set null,
  generado_por uuid references profiles (id) on delete set null,
  generado_en timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Auditoria minima
-- ----------------------------------------------------------------------------
create table logs_auditoria (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id) on delete set null,
  tabla text not null,
  registro_id uuid,
  accion text not null, -- insert | update | delete
  datos_antes jsonb,
  datos_despues jsonb,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indices
-- ----------------------------------------------------------------------------
create index idx_grupos_grado on grupos (grado_id);
create index idx_grupos_anio on grupos (anio_lectivo_id);
create index idx_malla_grupo on malla_curricular (grupo_id);
create index idx_malla_docente on malla_curricular (docente_id);
create index idx_matriculas_estudiante on matriculas (estudiante_id);
create index idx_matriculas_anio on matriculas (anio_lectivo_id);
create index idx_matriculas_grupo on matriculas (grupo_id);
create index idx_notas_matricula on notas (matricula_id);
create index idx_notas_periodo on notas (periodo_academico_id);
create index idx_notas_malla on notas (malla_curricular_id);
create index idx_asistencia_matricula on asistencia (matricula_id);
create index idx_asistencia_fecha on asistencia (fecha);
create index idx_observador_matricula on observador_estudiante (matricula_id);
create index idx_mensajes_destinatario on mensajes (destinatario_id);
create index idx_mensajes_remitente on mensajes (remitente_id);
create index idx_solicitudes_proceso on solicitudes_admision (proceso_matricula_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

create trigger trg_notas_updated_at before update on notas
  for each row execute function set_updated_at();

create trigger trg_matriculas_updated_at before update on matriculas
  for each row execute function set_updated_at();

create trigger trg_solicitudes_updated_at before update on solicitudes_admision
  for each row execute function set_updated_at();
