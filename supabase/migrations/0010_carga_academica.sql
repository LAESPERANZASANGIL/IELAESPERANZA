-- ============================================================================
-- IE La Esperanza - Carga Académica (Fase 4)
-- ============================================================================

-- Agregar is_active a malla_curricular (idempotente)
alter table malla_curricular add column if not exists is_active boolean not null default true;

-- ----------------------------------------------------------------------------
-- RLS: reemplazar política de malla_curricular por una más granular
-- Las políticas previas en 0002_rls.sql cubren staff con acceso total y
-- select para todos. Aquí las reemplazamos para limitar docentes a ver solo
-- sus propias asignaciones.
-- ----------------------------------------------------------------------------

-- Eliminar todas las políticas existentes de malla_curricular (idempotente)
drop policy if exists "malla_curricular_select_all" on malla_curricular;
drop policy if exists "malla_curricular_write_staff" on malla_curricular;
drop policy if exists "malla_curricular_select_docente" on malla_curricular;
drop policy if exists "malla_curricular_select_staff" on malla_curricular;
drop policy if exists "malla_curricular_select_authenticated" on malla_curricular;
drop policy if exists "malla_curricular_insert_staff" on malla_curricular;
drop policy if exists "malla_curricular_update_staff" on malla_curricular;
drop policy if exists "malla_curricular_delete_staff" on malla_curricular;

-- Staff: acceso completo
create policy "malla_curricular_write_staff" on malla_curricular
  for all using (is_staff()) with check (is_staff());

-- Docentes: solo pueden ver sus propias asignaciones
create policy "malla_curricular_select_docente" on malla_curricular
  for select using (
    is_staff()
    or docente_id = auth.uid()
    or auth_role() not in ('docente', 'rector', 'administrador', 'secretaria', 'padre_familia', 'estudiante')
  );

notify pgrst, 'reload schema';
