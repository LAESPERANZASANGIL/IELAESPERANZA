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

export async function createSede(input: z.infer<typeof sedeSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("sedes").insert(input);
  if (error) throw new Error(error.message);
}

export async function listAniosLectivos(): Promise<AnioLectivo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("anios_lectivos").select("*").order("anio", { ascending: false });
  if (error) throw new Error(error.message);
  return data as AnioLectivo[];
}

export async function createAnioLectivo(input: z.infer<typeof anioLectivoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("anios_lectivos").insert(input);
  if (error) throw new Error(error.message);
}

export async function activarAnioLectivo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("anios_lectivos").update({ estado: "activo" }).eq("id", id);
  if (error) throw new Error(error.message);
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

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(input.email);
  if (inviteError) throw new Error(inviteError.message);

  const { error: profileError } = await admin.from("profiles").insert({
    id: invited.user.id,
    full_name: input.full_name,
    email: input.email,
    role: input.role,
    documento_numero: input.documento_numero || null,
    phone: input.phone || null,
  });
  if (profileError) throw new Error(profileError.message);

  if (input.role === "docente") {
    const { error: docenteError } = await admin.from("docentes").insert({ id: invited.user.id });
    if (docenteError) throw new Error(docenteError.message);
  }
  if (input.role === "padre_familia") {
    const { error: acudienteError } = await admin.from("acudientes").insert({ id: invited.user.id });
    if (acudienteError) throw new Error(acudienteError.message);
  }
}

export async function actualizarEstadoUsuario(id: string, activo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
}
