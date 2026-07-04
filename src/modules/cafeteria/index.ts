import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CafeteriaCategoria = {
  id: string; nombre: string; descripcion: string | null; is_active: boolean; created_at: string;
};
export type CafeteriaProducto = {
  id: string; categoria_id: string | null; nombre: string; descripcion: string | null;
  precio: number; stock: number; is_active: boolean; created_at: string; updated_at: string;
  categoria?: CafeteriaCategoria | null;
};
export type CafeteriaVenta = {
  id: string; fecha: string; cliente_nombre: string | null; total: number;
  observacion: string | null; registrado_por: string | null; created_at: string;
  items?: CafeteriaVentaItem[];
};
export type CafeteriaVentaItem = {
  id: string; venta_id: string; producto_id: string | null; nombre_producto: string;
  cantidad: number; precio_unitario: number; subtotal: number;
};
export type CafeteriaGasto = {
  id: string; fecha: string; concepto: string; monto: number;
  observacion: string | null; registrado_por: string | null; created_at: string;
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const categoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  descripcion: z.string().optional(),
});

export const productoSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria_id: z.string().uuid().optional().nullable(),
  descripcion: z.string().optional(),
  precio: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
});

export const ventaItemSchema = z.object({
  producto_id: z.string().uuid().optional().nullable(),
  nombre_producto: z.string().min(1),
  cantidad: z.coerce.number().int().min(1),
  precio_unitario: z.coerce.number().min(0),
});

export const ventaSchema = z.object({
  fecha: z.string().min(1),
  cliente_nombre: z.string().optional(),
  observacion: z.string().optional(),
  items: z.array(ventaItemSchema).min(1, "Agrega al menos un producto"),
});

export const gastoSchema = z.object({
  fecha: z.string().min(1),
  concepto: z.string().min(1, "El concepto es obligatorio"),
  monto: z.coerce.number().min(0),
  observacion: z.string().optional(),
});

// ─── Categorías ──────────────────────────────────────────────────────────────

export async function listCategorias(): Promise<CafeteriaCategoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cafeteria_categorias").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as CafeteriaCategoria[];
}

export async function createCategoria(input: z.infer<typeof categoriaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_categorias").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateCategoria(id: string, input: z.infer<typeof categoriaSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_categorias").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCategoria(id: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("cafeteria_productos").select("id", { count: "exact", head: true }).eq("categoria_id", id);
  if (count && count > 0) throw new Error("No se puede eliminar: tiene productos asociados.");
  const { error } = await supabase.from("cafeteria_categorias").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Productos ───────────────────────────────────────────────────────────────

export async function listProductos(soloActivos = false): Promise<CafeteriaProducto[]> {
  const supabase = await createClient();
  let q = supabase.from("cafeteria_productos").select("*, categoria:cafeteria_categorias(*)").order("nombre");
  if (soloActivos) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as CafeteriaProducto[];
}

export async function createProducto(input: z.infer<typeof productoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_productos").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateProducto(id: string, input: z.infer<typeof productoSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_productos").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function actualizarStockProducto(id: string, stock: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_productos").update({ stock, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProducto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_productos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Ventas ──────────────────────────────────────────────────────────────────

export async function listVentas(fecha?: string): Promise<CafeteriaVenta[]> {
  const supabase = await createClient();
  let q = supabase.from("cafeteria_ventas").select("*, items:cafeteria_venta_items(*)").order("created_at", { ascending: false });
  if (fecha) q = q.eq("fecha", fecha);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as unknown as CafeteriaVenta[];
}

export async function createVenta(
  input: z.infer<typeof ventaSchema>,
  registradoPor: string,
): Promise<string> {
  const supabase = await createClient();
  const total = input.items.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);
  const { data: venta, error } = await supabase
    .from("cafeteria_ventas")
    .insert({ fecha: input.fecha, cliente_nombre: input.cliente_nombre, observacion: input.observacion, total, registrado_por: registradoPor })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const items = input.items.map((i) => ({
    venta_id: venta.id,
    producto_id: i.producto_id || null,
    nombre_producto: i.nombre_producto,
    cantidad: i.cantidad,
    precio_unitario: i.precio_unitario,
    subtotal: i.cantidad * i.precio_unitario,
  }));
  const { error: itemsError } = await supabase.from("cafeteria_venta_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  // Descuenta stock de los productos vendidos
  for (const item of input.items) {
    if (!item.producto_id) continue;
    const { data: prod } = await supabase
      .from("cafeteria_productos")
      .select("stock")
      .eq("id", item.producto_id)
      .single();
    if (prod) {
      await supabase
        .from("cafeteria_productos")
        .update({ stock: Math.max(0, prod.stock - item.cantidad) })
        .eq("id", item.producto_id);
    }
  }

  return venta.id;
}

export async function deleteVenta(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_ventas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Gastos ──────────────────────────────────────────────────────────────────

export async function listGastos(fecha?: string): Promise<CafeteriaGasto[]> {
  const supabase = await createClient();
  let q = supabase.from("cafeteria_gastos").select("*").order("fecha", { ascending: false });
  if (fecha) q = q.eq("fecha", fecha);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as CafeteriaGasto[];
}

export async function createGasto(input: z.infer<typeof gastoSchema>, registradoPor: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_gastos").insert({ ...input, registrado_por: registradoPor });
  if (error) throw new Error(error.message);
}

export async function deleteGasto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cafeteria_gastos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export async function getBalance(fechaInicio?: string, fechaFin?: string) {
  const supabase = await createClient();

  let qV = supabase.from("cafeteria_ventas").select("total, fecha");
  let qG = supabase.from("cafeteria_gastos").select("monto, fecha");

  if (fechaInicio) { qV = qV.gte("fecha", fechaInicio); qG = qG.gte("fecha", fechaInicio); }
  if (fechaFin) { qV = qV.lte("fecha", fechaFin); qG = qG.lte("fecha", fechaFin); }

  const [{ data: ventas }, { data: gastos }] = await Promise.all([qV, qG]);

  const totalIngresos = (ventas ?? []).reduce((acc: number, v: any) => acc + Number(v.total), 0);
  const totalGastos = (gastos ?? []).reduce((acc: number, g: any) => acc + Number(g.monto), 0);

  return { totalIngresos, totalGastos, balance: totalIngresos - totalGastos };
}
