"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ventaSchema, createVenta } from "@/modules/cafeteria";
import { requireProfile } from "@/lib/auth/session";

export async function registrarVentaAction(formData: FormData) {
  const profile = await requireProfile();
  const itemsRaw = formData.get("items") as string;
  const input = ventaSchema.parse({
    fecha: formData.get("fecha"),
    cliente_nombre: formData.get("cliente_nombre") || undefined,
    observacion: formData.get("observacion") || undefined,
    items: JSON.parse(itemsRaw),
  });
  await createVenta(input, profile.id);
  revalidatePath("/cafeteria/ventas");
  redirect(`/cafeteria/ventas?fecha=${input.fecha}`);
}
