"use server";
import { revalidatePath } from "next/cache";
import { facturaSchema, createFactura, anularFactura } from "@/modules/cartera";
import { requireProfile } from "@/lib/auth/session";

export async function createFacturaAction(formData: FormData) {
  const profile = await requireProfile();
  const input = facturaSchema.parse({ cliente_id: formData.get("cliente_id"), numero: formData.get("numero") || undefined, concepto: formData.get("concepto"), fecha_emision: formData.get("fecha_emision"), fecha_vencimiento: formData.get("fecha_vencimiento") || undefined, valor_total: formData.get("valor_total"), observacion: formData.get("observacion") || undefined });
  await createFactura(input, profile.id);
  revalidatePath("/cartera/facturas");
}
export async function anularFacturaAction(formData: FormData) {
  await anularFactura(formData.get("id") as string);
  revalidatePath("/cartera/facturas");
}
