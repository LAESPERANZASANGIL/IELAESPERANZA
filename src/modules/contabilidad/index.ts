import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ContabilidadPeriodo = {
  id: string; nombre: string; fecha_inicio: string; fecha_fin: string; estado: string; created_at: string;
};
export type ContabilidadCuenta = {
  id: string; codigo: string; nombre: string; tipo: string; descripcion: string | null; is_active: boolean;
};
export type ContabilidadIngreso = {
  id: string; periodo_id: string | null; cuenta_id: string | null; fecha: string;
  concepto: string; valor: number; comprobante: string | null; observacion: string | null;
  created_at: string; cuenta?: ContabilidadCuenta | null;
};
export type ContabilidadEgreso = {
  id: string; periodo_id: string | null; cuenta_id: string | null; fecha: string;
  concepto: string; valor: number; comprobante: string | null; observacion: string | null;
  created_at: string; cuenta?: ContabilidadCuenta | null;
};

export const periodoContableSchema = z.object({
  nombre: z.string().min(1),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().min(1),
});

export const cuentaSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  tipo: z.enum(["ingreso", "egreso", "activo", "pasivo", "patrimonio"]),
  descripcion: z.string().optional(),
});

export const ingresoSchema = z.object({
  periodo_id: z.string().uuid().optional().nullable(),
  cuenta_id: z.string().uuid().optional().nullable(),
  fecha: z.string().min(1),
  concepto: z.string().min(1),
  valor: z.coerce.number().min(0),
  comprobante: z.string().optional(),
  observacion: z.string().optional(),
});

export const egresoSchema = ingresoSchema;

// ─── Períodos ────────────────────────────────────────────────────────────────

export async function listPeriodosContables(): Promise<ContabilidadPeriodo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("contabilidad_periodos").select("*").order("fecha_inicio", { ascending: false });
  if (error) throw new Error(error.message);
  return data as ContabilidadPeriodo[];
}

export async function createPeriodoContable(input: z.infer<typeof periodoContableSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_periodos").insert(input);
  if (error) throw new Error(error.message);
}

export async function cerrarPeriodoContable(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_periodos").update({ estado: "cerrado" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Cuentas ─────────────────────────────────────────────────────────────────

export async function listCuentas(tipo?: string): Promise<ContabilidadCuenta[]> {
  const supabase = await createClient();
  let q = supabase.from("contabilidad_cuentas").select("*").eq("is_active", true).order("codigo");
  if (tipo) q = q.eq("tipo", tipo);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as ContabilidadCuenta[];
}

export async function createCuenta(input: z.infer<typeof cuentaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_cuentas").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateCuenta(id: string, input: z.infer<typeof cuentaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_cuentas").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Ingresos ────────────────────────────────────────────────────────────────

export async function listIngresos(periodoId?: string): Promise<ContabilidadIngreso[]> {
  const supabase = await createClient();
  let q = supabase.from("contabilidad_ingresos").select("*, cuenta:contabilidad_cuentas(*)").order("fecha", { ascending: false });
  if (periodoId) q = q.eq("periodo_id", periodoId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as ContabilidadIngreso[];
}

export async function createIngreso(input: z.infer<typeof ingresoSchema>, registradoPor: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_ingresos").insert({ ...input, registrado_por: registradoPor });
  if (error) throw new Error(error.message);
}

export async function deleteIngreso(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_ingresos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Egresos ─────────────────────────────────────────────────────────────────

export async function listEgresos(periodoId?: string): Promise<ContabilidadEgreso[]> {
  const supabase = await createClient();
  let q = supabase.from("contabilidad_egresos").select("*, cuenta:contabilidad_cuentas(*)").order("fecha", { ascending: false });
  if (periodoId) q = q.eq("periodo_id", periodoId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as ContabilidadEgreso[];
}

export async function createEgreso(input: z.infer<typeof egresoSchema>, registradoPor: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_egresos").insert({ ...input, registrado_por: registradoPor });
  if (error) throw new Error(error.message);
}

export async function deleteEgreso(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("contabilidad_egresos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Resultado del ejercicio ─────────────────────────────────────────────────

export async function getResultadoEjercicio(periodoId?: string) {
  const [ingresos, egresos] = await Promise.all([
    listIngresos(periodoId),
    listEgresos(periodoId),
  ]);
  const totalIngresos = ingresos.reduce((a, i) => a + Number(i.valor), 0);
  const totalEgresos = egresos.reduce((a, e) => a + Number(e.valor), 0);
  return {
    totalIngresos,
    totalEgresos,
    resultado: totalIngresos - totalEgresos,
    ingresos,
    egresos,
  };
}
