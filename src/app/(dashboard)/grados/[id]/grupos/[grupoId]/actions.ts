"use server";

import { revalidatePath } from "next/cache";
import { mallaCurricularSchema, asignarMallaCurricular } from "@/modules/academico";

export async function asignarMallaCurricularAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const grupoId = String(formData.get("grupo_id"));
  const input = mallaCurricularSchema.parse({
    grupo_id: grupoId,
    asignatura_id: formData.get("asignatura_id"),
    docente_id: formData.get("docente_id") || undefined,
    intensidad_horaria: formData.get("intensidad_horaria") || undefined,
  });
  await asignarMallaCurricular(input);
  revalidatePath(`/grados/${gradoId}/grupos/${grupoId}`);
}
