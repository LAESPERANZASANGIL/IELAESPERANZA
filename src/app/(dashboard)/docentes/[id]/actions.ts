"use server";

import { revalidatePath } from "next/cache";
import { docenteUpdateSchema, updateDocente } from "@/modules/academico";

export async function updateDocenteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = docenteUpdateSchema.parse({
    especialidad: formData.get("especialidad") || undefined,
    tipo_contrato: formData.get("tipo_contrato") || undefined,
    fecha_ingreso: formData.get("fecha_ingreso") || undefined,
  });
  await updateDocente(id, input);
  revalidatePath(`/docentes/${id}`);
  revalidatePath("/docentes");
}
