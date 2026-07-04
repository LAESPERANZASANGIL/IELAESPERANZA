import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type CarteraCliente = {
  id: string; nombres: string; apellidos: string; documento: string | null;
  telefono: string | null; email: string | null; direccion: string | null;
  tipo: string; is_active: boolean; created_at: string;
};
export type CarteraFactura = {
  id: string; cliente_id: string; numero: string | null; concepto: string;
  fecha_emision: string; fecha_vencimiento: string | null;
  valor_total: number; saldo: number; estado: string;
  observacion: string | null; created_at: string;
  cliente?: CarteraCliente;
};
export type CarteraPago = {
  id: string; factura_id: string; fecha: string; monto: number;
  forma_pago: string; referencia: string | null; created_at: string;
};

export const clienteSchema = z.object({
  nombres: z.string().min(1),
  apellidos: z.string().min(1),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  direccion: z.string().optional(),
  tipo: z.enum(["padre_familia", "empresa", "otro"]).default("padre_familia"),
});

export const facturaSchema = z.object({
  cliente_id: z.string().uuid(),
  numero: z.string().optional(),
  concepto: z.string().min(1),
  fecha_emision: z.string().min(1),
  fecha_vencimiento: z.string().optional(),
  valor_total: z.coerce.number().min(0),
  observacion: z.string().optional(),
});

export const pagoSchema = z.object({
  factura_id: z.string().uuid(),
  fecha: z.string().min(1),
  monto: z.coerce.number().min(0.01),
  forma_pago: z.enum(["efectivo", "transferencia", "cheque", "otro"]).default("efectivo"),
  referencia: z.string().optional(),
});

// ─── Clientes ────────────────────────────────────────────────────────────────

export async function listClientesCartera(soloActivos = false): Promise<CarteraCliente[]> {
  const supabase = await createClient();
  let q = supabase.from("cartera_clientes").select("*").order("apellidos");
  if (soloActivos) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as CarteraCliente[];
}

export async function createClienteCartera(input: z.infer<typeof clienteSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cartera_clientes").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateClienteCartera(id: string, input: z.infer<typeof clienteSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cartera_clientes").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Facturas ────────────────────────────────────────────────────────────────

export async function listFacturas(estado?: string): Promise<CarteraFactura[]> {
  const supabase = await createClient();
  let q = supabase
    .from("cartera_facturas")
    .select("*, cliente:cartera_clientes(*)")
    .order("fecha_emision", { ascending: false });
  if (estado) q = q.eq("estado", estado);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as CarteraFactura[];
}

export async function getFactura(id: string): Promise<CarteraFactura | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cartera_facturas")
    .select("*, cliente:cartera_clientes(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as CarteraFactura | null;
}

export async function createFactura(input: z.infer<typeof facturaSchema>, createdBy: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cartera_facturas").insert({
    ...input,
    saldo: input.valor_total,
    estado: "pendiente",
    created_by: createdBy,
  });
  if (error) throw new Error(error.message);
}

export async function anularFactura(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cartera_facturas").update({ estado: "anulada" }).eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Pagos ───────────────────────────────────────────────────────────────────

export async function listPagosFactura(facturaId: string): Promise<CarteraPago[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cartera_pagos")
    .select("*")
    .eq("factura_id", facturaId)
    .order("fecha", { ascending: false });
  if (error) throw new Error(error.message);
  return data as CarteraPago[];
}

export async function registrarPago(input: z.infer<typeof pagoSchema>, registradoPor: string) {
  const supabase = await createClient();

  const { data: factura, error: fErr } = await supabase
    .from("cartera_facturas")
    .select("saldo, valor_total")
    .eq("id", input.factura_id)
    .single();
  if (fErr || !factura) throw new Error("Factura no encontrada.");

  const nuevoSaldo = Math.max(0, Number(factura.saldo) - input.monto);
  const nuevoEstado = nuevoSaldo === 0 ? "pagada" : "parcial";

  const { error: pagoErr } = await supabase
    .from("cartera_pagos")
    .insert({ ...input, registrado_por: registradoPor });
  if (pagoErr) throw new Error(pagoErr.message);

  const { error: updErr } = await supabase
    .from("cartera_facturas")
    .update({ saldo: nuevoSaldo, estado: nuevoEstado })
    .eq("id", input.factura_id);
  if (updErr) throw new Error(updErr.message);
}

// ─── Resumen ─────────────────────────────────────────────────────────────────

export async function getResumenCartera() {
  const supabase = await createClient();
  const { data } = await supabase.from("cartera_facturas").select("estado, saldo, valor_total");
  const rows = data ?? [];
  return {
    totalPendiente: rows.filter((r: any) => r.estado === "pendiente" || r.estado === "parcial").reduce((a: number, r: any) => a + Number(r.saldo), 0),
    totalCobrado: rows.filter((r: any) => r.estado === "pagada").reduce((a: number, r: any) => a + Number(r.valor_total), 0),
    enMora: rows.filter((r: any) => r.estado === "vencida").length,
    totalFacturas: rows.length,
  };
}
