import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Asistencia, Estudiante, Matricula } from "@/types/database.types";

export const estadosAsistencia = ["presente", "ausente", "tarde", "excusa"] as const;

export const registroAsistenciaSchema = z.object({
  matricula_id: z.string().uuid(),
  grupo_id: z.string().uuid(),
  fecha: z.string().min(1),
  estado: z.enum(estadosAsistencia),
  observacion: z.string().optional(),
});

export const registroMasivoSchema = z.object({
  grupo_id: z.string().uuid(),
  fecha: z.string().min(1),
  registros: z.array(
    z.object({
      matricula_id: z.string().uuid(),
      estado: z.enum(estadosAsistencia),
      observacion: z.string().optional(),
    }),
  ),
});

export type FilaAsistencia = {
  matricula_id: string;
  estudiante: Estudiante;
  asistencia: Asistencia | null;
};

export async function listEstudiantesConAsistencia(
  grupoId: string,
  anioLectivoId: string,
  fecha: string,
): Promise<FilaAsistencia[]> {
  const supabase = await createClient();

  const { data: matriculas, error } = await supabase
    .from("matriculas")
    .select("id, estudiante_id, estado, estudiante:estudiantes(id, nombres, apellidos, documento_tipo, documento_numero, fecha_nacimiento, genero, is_active, profile_id, created_at, updated_at, created_by, updated_by)")
    .eq("grupo_id", grupoId)
    .eq("anio_lectivo_id", anioLectivoId)
    .eq("estado", "activa")
    .order("estudiante(apellidos)");

  if (error) throw new Error(error.message);

  const matriculaIds = (matriculas ?? []).map((m) => m.id);

  let asistenciasDelDia: Asistencia[] = [];
  if (matriculaIds.length > 0) {
    const { data: asistencias, error: aError } = await supabase
      .from("asistencia")
      .select("*")
      .in("matricula_id", matriculaIds)
      .eq("fecha", fecha);
    if (aError) throw new Error(aError.message);
    asistenciasDelDia = (asistencias ?? []) as Asistencia[];
  }

  const asistenciaPorMatricula = new Map(asistenciasDelDia.map((a) => [a.matricula_id, a]));

  return (matriculas ?? []).map((m) => ({
    matricula_id: m.id,
    estudiante: m.estudiante as unknown as Estudiante,
    asistencia: asistenciaPorMatricula.get(m.id) ?? null,
  }));
}

export async function registrarAsistenciaMasiva(input: {
  grupo_id: string;
  fecha: string;
  registros: { matricula_id: string; estado: string; observacion?: string }[];
  registrado_por: string;
}) {
  const supabase = await createClient();

  const rows = input.registros.map((r) => ({
    matricula_id: r.matricula_id,
    grupo_id: input.grupo_id,
    fecha: input.fecha,
    estado: r.estado,
    observacion: r.observacion || null,
    registrado_por: input.registrado_por,
  }));

  const { error } = await supabase.from("asistencia").upsert(rows, { onConflict: "matricula_id,fecha" });
  if (error) throw new Error(error.message);
}

export type ResumenAsistencia = {
  presente: number;
  ausente: number;
  tarde: number;
  excusa: number;
  total: number;
};

export async function getResumenAsistenciaGrupo(
  grupoId: string,
  anioLectivoId: string,
): Promise<{ fecha: string; resumen: ResumenAsistencia }[]> {
  const supabase = await createClient();

  // Get all matricula IDs for this group
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id")
    .eq("grupo_id", grupoId)
    .eq("anio_lectivo_id", anioLectivoId)
    .eq("estado", "activa");

  const ids = (matriculas ?? []).map((m) => m.id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("asistencia")
    .select("fecha, estado")
    .in("matricula_id", ids)
    .order("fecha", { ascending: false });

  if (error) throw new Error(error.message);

  const porFecha = new Map<string, ResumenAsistencia>();
  for (const row of data ?? []) {
    if (!porFecha.has(row.fecha)) {
      porFecha.set(row.fecha, { presente: 0, ausente: 0, tarde: 0, excusa: 0, total: 0 });
    }
    const r = porFecha.get(row.fecha)!;
    r.total++;
    if (row.estado === "presente") r.presente++;
    else if (row.estado === "ausente") r.ausente++;
    else if (row.estado === "tarde") r.tarde++;
    else if (row.estado === "excusa") r.excusa++;
  }

  return Array.from(porFecha.entries()).map(([fecha, resumen]) => ({ fecha, resumen }));
}

export async function getAsistenciaEstudiante(
  matriculaId: string,
): Promise<Asistencia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asistencia")
    .select("*")
    .eq("matricula_id", matriculaId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Asistencia[];
}
