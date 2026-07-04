"use server";
import { revalidatePath } from "next/cache";
import { egresoSchema, createEgreso, deleteEgreso } from "@/modules/contabilidad";
import { requireProfile } from "@/lib/auth/session";

export async function createEgresoAction(formData: FormData) {
  const profile = await requireProfile();
  const input = egresoSchema.parse({ periodo_id: formData.get("periodo_id") || null, cuenta_id: formData.get("cuenta_id") || null, fecha: formData.get("fecha"), concepto: formData.get("concepto"), valor: formData.get("valor"), comprobante: formData.get("comprobante") || undefined, observacion: formData.get("observacion") || undefined });
  await createEgreso(input, profile.id);
  revalidatePath("/contabilidad/egresos");
}
export async function deleteEgresoAction(formData: FormData) {
  await deleteEgreso(formData.get("id") as string);
  revalidatePath("/contabilidad/egresos");
}
