import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Asignatura, Docente, Grado, Grupo, MallaCurricular, PeriodoAcademico, Profile } from "@/types/database.types";

export const gradoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  nivel: z.enum(["preescolar", "primaria", "secundaria", "media"]),
  orden: z.coerce.number().int().default(0),
});

export const grupoSchema = z.object({
  grado_id: z.string().uuid("Selecciona un grado"),
  anio_lectivo_id: z.string().uuid("Selecciona un año lectivo"),
  nombre: z.string().min(1, "El nombre del curso es obligatorio"),
  capacidad: z.coerce.number().int().optional(),
  jornada: z.enum(["mañana", "tarde", "noche"], { message: "Selecciona una jornada" }),
  director_grupo_id: z.string().uuid("Selecciona un director de grupo"),
});

export const docenteUpdateSchema = z.object({
  especialidad: z.string().min(1, "La especialidad es obligatoria"),
  tipo_contrato: z.string().optional(),
  fecha_ingreso: z.string().optional(),
});

export const asignaturaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  area: z.string().optional(),
  descripcion: z.string().optional(),
});

export const periodoSchema = z
  .object({
    anio_lectivo_id: z.string().uuid("Selecciona un año lectivo"),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    orden: z.coerce.number().int().default(0),
    fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fecha_fin: z.string().min(1, "La fecha de fin es obligatoria"),
  })
  .refine((data) => data.fecha_fin > data.fecha_inicio, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["fecha_fin"],
  });

export const mallaCurricularSchema = z.object({
  grupo_id: z.string().uuid("Selecciona un grupo"),
  asignatura_id: z.string().uuid("Selecciona una asignatura"),
  docente_id: z.string().uuid().optional(),
  intensidad_horaria: z.coerce.number().int().optional(),
});

export async function listGrados(): Promise<Grado[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grados").select("*").order("orden");
  if (error) throw new Error(error.message);
  return data as Grado[];
}

export async function createGrado(input: z.infer<typeof gradoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("grados").insert(input);
  if (error) throw new Error(error.message);
}

export async function getGrado(id: string): Promise<Grado | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grados").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Grado | null;
}

export async function updateGrado(id: string, input: z.infer<typeof gradoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("grados").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function actualizarEstadoGrado(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("grados").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGrado(id: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("grupos").select("id", { count: "exact", head: true }).eq("grado_id", id);
  if (count && count > 0) {
    throw new Error("No se puede eliminar: el grado tiene cursos asociados.");
  }
  const { error } = await supabase.from("grados").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: el grado tiene cursos o estudiantes asociados.");
}

export async function listGrupos(filters?: { grado_id?: string; anio_lectivo_id?: string }): Promise<Grupo[]> {
  const supabase = await createClient();
  let query = supabase.from("grupos").select("*").order("nombre");
  if (filters?.grado_id) query = query.eq("grado_id", filters.grado_id);
  if (filters?.anio_lectivo_id) query = query.eq("anio_lectivo_id", filters.anio_lectivo_id);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Grupo[];
}

export async function createGrupo(input: z.infer<typeof grupoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("grupos").insert(input);
  if (error) throw new Error(error.message);
}

export async function getGrupo(id: string): Promise<Grupo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grupos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Grupo | null;
}

export async function updateGrupo(id: string, input: z.infer<typeof grupoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("grupos").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function actualizarEstadoGrupo(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("grupos").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGrupo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("grupos").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: el curso tiene estudiantes matriculados.");
}

export async function listDocentes(): Promise<(Docente & { profile: Profile })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docentes")
    .select("*, profile:profiles(*)")
    .order("id");
  if (error) throw new Error(error.message);
  return data as unknown as (Docente & { profile: Profile })[];
}

export async function getDocente(id: string): Promise<(Docente & { profile: Profile }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("docentes")
    .select("*, profile:profiles(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as (Docente & { profile: Profile }) | null;
}

export async function updateDocente(id: string, input: z.infer<typeof docenteUpdateSchema>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("docentes")
    .update({
      especialidad: input.especialidad || null,
      tipo_contrato: input.tipo_contrato || null,
      fecha_ingreso: input.fecha_ingreso || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDocente(id: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
}

export async function listAsignaturas(): Promise<Asignatura[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("asignaturas").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as Asignatura[];
}

export async function createAsignatura(input: z.infer<typeof asignaturaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("asignaturas").insert(input);
  if (error) throw new Error(error.message);
}

export async function listPeriodos(anioLectivoId?: string): Promise<PeriodoAcademico[]> {
  const supabase = await createClient();
  let query = supabase.from("periodos_academicos").select("*").order("orden");
  if (anioLectivoId) query = query.eq("anio_lectivo_id", anioLectivoId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as PeriodoAcademico[];
}

export async function createPeriodo(input: z.infer<typeof periodoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("periodos_academicos").insert(input);
  if (error) throw new Error(error.message);
}

export async function cambiarEstadoPeriodo(
  id: string,
  nuevoEstado: "planeado" | "activo" | "cerrado",
  profileId: string,
) {
  const supabase = await createClient();
  const { data: anterior, error: getError } = await supabase
    .from("periodos_academicos")
    .select("estado")
    .eq("id", id)
    .single();
  if (getError) throw new Error(getError.message);

  const { error } = await supabase.from("periodos_academicos").update({ estado: nuevoEstado }).eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.from("logs_auditoria").insert({
    profile_id: profileId,
    tabla: "periodos_academicos",
    registro_id: id,
    accion: "cambiar_estado",
    datos_antes: { estado: anterior.estado },
    datos_despues: { estado: nuevoEstado },
  });
}

export async function listMallaCurricular(grupoId: string): Promise<(MallaCurricular & { asignatura: Asignatura; docente: (Docente & { profile: Profile }) | null })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("malla_curricular")
    .select("*, asignatura:asignaturas(*), docente:docentes(*, profile:profiles(*))")
    .eq("grupo_id", grupoId);
  if (error) throw new Error(error.message);
  return data as unknown as (MallaCurricular & { asignatura: Asignatura; docente: (Docente & { profile: Profile }) | null })[];
}

export async function asignarMallaCurricular(input: z.infer<typeof mallaCurricularSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("malla_curricular").insert(input);
  if (error) throw new Error(error.message);
}
