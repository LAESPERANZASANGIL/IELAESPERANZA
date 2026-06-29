import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { AnioLectivo, Profile, Sede, UserRole } from "@/types/database.types";

export const sedeSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  codigo_dane: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
});

export const anioLectivoSchema = z
  .object({
    anio: z.coerce.number().int().min(2000).max(2100),
    fecha_inicio: z.string().min(1, "La fecha de inicio es obligatoria"),
    fecha_fin: z.string().min(1, "La fecha de fin es obligatoria"),
  })
  .refine((data) => data.fecha_fin > data.fecha_inicio, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["fecha_fin"],
  });

export const usuarioSchema = z.object({
  full_name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña temporal debe tener al menos 6 caracteres"),
  role: z.enum(["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"]),
  documento_numero: z.string().optional(),
  phone: z.string().optional(),
  activo: z.coerce.boolean().default(true),
});

export const usuarioUpdateSchema = z.object({
  full_name: z.string().min(2, "El nombre es obligatorio"),
  role: z.enum(["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"]),
  documento_numero: z.string().optional(),
  phone: z.string().optional(),
});

export async function listSedes(): Promise<Sede[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sedes").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as Sede[];
}

export async function getSede(id: string): Promise<Sede | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sedes").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Sede | null;
}

export async function createSede(input: z.infer<typeof sedeSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("sedes").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSede(id: string, input: z.infer<typeof sedeSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("sedes").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function actualizarEstadoSede(id: string, activa: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("sedes").update({ activa }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSede(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sedes").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: la sede tiene grupos u otros registros asociados.");
}

export async function listAniosLectivos(): Promise<AnioLectivo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("anios_lectivos").select("*").order("anio", { ascending: false });
  if (error) throw new Error(error.message);
  return data as AnioLectivo[];
}

export async function getAnioLectivo(id: string): Promise<AnioLectivo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("anios_lectivos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as AnioLectivo | null;
}

export async function createAnioLectivo(input: z.infer<typeof anioLectivoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("anios_lectivos").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateAnioLectivo(id: string, input: z.infer<typeof anioLectivoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("anios_lectivos").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function activarAnioLectivo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("anios_lectivos").update({ estado: "activo" }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAnioLectivo(id: string) {
  const supabase = await createClient();
  const { data: anio } = await supabase.from("anios_lectivos").select("estado").eq("id", id).maybeSingle();
  if (anio?.estado === "activo") {
    throw new Error("No se puede eliminar un año lectivo activo.");
  }
  const { error } = await supabase.from("anios_lectivos").delete().eq("id", id);
  if (error) throw new Error("No se puede eliminar: el año lectivo tiene matrículas u otros registros asociados.");
}

export async function getAnioLectivoActivo(): Promise<AnioLectivo | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("anios_lectivos").select("*").eq("estado", "activo").maybeSingle();
  return (data as AnioLectivo) ?? null;
}

export async function listProfiles(role?: UserRole): Promise<Profile[]> {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").order("full_name");
  if (role) query = query.eq("role", role);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Profile[];
}

export async function createUsuario(input: z.infer<typeof usuarioSchema>) {
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
    role: input.role,
    documento_numero: input.documento_numero || null,
    phone: input.phone || null,
    activo: input.activo,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    if (profileError.message.includes("duplicate") || profileError.code === "23505") {
      throw new Error("Ya existe un usuario con ese documento o correo.");
    }
    throw new Error(profileError.message);
  }

  if (input.role === "docente") {
    const { error: docenteError } = await admin.from("docentes").insert({ id: created.user.id });
    if (docenteError) throw new Error(docenteError.message);
  }
  if (input.role === "padre_familia") {
    const { error: acudienteError } = await admin.from("acudientes").insert({ id: created.user.id });
    if (acudienteError) throw new Error(acudienteError.message);
  }
}

export async function actualizarEstadoUsuario(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getUsuario(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function updateUsuario(id: string, input: z.infer<typeof usuarioUpdateSchema>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      role: input.role,
      documento_numero: input.documento_numero || null,
      phone: input.phone || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
