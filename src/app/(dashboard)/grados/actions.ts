"use server";

import { revalidatePath } from "next/cache";
import { gradoSchema, createGrado, grupoSchema, createGrupo } from "@/modules/academico";

export async function createGradoAction(formData: FormData) {
  const input = gradoSchema.parse({
    nombre: formData.get("nombre"),
    nivel: formData.get("nivel"),
    orden: formData.get("orden") || 0,
  });
  await createGrado(input);
  revalidatePath("/grados");
}

export async function createGrupoAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const input = grupoSchema.parse({
    grado_id: gradoId,
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    capacidad: formData.get("capacidad") || undefined,
    jornada: formData.get("jornada") || undefined,
    director_grupo_id: formData.get("director_grupo_id") || undefined,
  });
  await createGrupo(input);
  revalidatePath(`/grados/${gradoId}`);
}
