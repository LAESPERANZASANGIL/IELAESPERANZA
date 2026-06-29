import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Asignatura, Docente, Grado, Grupo, MallaCurricular, PeriodoAcademico, Profile } from "@/types/database.types";

const SEXOS = ["masculino", "femenino", "otro"] as const;

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

const docenteDatosSchema = {
  documento_tipo: z.string().optional(),
  documento_numero: z.string().optional(),
  full_name: z.string().min(2, "El nombre es obligatorio"),
  fecha_nacimiento: z.string().optional(),
  sexo: z.enum(SEXOS).optional(),
  direccion: z.string().optional(),
  municipio: z.string().optional(),
  departamento: z.string().optional(),
  phone: z.string().optional(),
  telefono: z.string().optional(),
  correo_personal: z.string().email("Correo personal inválido").optional().or(z.literal("")),
  profesion: z.string().optional(),
  especialidad: z.string().min(1, "La especialidad es obligatoria"),
  escalafon: z.string().optional(),
  tipo_contrato: z.string().optional(),
  fecha_ingreso: z.string().optional(),
};

export const docenteCreateSchema = z.object({
  ...docenteDatosSchema,
  email: z.string().email("Correo institucional inválido"),
  password: z.string().min(6, "La contraseña temporal debe tener al menos 6 caracteres"),
});

export const docenteUpdateSchema = z.object(docenteDatosSchema);

export const docenteFiltrosSchema = z.object({
  documento: z.string().optional(),
  nombre: z.string().optional(),
  especialidad: z.string().optional(),
  estado: z.enum(["activo", "inactivo"]).optional(),
  correo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
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

export async function listDocentes(soloActivos = false): Promise<(Docente & { profile: Profile })[]> {
  const supabase = await createClient();
  const joinedTable = soloActivos ? "profile:profiles!inner(*)" : "profile:profiles(*)";
  let query = supabase.from("docentes").select(`*, ${joinedTable}`).order("id");
  if (soloActivos) query = query.eq("profile.is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as unknown as (Docente & { profile: Profile })[];
}

const DOCENTES_PAGE_SIZE = 20;

export async function listDocentesPaginado(filtros: z.infer<typeof docenteFiltrosSchema>): Promise<{
  docentes: (Docente & { profile: Profile })[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await createClient();
  const page = filtros.page;
  const from = (page - 1) * DOCENTES_PAGE_SIZE;
  const to = from + DOCENTES_PAGE_SIZE - 1;

  let query = supabase
    .from("docentes")
    .select("*, profile:profiles!inner(*)", { count: "exact" })
    .order("id")
    .range(from, to);

  if (filtros.documento) query = query.ilike("profile.documento_numero", `%${filtros.documento}%`);
  if (filtros.nombre) query = query.ilike("profile.full_name", `%${filtros.nombre}%`);
  if (filtros.correo) query = query.ilike("profile.email", `%${filtros.correo}%`);
  if (filtros.estado) query = query.eq("profile.is_active", filtros.estado === "activo");
  if (filtros.especialidad) query = query.ilike("especialidad", `%${filtros.especialidad}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return {
    docentes: data as unknown as (Docente & { profile: Profile })[],
    total: count ?? 0,
    page,
    pageSize: DOCENTES_PAGE_SIZE,
  };
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

export async function createDocente(input: z.infer<typeof docenteCreateSchema>) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (createError) {
    if (createError.message.toLowerCase().includes("already") || createError.code === "email_exists") {
      throw new Error("Ya existe un usuario con ese correo.");
    }
    throw new Error(createError.message);
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    full_name: input.full_name,
    email: input.email,
    role: "docente",
    documento_tipo: input.documento_tipo || null,
    documento_numero: input.documento_numero || null,
    phone: input.phone || null,
    must_change_password: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (profileError.message.includes("duplicate") || profileError.code === "23505") {
      throw new Error("Ya existe un usuario con ese documento o correo.");
    }
    throw new Error(profileError.message);
  }

  const { error: docenteError } = await admin.from("docentes").insert({
    id: created.user.id,
    especialidad: input.especialidad,
    tipo_contrato: input.tipo_contrato || null,
    fecha_ingreso: input.fecha_ingreso || null,
    fecha_nacimiento: input.fecha_nacimiento || null,
    sexo: input.sexo || null,
    direccion: input.direccion || null,
    municipio: input.municipio || null,
    departamento: input.departamento || null,
    telefono: input.telefono || null,
    correo_personal: input.correo_personal || null,
    profesion: input.profesion || null,
    escalafon: input.escalafon || null,
  });
  if (docenteError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(docenteError.message);
  }
}

export async function updateDocente(id: string, input: z.infer<typeof docenteUpdateSchema>) {
  const supabase = await createClient();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      documento_tipo: input.documento_tipo || null,
      documento_numero: input.documento_numero || null,
      phone: input.phone || null,
    })
    .eq("id", id);
  if (profileError) {
    if (profileError.message.includes("duplicate") || profileError.code === "23505") {
      throw new Error("Ya existe un usuario con ese documento.");
    }
    throw new Error(profileError.message);
  }

  const { error } = await supabase
    .from("docentes")
    .update({
      especialidad: input.especialidad || null,
      tipo_contrato: input.tipo_contrato || null,
      fecha_ingreso: input.fecha_ingreso || null,
      fecha_nacimiento: input.fecha_nacimiento || null,
      sexo: input.sexo || null,
      direccion: input.direccion || null,
      municipio: input.municipio || null,
      departamento: input.departamento || null,
      telefono: input.telefono || null,
      correo_personal: input.correo_personal || null,
      profesion: input.profesion || null,
      escalafon: input.escalafon || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDocente(id: string) {
  const supabase = await createClient();

  const { count: mallaCount } = await supabase
    .from("malla_curricular")
    .select("id", { count: "exact", head: true })
    .eq("docente_id", id);
  const { count: gruposCount } = await supabase
    .from("grupos")
    .select("id", { count: "exact", head: true })
    .eq("director_grupo_id", id);

  if ((mallaCount && mallaCount > 0) || (gruposCount && gruposCount > 0)) {
    throw new Error(
      "No se puede eliminar: el docente tiene asignaciones académicas o de dirección de grupo asociadas. Desactívelo en su lugar.",
    );
  }

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

export async function actualizarEstadoAsignatura(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("asignaturas").update({ is_active: isActive }).eq("id", id);
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
