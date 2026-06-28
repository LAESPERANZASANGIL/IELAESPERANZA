"use server";

import { revalidatePath } from "next/cache";
import { anioLectivoSchema, createAnioLectivo, activarAnioLectivo } from "@/modules/core";

export async function createAnioLectivoAction(formData: FormData) {
  const input = anioLectivoSchema.parse({
    anio: formData.get("anio"),
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  await createAnioLectivo(input);
  revalidatePath("/administracion/anios-lectivos");
}

export async function activarAnioLectivoAction(formData: FormData) {
  const id = String(formData.get("id"));
  await activarAnioLectivo(id);
  revalidatePath("/administracion/anios-lectivos");
}
