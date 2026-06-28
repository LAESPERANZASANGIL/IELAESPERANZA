-- ============================================================================
-- IE La Esperanza - Esquema inicial
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

create type estado_matricula as enum ('activo', 'retirado', 'graduado', 'trasladado');
create type estado_periodo as enum ('planeado', 'activo', 'cerrado');
create type estado_asistencia as enum ('presente', 'ausente', 'tarde', 'excusa');
create type estado_certificado as enum ('solicitado', 'en_proceso', 'generado', 'entregado', 'rechazado');
create type tipo_certificado as enum ('estudio', 'conducta', 'notas', 'paz_y_salvo');
create type nivel_educativo as enum ('preescolar', 'primaria', 'secundaria', 'media');

-- ----------------------------------------------------------------------------
-- Perfiles (extiende auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  email text not null,
  phone text,
  documento text,
  avatar_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Grados y grupos (cursos)
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
  nombre text not null, -- ej. "6-1"
  anio_lectivo int not null,
  director_grupo_id uuid references profiles (id) on delete set null,
  capacidad int,
  created_at timestamptz not null default now(),
  unique (grado_id, nombre, anio_lectivo)
);

-- ----------------------------------------------------------------------------
-- Docentes
-- ----------------------------------------------------------------------------
create table docentes (
  id uuid primary key references profiles (id) on delete cascade,
  especialidad text,
  fecha_ingreso date,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Estudiantes y acudientes
-- ----------------------------------------------------------------------------
create table estudiantes (
  id uuid primary key references profiles (id) on delete cascade,
  fecha_nacimiento date,
  grupo_id uuid references grupos (id) on delete set null,
  estado estado_matricula not null default 'activo',
  fecha_matricula date not null default current_date,
  created_at timestamptz not null default now()
);

create table estudiante_acudientes (
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  acudiente_id uuid not null references profiles (id) on delete cascade,
  parentesco text,
  primary key (estudiante_id, acudiente_id)
);

-- ----------------------------------------------------------------------------
-- Asignaturas y periodos academicos
-- ----------------------------------------------------------------------------
create table asignaturas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  area text,
  descripcion text,
  created_at timestamptz not null default now()
);

create table periodos_academicos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, -- ej. "Periodo 1"
  anio_lectivo int not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  orden int not null default 0,
  estado estado_periodo not null default 'planeado',
  created_at timestamptz not null default now(),
  unique (nombre, anio_lectivo)
);

-- Malla curricular: qué asignatura se imparte en qué grupo y quién la enseña
create table asignaturas_grupo (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos (id) on delete cascade,
  asignatura_id uuid not null references asignaturas (id) on delete cascade,
  docente_id uuid references docentes (id) on delete set null,
  intensidad_horaria int,
  created_at timestamptz not null default now(),
  unique (grupo_id, asignatura_id)
);

-- ----------------------------------------------------------------------------
-- Notas (calificaciones)
-- ----------------------------------------------------------------------------
create table notas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  asignatura_grupo_id uuid not null references asignaturas_grupo (id) on delete cascade,
  periodo_id uuid not null references periodos_academicos (id) on delete cascade,
  valor numeric(3, 1) not null check (valor >= 0 and valor <= 5.0),
  descripcion text,
  docente_id uuid references docentes (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Asistencia / fallas
-- ----------------------------------------------------------------------------
create table asistencia (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  grupo_id uuid not null references grupos (id) on delete cascade,
  fecha date not null,
  estado estado_asistencia not null,
  observacion text,
  registrado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (estudiante_id, fecha)
);

-- ----------------------------------------------------------------------------
-- Mensajeria
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

-- ----------------------------------------------------------------------------
-- Boletines (reportes academicos generados)
-- ----------------------------------------------------------------------------
create table boletines (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  periodo_id uuid not null references periodos_academicos (id) on delete cascade,
  url_pdf text,
  generado_en timestamptz,
  generado_por uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (estudiante_id, periodo_id)
);

-- ----------------------------------------------------------------------------
-- Certificados institucionales
-- ----------------------------------------------------------------------------
create table certificados (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes (id) on delete cascade,
  tipo tipo_certificado not null,
  estado estado_certificado not null default 'solicitado',
  url_pdf text,
  solicitado_por uuid references profiles (id) on delete set null,
  generado_por uuid references profiles (id) on delete set null,
  generado_en timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indices
-- ----------------------------------------------------------------------------
create index idx_estudiantes_grupo on estudiantes (grupo_id);
create index idx_notas_estudiante on notas (estudiante_id);
create index idx_notas_periodo on notas (periodo_id);
create index idx_asistencia_estudiante on asistencia (estudiante_id);
create index idx_asistencia_fecha on asistencia (fecha);
create index idx_mensajes_destinatario on mensajes (destinatario_id);
create index idx_mensajes_remitente on mensajes (remitente_id);
create index idx_grupos_grado on grupos (grado_id);
create index idx_asignaturas_grupo_grupo on asignaturas_grupo (grupo_id);

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
