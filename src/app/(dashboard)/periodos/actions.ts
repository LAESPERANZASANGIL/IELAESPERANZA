"use server";

import { revalidatePath } from "next/cache";
import { periodoSchema, createPeriodo } from "@/modules/academico";

export async function createPeriodoAction(formData: FormData) {
  const input = periodoSchema.parse({
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    orden: formData.get("orden") || 0,
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  await createPeriodo(input);
  revalidatePath("/periodos");
}
