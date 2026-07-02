import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Acudiente, Estudiante, Grupo, Matricula, Profile } from "@/types/database.types";

export const estudianteSchema = z.object({
  nombres: z.string().min(1, "Los nombres son obligatorios"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  documento_tipo: z.string().optional(),
  documento_numero: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
});

export const estudianteUpdateSchema = z.object({
  nombres: z.string().min(1, "Los nombres son obligatorios"),
  apellidos: z.string().min(1, "Los apellidos son obligatorios"),
  documento_tipo: z.string().optional(),
  documento_numero: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  genero: z.string().optional(),
  estado_general: z.enum(["activo", "inactivo", "graduado"]),
});

export const acudienteSchema = z.object({
  full_name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña temporal debe tener al menos 6 caracteres"),
  phone: z.string().optional(),
  documento_numero: z.string().optional(),
  ocupacion: z.string().optional(),
});

export const vincularAcudienteSchema = z.object({
  estudiante_id: z.string().uuid(),
  acudiente_id: z.string().uuid("Selecciona un acudiente"),
  parentesco: z.string().optional(),
  es_acudiente_principal: z.coerce.boolean().default(false),
});

export async function listEstudiantes(search?: string): Promise<Estudiante[]> {
  const supabase = await createClient();
  let query = supabase.from("estudiantes").select("*").order("apellidos");
  if (search) query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%,documento_numero.ilike.%${search}%`);
  const { data, error } = await query.limit(100);
  if (error) throw new Error(error.message);
  return data as Estudiante[];
}

export async function getEstudiante(id: string): Promise<Estudiante | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("estudiantes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Estudiante | null;
}

export async function createEstudiante(input: z.infer<typeof estudianteSchema>): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("estudiantes").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateEstudiante(id: string, input: z.infer<typeof estudianteUpdateSchema>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("estudiantes")
    .update({
      nombres: input.nombres,
      apellidos: input.apellidos,
      documento_tipo: input.documento_tipo || null,
      documento_numero: input.documento_numero || null,
      fecha_nacimiento: input.fecha_nacimiento || null,
      genero: input.genero || null,
      estado_general: input.estado_general,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listMatriculasDeEstudiante(estudianteId: string): Promise<(Matricula & { grupo: Grupo })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matriculas")
    .select("*, grupo:grupos(*)")
    .eq("estudiante_id", estudianteId)
    .order("fecha_matricula", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as (Matricula & { grupo: Grupo })[];
}

export async function listAcudientesDeEstudiante(estudianteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("estudiante_acudientes")
    .select("*, acudiente:acudientes(*, profile:profiles(*))")
    .eq("estudiante_id", estudianteId);
  if (error) throw new Error(error.message);
  return data as unknown as { parentesco: string | null; es_acudiente_principal: boolean; acudiente: Acudiente & { profile: Profile } }[];
}

export async function listAcudientes(): Promise<(Acudiente & { profile: Profile })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("acudientes").select("*, profile:profiles(*)");
  if (error) throw new Error(error.message);
  return data as unknown as (Acudiente & { profile: Profile })[];
}

export async function createAcudiente(input: z.infer<typeof acudienteSchema>) {
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
    role: "padre_familia",
    phone: input.phone || null,
    documento_numero: input.documento_numero || null,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (profileError.message.includes("duplicate") || profileError.code === "23505") {
      throw new Error("Ya existe un acudiente con ese documento o correo.");
    }
    throw new Error(profileError.message);
  }

  const { error: acudienteError } = await admin
    .from("acudientes")
    .insert({ id: created.user.id, ocupacion: input.ocupacion || null });
  if (acudienteError) throw new Error(acudienteError.message);
}

export async function deleteEstudiante(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("estudiantes").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: el estudiante tiene matrículas u otros registros asociados.");
}

export async function vincularAcudiente(input: z.infer<typeof vincularAcudienteSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("estudiante_acudientes").insert(input);
  if (error) throw new Error(error.message);
}
