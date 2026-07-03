"use server";
import { revalidatePath } from "next/cache";
import { periodoContableSchema, createPeriodoContable, cerrarPeriodoContable } from "@/modules/contabilidad";

export async function createPeriodoContableAction(formData: FormData) {
  const input = periodoContableSchema.parse({ nombre: formData.get("nombre"), fecha_inicio: formData.get("fecha_inicio"), fecha_fin: formData.get("fecha_fin") });
  await createPeriodoContable(input);
  revalidatePath("/contabilidad/periodos");
}
export async function cerrarPeriodoContableAction(formData: FormData) {
  await cerrarPeriodoContable(formData.get("id") as string);
  revalidatePath("/contabilidad/periodos");
}
