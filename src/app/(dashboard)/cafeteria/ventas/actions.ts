"use server";
import { revalidatePath } from "next/cache";
import { createVenta, deleteVenta } from "@/modules/cafeteria";
import { requireProfile } from "@/lib/auth/session";

export async function createVentaAction(formData: FormData) {
  const profile = await requireProfile();
  const fecha = formData.get("fecha") as string;
  const clienteNombre = formData.get("cliente_nombre") as string;

  const items: { nombre_producto: string; cantidad: number; precio_unitario: number; producto_id?: string }[] = [];
  let i = 0;
  while (formData.get(`items[${i}][nombre_producto]`)) {
    items.push({
      nombre_producto: formData.get(`items[${i}][nombre_producto]`) as string,
      cantidad: Number(formData.get(`items[${i}][cantidad]`)),
      precio_unitario: Number(formData.get(`items[${i}][precio_unitario]`)),
      producto_id: formData.get(`items[${i}][producto_id]`) as string || undefined,
    });
    i++;
  }

  await createVenta({ fecha, cliente_nombre: clienteNombre || undefined, items }, profile.id);
  revalidatePath("/cafeteria/ventas");
}

export async function deleteVentaAction(formData: FormData) {
  await deleteVenta(formData.get("id") as string);
  revalidatePath("/cafeteria/ventas");
}
