"use server";

import { revalidatePath } from "next/cache";
import { asignaturaSchema, createAsignatura } from "@/modules/academico";

export async function createAsignaturaAction(formData: FormData) {
  const input = asignaturaSchema.parse({
    nombre: formData.get("nombre"),
    area: formData.get("area") || undefined,
    descripcion: formData.get("descripcion") || undefined,
  });
  await createAsignatura(input);
  revalidatePath("/asignaturas");
}
