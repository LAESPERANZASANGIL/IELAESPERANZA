"use server";
import { revalidatePath } from "next/cache";
import { gastoSchema, createGasto, deleteGasto } from "@/modules/cafeteria";
import { requireProfile } from "@/lib/auth/session";

export async function createGastoAction(formData: FormData) {
  const profile = await requireProfile();
  const input = gastoSchema.parse({ fecha: formData.get("fecha"), concepto: formData.get("concepto"), monto: formData.get("monto"), observacion: formData.get("observacion") || undefined });
  await createGasto(input, profile.id);
  revalidatePath("/cafeteria/gastos");
}
export async function deleteGastoAction(formData: FormData) {
  await deleteGasto(formData.get("id") as string);
  revalidatePath("/cafeteria/gastos");
}
