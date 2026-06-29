"use server";

import { revalidatePath } from "next/cache";
import { asignaturaSchema, createAsignatura, actualizarEstadoAsignatura } from "@/modules/academico";

export async function createAsignaturaAction(formData: FormData) {
  const input = asignaturaSchema.parse({
    nombre: formData.get("nombre"),
    area: formData.get("area") || undefined,
    descripcion: formData.get("descripcion") || undefined,
  });
  await createAsignatura(input);
  revalidatePath("/asignaturas");
}

export async function actualizarEstadoAsignaturaAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoAsignatura(id, isActive);
  revalidatePath("/asignaturas");
}
