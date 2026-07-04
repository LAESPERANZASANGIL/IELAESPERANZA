import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type NominaCargo = { id: string; nombre: string; descripcion: string | null; salario_base: number };
export type NominaEmpleado = {
  id: string; profile_id: string | null; cargo_id: string | null; nombres: string; apellidos: string;
  documento: string | null; fecha_ingreso: string | null; tipo_contrato: string;
  salario: number; is_active: boolean; created_at: string;
  cargo?: NominaCargo | null;
};
export type NominaPeriodo = { id: string; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string; created_at: string };
export type NominaLiquidacion = {
  id: string; periodo_id: string; empleado_id: string; salario_base: number;
  bonificaciones: number; deducciones: number; neto: number; observacion: string | null; created_at: string;
  empleado?: NominaEmpleado;
};
export type NominaNovedades = {
  id: string; empleado_id: string; tipo: string; fecha_inicio: string;
  fecha_fin: string | null; dias: number | null; descripcion: string | null; created_at: string;
};

export const cargoSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  salario_base: z.coerce.number().min(0),
});

export const empleadoSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  documento: z.string().optional(),
  cargo_id: z.string().uuid().optional().nullable(),
  fecha_ingreso: z.string().optional(),
  tipo_contrato: z.enum(["indefinido", "fijo", "prestacion_servicios"]).default("indefinido"),
  salario: z.coerce.number().min(0),
});

export const periodoSchema = z.object({
  nombre: z.string().min(1),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().min(1),
});

export const liquidacionSchema = z.object({
  empleado_id: z.string().uuid(),
  bonificaciones: z.coerce.number().min(0).default(0),
  deducciones: z.coerce.number().min(0).default(0),
  observacion: z.string().optional(),
});

export const novedadSchema = z.object({
  empleado_id: z.string().uuid(),
  tipo: z.enum(["licencia", "incapacidad", "vacaciones", "permiso", "sancion"]),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().optional(),
  dias: z.coerce.number().int().min(1).optional(),
  descripcion: z.string().optional(),
});

// ─── Cargos ──────────────────────────────────────────────────────────────────

export async function listCargos(): Promise<NominaCargo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("nomina_cargos").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as NominaCargo[];
}

export async function createCargo(input: z.infer<typeof cargoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_cargos").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateCargo(id: string, input: z.infer<typeof cargoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_cargos").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCargo(id: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("nomina_empleados").select("id", { count: "exact", head: true }).eq("cargo_id", id);
  if (count && count > 0) throw new Error("No se puede eliminar: tiene empleados asociados.");
  const { error } = await supabase.from("nomina_cargos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Empleados ───────────────────────────────────────────────────────────────

export async function listEmpleados(soloActivos = false): Promise<NominaEmpleado[]> {
  const supabase = await createClient();
  let q = supabase.from("nomina_empleados").select("*, cargo:nomina_cargos(*)").order("apellidos");
  if (soloActivos) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as NominaEmpleado[];
}

export async function createEmpleado(input: z.infer<typeof empleadoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_empleados").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateEmpleado(id: string, input: z.infer<typeof empleadoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_empleados").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function actualizarEstadoEmpleado(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_empleados").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Períodos ────────────────────────────────────────────────────────────────

export async function listPeriodosNomina(): Promise<NominaPeriodo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("nomina_periodos").select("*").order("fecha_inicio", { ascending: false });
  if (error) throw new Error(error.message);
  return data as NominaPeriodo[];
}

export async function createPeriodoNomina(input: z.infer<typeof periodoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_periodos").insert(input);
  if (error) throw new Error(error.message);
}

export async function cerrarPeriodoNomina(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_periodos").update({ estado: "liquidado" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Liquidaciones ───────────────────────────────────────────────────────────

export async function listLiquidaciones(periodoId: string): Promise<NominaLiquidacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nomina_liquidaciones")
    .select("*, empleado:nomina_empleados(*, cargo:nomina_cargos(*))")
    .eq("periodo_id", periodoId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data as unknown as NominaLiquidacion[];
}

export async function liquidarEmpleado(
  periodoId: string,
  input: z.infer<typeof liquidacionSchema>,
) {
  const supabase = await createClient();
  const { data: emp } = await supabase.from("nomina_empleados").select("salario").eq("id", input.empleado_id).single();
  const salarioBase = Number(emp?.salario ?? 0);
  const neto = salarioBase + input.bonificaciones - input.deducciones;
  const { error } = await supabase.from("nomina_liquidaciones").upsert({
    periodo_id: periodoId,
    empleado_id: input.empleado_id,
    salario_base: salarioBase,
    bonificaciones: input.bonificaciones,
    deducciones: input.deducciones,
    neto,
    observacion: input.observacion,
  }, { onConflict: "periodo_id,empleado_id" });
  if (error) throw new Error(error.message);
}

// ─── Novedades ───────────────────────────────────────────────────────────────

export async function listNovedades(empleadoId?: string): Promise<NominaNovedades[]> {
  const supabase = await createClient();
  let q = supabase.from("nomina_novedades").select("*").order("fecha_inicio", { ascending: false });
  if (empleadoId) q = q.eq("empleado_id", empleadoId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as NominaNovedades[];
}

export async function createNovedad(input: z.infer<typeof novedadSchema>, createdBy: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_novedades").insert({ ...input, created_by: createdBy });
  if (error) throw new Error(error.message);
}

export async function deleteNovedad(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("nomina_novedades").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
