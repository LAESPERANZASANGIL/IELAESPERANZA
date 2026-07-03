"use server";
import { revalidatePath } from "next/cache";
import { ingresoSchema, createIngreso, deleteIngreso } from "@/modules/contabilidad";
import { requireProfile } from "@/lib/auth/session";

export async function createIngresoAction(formData: FormData) {
  const profile = await requireProfile();
  const input = ingresoSchema.parse({ periodo_id: formData.get("periodo_id") || null, cuenta_id: formData.get("cuenta_id") || null, fecha: formData.get("fecha"), concepto: formData.get("concepto"), valor: formData.get("valor"), comprobante: formData.get("comprobante") || undefined, observacion: formData.get("observacion") || undefined });
  await createIngreso(input, profile.id);
  revalidatePath("/contabilidad/ingresos");
}
export async function deleteIngresoAction(formData: FormData) {
  await deleteIngreso(formData.get("id") as string);
  revalidatePath("/contabilidad/ingresos");
}
