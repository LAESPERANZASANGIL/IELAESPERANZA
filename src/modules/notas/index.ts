import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Estudiante, Matricula, Nota, TipoEvaluacion } from "@/types/database.types";

export const notaSchema = z.object({
  matricula_id: z.string().uuid(),
  malla_curricular_id: z.string().uuid("Selecciona una asignatura"),
  periodo_academico_id: z.string().uuid("Selecciona un periodo"),
  tipo_evaluacion_id: z.string().uuid().optional(),
  valor: z.coerce
    .number({ error: "La nota debe ser un número" })
    .min(0, "La nota mínima es 0.0")
    .max(5, "La nota máxima es 5.0"),
  descripcion: z.string().optional(),
});

export async function listMatriculasDeGrupo(
  grupoId: string,
): Promise<(Matricula & { estudiante: Estudiante })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matriculas")
    .select("*, estudiante:estudiantes(*)")
    .eq("grupo_id", grupoId)
    .eq("estado", "activa")
    .order("created_at");
  if (error) throw new Error(error.message);
  const matriculas = data as unknown as (Matricula & { estudiante: Estudiante })[];
  return matriculas.sort((a, b) =>
    `${a.estudiante.apellidos} ${a.estudiante.nombres}`.localeCompare(
      `${b.estudiante.apellidos} ${b.estudiante.nombres}`,
    ),
  );
}

export async function listNotas(filters: {
  malla_curricular_id: string;
  periodo_academico_id: string;
}): Promise<Nota[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notas")
    .select("*")
    .eq("malla_curricular_id", filters.malla_curricular_id)
    .eq("periodo_academico_id", filters.periodo_academico_id)
    .is("anulado_en", null)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data as Nota[];
}

export async function createNota(input: z.infer<typeof notaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("notas").insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteNota(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listTiposEvaluacion(): Promise<TipoEvaluacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tipos_evaluacion").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as TipoEvaluacion[];
}
