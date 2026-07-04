"use server";
import { revalidatePath } from "next/cache";
import { pagoSchema, registrarPago } from "@/modules/cartera";
import { requireProfile } from "@/lib/auth/session";

export async function registrarPagoAction(formData: FormData) {
  const profile = await requireProfile();
  const input = pagoSchema.parse({ factura_id: formData.get("factura_id"), fecha: formData.get("fecha"), monto: formData.get("monto"), forma_pago: formData.get("forma_pago") || "efectivo", referencia: formData.get("referencia") || undefined });
  await registrarPago(input, profile.id);
  revalidatePath("/cartera/cobros");
  revalidatePath("/cartera/facturas");
}
