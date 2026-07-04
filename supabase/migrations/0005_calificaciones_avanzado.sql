-- ============================================================================
-- Campus La Esperanza - Calificaciones definitivo
-- Reemplaza tipos_evaluacion (catalogo global) por actividades_evaluacion
-- (configurables por malla_curricular + periodo), agrega observacion a notas,
-- y refuerza a nivel de base de datos las reglas de negocio que la RLS por
-- si sola no puede expresar:
--   - no se pueden escribir notas si el periodo esta cerrado
--   - no se pueden escribir notas si la matricula no esta activa (retirado)
--   - solo rector/administrador pueden reabrir un periodo cerrado
-- ============================================================================

create type tipo_actividad as enum ('normal', 'recuperacion', 'nivelacion');

create table actividades_evaluacion (
  id uuid primary key default gen_random_uuid(),
  malla_curricular_id uuid not null references malla_curricular (id) on delete cascade,
  periodo_academico_id uuid not null references periodos_academicos (id) on delete cascade,
  nombre text not null,
  peso_porcentual numeric(5, 2) not null check (peso_porcentual >= 0 and peso_porcentual <= 100),
  tipo tipo_actividad not null default 'normal',
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_actividades_evaluacion_malla_periodo
  on actividades_evaluacion (malla_curricular_id, periodo_academico_id);

alter table actividades_evaluacion enable row level security;

create policy "actividades_evaluacion_select_all" on actividades_evaluacion for select using (true);
create policy "actividades_evaluacion_write_staff" on actividades_evaluacion for all
  using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- notas: actividad_id reemplaza tipo_evaluacion_id; se agrega observacion
-- ----------------------------------------------------------------------------
alter table notas add column actividad_id uuid references actividades_evaluacion (id) on delete restrict;
alter table notas add column observacion text;

alter table notas drop column tipo_evaluacion_id;
drop table tipos_evaluacion;

create index idx_notas_actividad on notas (actividad_id);

-- Una sola nota vigente por matricula+actividad (las anuladas no cuentan, ver indice parcial)
create unique index uq_notas_matricula_actividad_vigente
  on notas (matricula_id, actividad_id)
  where anulado_en is null;

-- ----------------------------------------------------------------------------
-- Reglas de negocio forzadas en base de datos
-- ----------------------------------------------------------------------------
create or replace function notas_validar_escritura()
returns trigger as $$
declare
  v_estado_periodo estado_periodo;
  v_estado_matricula estado_matricula;
begin
  select estado into v_estado_periodo from periodos_academicos where id = new.periodo_academico_id;
  if v_estado_periodo = 'cerrado' then
    raise exception 'El periodo está cerrado. No se pueden modificar notas.';
  end if;

  select estado into v_estado_matricula from matriculas where id = new.matricula_id;
  if v_estado_matricula <> 'activa' then
    raise exception 'La matrícula no está activa. No se pueden registrar notas para un estudiante retirado.';
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_notas_validar_escritura
  before insert or update on notas
  for each row execute function notas_validar_escritura();

create or replace function periodos_validar_reapertura()
returns trigger as $$
begin
  if old.estado = 'cerrado' and new.estado <> 'cerrado' and auth_role() not in ('rector', 'administrador') then
    raise exception 'Solo el Rector o el Administrador pueden reabrir un periodo cerrado.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_periodos_validar_reapertura
  before update on periodos_academicos
  for each row execute function periodos_validar_reapertura();
