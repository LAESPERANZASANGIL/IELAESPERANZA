-- ============================================================================
-- IE La Esperanza - Row Level Security (Fase 1)
-- ============================================================================

create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function is_staff()
returns boolean as $$
  select auth_role() in ('rector', 'administrador', 'secretaria');
$$ language sql stable security definer set search_path = public;

create or replace function is_acudiente_de_estudiante(p_estudiante_id uuid)
returns boolean as $$
  select exists (
    select 1 from estudiante_acudientes
    where estudiante_id = p_estudiante_id and acudiente_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- El usuario actual es el acudiente o el propio estudiante de una matricula dada
create or replace function is_relacionado_con_matricula(p_matricula_id uuid)
returns boolean as $$
  select exists (
    select 1 from matriculas m
    join estudiantes e on e.id = m.estudiante_id
    where m.id = p_matricula_id
      and (e.profile_id = auth.uid() or is_acudiente_de_estudiante(e.id))
  );
$$ language sql stable security definer set search_path = public;

-- El usuario actual es el docente asignado a la malla_curricular dada
create or replace function is_docente_de_malla(p_malla_curricular_id uuid)
returns boolean as $$
  select exists (
    select 1 from malla_curricular
    where id = p_malla_curricular_id and docente_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- El usuario actual es el docente asignado a algun curso del grupo dado
create or replace function is_docente_de_grupo(p_grupo_id uuid)
returns boolean as $$
  select exists (
    select 1 from malla_curricular
    where grupo_id = p_grupo_id and docente_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

alter table sedes enable row level security;
alter table anios_lectivos enable row level security;
alter table profiles enable row level security;
alter table grados enable row level security;
alter table grupos enable row level security;
alter table docentes enable row level security;
alter table asignaturas enable row level security;
alter table periodos_academicos enable row level security;
alter table malla_curricular enable row level security;
alter table estudiantes enable row level security;
alter table acudientes enable row level security;
alter table estudiante_acudientes enable row level security;
alter table procesos_matricula enable row level security;
alter table solicitudes_admision enable row level security;
alter table matriculas enable row level security;
alter table tipos_evaluacion enable row level security;
alter table notas enable row level security;
alter table asistencia enable row level security;
alter table tipos_falta enable row level security;
alter table observador_estudiante enable row level security;
alter table mensajes enable row level security;
alter table boletines enable row level security;
alter table certificados enable row level security;
alter table logs_auditoria enable row level security;

-- ----------------------------------------------------------------------------
-- sedes / anios_lectivos: catalogo institucional -> lectura para todos, escritura staff
-- ----------------------------------------------------------------------------
create policy "sedes_select_all" on sedes for select using (true);
create policy "sedes_write_staff" on sedes for all using (is_staff()) with check (is_staff());

create policy "anios_lectivos_select_all" on anios_lectivos for select using (true);
create policy "anios_lectivos_write_staff" on anios_lectivos for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_staff" on profiles for select
  using (id = auth.uid() or is_staff());

create policy "profiles_update_own_or_staff" on profiles for update
  using (id = auth.uid() or is_staff());

create policy "profiles_insert_staff" on profiles for insert
  with check (is_staff());

-- ----------------------------------------------------------------------------
-- catalogos academicos: grados, asignaturas, periodos, tipos_evaluacion, tipos_falta
-- ----------------------------------------------------------------------------
create policy "grados_select_all" on grados for select using (true);
create policy "grados_write_staff" on grados for all using (is_staff()) with check (is_staff());

create policy "asignaturas_select_all" on asignaturas for select using (true);
create policy "asignaturas_write_staff" on asignaturas for all using (is_staff()) with check (is_staff());

create policy "periodos_select_all" on periodos_academicos for select using (true);
create policy "periodos_write_staff" on periodos_academicos for all using (is_staff()) with check (is_staff());

create policy "tipos_evaluacion_select_all" on tipos_evaluacion for select using (true);
create policy "tipos_evaluacion_write_staff" on tipos_evaluacion for all using (is_staff()) with check (is_staff());

create policy "tipos_falta_select_all" on tipos_falta for select using (true);
create policy "tipos_falta_write_staff" on tipos_falta for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- grupos / malla_curricular
-- ----------------------------------------------------------------------------
create policy "grupos_select_all" on grupos for select using (true);
create policy "grupos_write_staff" on grupos for all using (is_staff()) with check (is_staff());

create policy "malla_curricular_select_all" on malla_curricular for select using (true);
create policy "malla_curricular_write_staff" on malla_curricular for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- docentes
-- ----------------------------------------------------------------------------
create policy "docentes_select_staff_or_self" on docentes for select
  using (is_staff() or id = auth.uid());
create policy "docentes_write_staff" on docentes for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- estudiantes / acudientes
-- ----------------------------------------------------------------------------
create policy "estudiantes_select" on estudiantes for select
  using (
    is_staff()
    or profile_id = auth.uid()
    or is_acudiente_de_estudiante(id)
    or exists (
      select 1 from matriculas m
      where m.estudiante_id = estudiantes.id and is_docente_de_grupo(m.grupo_id)
    )
  );
create policy "estudiantes_write_staff" on estudiantes for all using (is_staff()) with check (is_staff());

create policy "acudientes_select_staff_or_self" on acudientes for select
  using (is_staff() or id = auth.uid());
create policy "acudientes_write_staff" on acudientes for all using (is_staff()) with check (is_staff());

create policy "estudiante_acudientes_select" on estudiante_acudientes for select
  using (is_staff() or acudiente_id = auth.uid() or is_acudiente_de_estudiante(estudiante_id));
create policy "estudiante_acudientes_write_staff" on estudiante_acudientes for all
  using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- matricula: procesos, solicitudes, matriculas
-- ----------------------------------------------------------------------------
create policy "procesos_matricula_select_all" on procesos_matricula for select using (true);
create policy "procesos_matricula_write_staff" on procesos_matricula for all
  using (is_staff()) with check (is_staff());

create policy "solicitudes_select" on solicitudes_admision for select
  using (is_staff() or acudiente_id = auth.uid());
create policy "solicitudes_insert" on solicitudes_admision for insert
  with check (is_staff() or acudiente_id = auth.uid());
create policy "solicitudes_update_staff" on solicitudes_admision for update using (is_staff());

create policy "matriculas_select" on matriculas for select
  using (
    is_staff()
    or is_relacionado_con_matricula(id)
    or is_docente_de_grupo(grupo_id)
  );
create policy "matriculas_write_staff" on matriculas for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- notas
-- ----------------------------------------------------------------------------
create policy "notas_select" on notas for select
  using (is_staff() or is_relacionado_con_matricula(matricula_id) or is_docente_de_malla(malla_curricular_id));

create policy "notas_insert_staff_or_docente" on notas for insert
  with check (is_staff() or is_docente_de_malla(malla_curricular_id));

create policy "notas_update_staff_or_docente" on notas for update
  using (is_staff() or is_docente_de_malla(malla_curricular_id));

create policy "notas_delete_staff" on notas for delete using (is_staff());

-- ----------------------------------------------------------------------------
-- asistencia
-- ----------------------------------------------------------------------------
create policy "asistencia_select" on asistencia for select
  using (is_staff() or is_relacionado_con_matricula(matricula_id) or is_docente_de_grupo(grupo_id));

create policy "asistencia_write_staff_or_docente" on asistencia for all
  using (is_staff() or is_docente_de_grupo(grupo_id))
  with check (is_staff() or is_docente_de_grupo(grupo_id));

-- ----------------------------------------------------------------------------
-- disciplina
-- ----------------------------------------------------------------------------
create policy "observador_select" on observador_estudiante for select
  using (is_staff() or is_relacionado_con_matricula(matricula_id) or is_docente_de_grupo(
    (select grupo_id from matriculas where id = matricula_id)
  ));

create policy "observador_write_staff_or_docente" on observador_estudiante for all
  using (is_staff() or is_docente_de_grupo((select grupo_id from matriculas where id = matricula_id)))
  with check (is_staff() or is_docente_de_grupo((select grupo_id from matriculas where id = matricula_id)));

-- ----------------------------------------------------------------------------
-- mensajes
-- ----------------------------------------------------------------------------
create policy "mensajes_select_participante" on mensajes for select
  using (remitente_id = auth.uid() or destinatario_id = auth.uid() or is_staff());

create policy "mensajes_insert_remitente" on mensajes for insert
  with check (remitente_id = auth.uid());

create policy "mensajes_update_destinatario" on mensajes for update
  using (destinatario_id = auth.uid() or remitente_id = auth.uid());

-- ----------------------------------------------------------------------------
-- boletines
-- ----------------------------------------------------------------------------
create policy "boletines_select" on boletines for select
  using (is_staff() or is_relacionado_con_matricula(matricula_id));
create policy "boletines_write_staff" on boletines for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- certificados
-- ----------------------------------------------------------------------------
create policy "certificados_select" on certificados for select
  using (is_staff() or is_acudiente_de_estudiante(estudiante_id) or exists (
    select 1 from estudiantes e where e.id = estudiante_id and e.profile_id = auth.uid()
  ));

create policy "certificados_insert" on certificados for insert
  with check (is_staff() or is_acudiente_de_estudiante(estudiante_id) or exists (
    select 1 from estudiantes e where e.id = estudiante_id and e.profile_id = auth.uid()
  ));

create policy "certificados_update_staff" on certificados for update using (is_staff());

-- ----------------------------------------------------------------------------
-- logs_auditoria: solo lectura/escritura staff (de solo lectura para rector/admin en la practica)
-- ----------------------------------------------------------------------------
create policy "logs_auditoria_select_staff" on logs_auditoria for select using (is_staff());
create policy "logs_auditoria_insert_staff" on logs_auditoria for insert with check (is_staff());
