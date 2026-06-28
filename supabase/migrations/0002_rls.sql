-- ============================================================================
-- IE La Esperanza - Row Level Security
-- ============================================================================

-- Helper: rol del usuario autenticado actual
create or replace function auth_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

-- Helper: el usuario actual es personal administrativo (rector/admin/secretaria)
create or replace function is_staff()
returns boolean as $$
  select auth_role() in ('rector', 'administrador', 'secretaria');
$$ language sql stable security definer set search_path = public;

-- Helper: el usuario actual es el acudiente del estudiante dado
create or replace function is_acudiente_de(p_estudiante_id uuid)
returns boolean as $$
  select exists (
    select 1 from estudiante_acudientes
    where estudiante_id = p_estudiante_id and acudiente_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

-- Helper: el usuario actual es el docente asignado a la asignatura_grupo dada
create or replace function is_docente_de_asignatura_grupo(p_asignatura_grupo_id uuid)
returns boolean as $$
  select exists (
    select 1 from asignaturas_grupo
    where id = p_asignatura_grupo_id and docente_id = auth.uid()
  );
$$ language sql stable security definer set search_path = public;

alter table profiles enable row level security;
alter table grados enable row level security;
alter table grupos enable row level security;
alter table docentes enable row level security;
alter table estudiantes enable row level security;
alter table estudiante_acudientes enable row level security;
alter table asignaturas enable row level security;
alter table periodos_academicos enable row level security;
alter table asignaturas_grupo enable row level security;
alter table notas enable row level security;
alter table asistencia enable row level security;
alter table mensajes enable row level security;
alter table boletines enable row level security;
alter table certificados enable row level security;

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
-- catalogos: grados, asignaturas, periodos -> lectura para todos, escritura staff
-- ----------------------------------------------------------------------------
create policy "grados_select_all" on grados for select using (true);
create policy "grados_write_staff" on grados for all using (is_staff()) with check (is_staff());

create policy "asignaturas_select_all" on asignaturas for select using (true);
create policy "asignaturas_write_staff" on asignaturas for all using (is_staff()) with check (is_staff());

create policy "periodos_select_all" on periodos_academicos for select using (true);
create policy "periodos_write_staff" on periodos_academicos for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- grupos
-- ----------------------------------------------------------------------------
create policy "grupos_select_all" on grupos for select using (true);
create policy "grupos_write_staff" on grupos for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- docentes
-- ----------------------------------------------------------------------------
create policy "docentes_select_staff_or_self" on docentes for select
  using (is_staff() or id = auth.uid());
create policy "docentes_write_staff" on docentes for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- estudiantes
-- ----------------------------------------------------------------------------
create policy "estudiantes_select" on estudiantes for select
  using (
    is_staff()
    or id = auth.uid()
    or is_acudiente_de(id)
    or exists (
      select 1 from asignaturas_grupo ag
      where ag.grupo_id = estudiantes.grupo_id and ag.docente_id = auth.uid()
    )
  );
create policy "estudiantes_write_staff" on estudiantes for all using (is_staff()) with check (is_staff());

create policy "estudiante_acudientes_select" on estudiante_acudientes for select
  using (is_staff() or acudiente_id = auth.uid() or estudiante_id = auth.uid());
create policy "estudiante_acudientes_write_staff" on estudiante_acudientes for all
  using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- asignaturas_grupo
-- ----------------------------------------------------------------------------
create policy "asignaturas_grupo_select_all" on asignaturas_grupo for select using (true);
create policy "asignaturas_grupo_write_staff" on asignaturas_grupo for all
  using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- notas
-- ----------------------------------------------------------------------------
create policy "notas_select" on notas for select
  using (
    is_staff()
    or estudiante_id = auth.uid()
    or is_acudiente_de(estudiante_id)
    or is_docente_de_asignatura_grupo(asignatura_grupo_id)
  );

create policy "notas_write_staff_or_docente" on notas for insert
  with check (is_staff() or is_docente_de_asignatura_grupo(asignatura_grupo_id));

create policy "notas_update_staff_or_docente" on notas for update
  using (is_staff() or is_docente_de_asignatura_grupo(asignatura_grupo_id));

create policy "notas_delete_staff" on notas for delete using (is_staff());

-- ----------------------------------------------------------------------------
-- asistencia
-- ----------------------------------------------------------------------------
create policy "asistencia_select" on asistencia for select
  using (
    is_staff()
    or estudiante_id = auth.uid()
    or is_acudiente_de(estudiante_id)
    or exists (
      select 1 from asignaturas_grupo ag
      where ag.grupo_id = asistencia.grupo_id and ag.docente_id = auth.uid()
    )
  );

create policy "asistencia_write_staff_or_docente" on asistencia for all
  using (
    is_staff()
    or exists (
      select 1 from asignaturas_grupo ag
      where ag.grupo_id = asistencia.grupo_id and ag.docente_id = auth.uid()
    )
  )
  with check (
    is_staff()
    or exists (
      select 1 from asignaturas_grupo ag
      where ag.grupo_id = asistencia.grupo_id and ag.docente_id = auth.uid()
    )
  );

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
  using (is_staff() or estudiante_id = auth.uid() or is_acudiente_de(estudiante_id));
create policy "boletines_write_staff" on boletines for all using (is_staff()) with check (is_staff());

-- ----------------------------------------------------------------------------
-- certificados
-- ----------------------------------------------------------------------------
create policy "certificados_select" on certificados for select
  using (is_staff() or estudiante_id = auth.uid() or is_acudiente_de(estudiante_id));

create policy "certificados_insert" on certificados for insert
  with check (is_staff() or estudiante_id = auth.uid() or is_acudiente_de(estudiante_id));

create policy "certificados_update_staff" on certificados for update using (is_staff());
