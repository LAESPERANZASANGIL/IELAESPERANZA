-- Permite a estudiantes y acudientes leer la malla curricular del grupo
-- donde tienen matrícula, para la vista "Mis calificaciones" (solo lectura).
create policy "malla_curricular_select_estudiante_acudiente" on malla_curricular
  for select using (
    exists (
      select 1
      from matriculas m
      where m.grupo_id = malla_curricular.grupo_id
        and is_relacionado_con_matricula(m.id)
    )
  );

notify pgrst, 'reload schema';
