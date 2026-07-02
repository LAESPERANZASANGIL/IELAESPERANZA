"use server";

import { revalidatePath } from "next/cache";
import { notaSchema, createNota, deleteNota } from "@/modules/notas";

export async function createNotaAction(formData: FormData) {
  const input = notaSchema.parse({
    matricula_id: formData.get("matricula_id"),
    malla_curricular_id: formData.get("malla_curricular_id"),
    periodo_academico_id: formData.get("periodo_academico_id"),
    tipo_evaluacion_id: formData.get("tipo_evaluacion_id") || undefined,
    valor: formData.get("valor"),
    descripcion: formData.get("descripcion") || undefined,
  });
  await createNota(input);
  revalidatePath("/notas");
}

export async function deleteNotaAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteNota(id);
  revalidatePath("/notas");
}
