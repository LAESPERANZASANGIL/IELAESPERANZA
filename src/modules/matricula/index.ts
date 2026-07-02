import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createEstudiante } from "@/modules/estudiantes";
import type { AnioLectivo, Grado, ProcesoMatricula, SolicitudAdmision } from "@/types/database.types";

export const procesoMatriculaSchema = z
  .object({
    anio_lectivo_id: z.string().uuid("Selecciona un año lectivo"),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    fecha_apertura: z.string().min(1, "La fecha de apertura es obligatoria"),
    fecha_cierre: z.string().min(1, "La fecha de cierre es obligatoria"),
  })
  .refine((data) => data.fecha_cierre > data.fecha_apertura, {
    message: "La fecha de cierre debe ser posterior a la de apertura",
    path: ["fecha_cierre"],
  });

export const solicitudAdmisionSchema = z.object({
  proceso_matricula_id: z.string().uuid("Selecciona un proceso de matrícula"),
  aspirante_nombres: z.string().min(1, "Los nombres son obligatorios"),
  aspirante_apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  aspirante_documento: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  grado_solicitado_id: z.string().uuid().optional(),
  acudiente_id: z.string().uuid().optional(),
});

export const matriculaSchema = z.object({
  estudiante_id: z.string().uuid(),
  anio_lectivo_id: z.string().uuid("Selecciona un año lectivo"),
  grupo_id: z.string().uuid("Selecciona un grupo"),
  proceso_matricula_id: z.string().uuid().optional(),
  solicitud_admision_id: z.string().uuid().optional(),
});

export async function listProcesosMatricula(): Promise<(ProcesoMatricula & { anio_lectivo: AnioLectivo })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("procesos_matricula")
    .select("*, anio_lectivo:anios_lectivos(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as (ProcesoMatricula & { anio_lectivo: AnioLectivo })[];
}

export async function createProcesoMatricula(input: z.infer<typeof procesoMatriculaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("procesos_matricula").insert(input);
  if (error) throw new Error(error.message);
}

export async function listSolicitudesAdmision(): Promise<(SolicitudAdmision & { grado_solicitado: Grado | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_admision")
    .select("*, grado_solicitado:grados(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as (SolicitudAdmision & { grado_solicitado: Grado | null })[];
}

export async function createSolicitudAdmision(input: z.infer<typeof solicitudAdmisionSchema>) {
  const supabase = await createClient();

  // Verificar duplicado por documento dentro del mismo proceso
  if (input.aspirante_documento && input.proceso_matricula_id) {
    const { count } = await supabase
      .from("solicitudes_admision")
      .select("id", { count: "exact", head: true })
      .eq("proceso_matricula_id", input.proceso_matricula_id)
      .eq("aspirante_documento", input.aspirante_documento)
      .not("estado", "eq", "rechazado");
    if (count && count > 0) {
      throw new Error("Ya existe una solicitud activa para este aspirante en este proceso de matrícula.");
    }
  }

  const { error } = await supabase.from("solicitudes_admision").insert(input);
  if (error) throw new Error(error.message);
}

export async function rechazarSolicitud(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("solicitudes_admision").update({ estado: "rechazado" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// Admitir una solicitud: crea el estudiante (si no existe) y su matricula en el
// grupo indicado, dejando la solicitud en estado "admitido" y trazabilidad completa.
export async function admitirSolicitud(input: {
  solicitud: SolicitudAdmision;
  grupo_id: string;
}): Promise<void> {
  const supabase = await createClient();
  const { solicitud, grupo_id } = input;

  const estudianteId = await createEstudiante({
    nombres: solicitud.aspirante_nombres,
    apellidos: solicitud.aspirante_apellidos,
    documento_numero: solicitud.aspirante_documento ?? undefined,
    fecha_nacimiento: solicitud.fecha_nacimiento ?? undefined,
  });

  const { data: proceso } = await supabase
    .from("procesos_matricula")
    .select("anio_lectivo_id")
    .eq("id", solicitud.proceso_matricula_id)
    .single();

  const { error: matriculaError } = await supabase.from("matriculas").insert({
    estudiante_id: estudianteId,
    anio_lectivo_id: proceso?.anio_lectivo_id,
    grupo_id,
    proceso_matricula_id: solicitud.proceso_matricula_id,
    solicitud_admision_id: solicitud.id,
  });
  if (matriculaError) throw new Error(matriculaError.message);

  if (solicitud.acudiente_id) {
    const { error: vinculoError } = await supabase.from("estudiante_acudientes").insert({
      estudiante_id: estudianteId,
      acudiente_id: solicitud.acudiente_id,
      es_acudiente_principal: true,
    });
    if (vinculoError) throw new Error(vinculoError.message);
  }

  const { error: estadoError } = await supabase
    .from("solicitudes_admision")
    .update({ estado: "admitido" })
    .eq("id", solicitud.id);
  if (estadoError) throw new Error(estadoError.message);
}

export async function createMatriculaDirecta(input: z.infer<typeof matriculaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("matriculas").insert(input);
  if (error) throw new Error(error.message);
}

export async function retirarMatricula(id: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("matriculas")
    .update({ estado: "retirada", fecha_retiro: new Date().toISOString().slice(0, 10), motivo_retiro: motivo })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
