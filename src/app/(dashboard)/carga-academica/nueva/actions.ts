"use server";

import { redirect } from "next/navigation";
import { mallaCurricularCreateSchema, createMallaCurricular } from "@/modules/academico";

export async function crearMallaAction(formData: FormData) {
  const input = mallaCurricularCreateSchema.parse({
    grupo_id: formData.get("grupo_id"),
    asignatura_id: formData.get("asignatura_id"),
    docente_id: formData.get("docente_id") || undefined,
    intensidad_horaria: formData.get("intensidad_horaria") || undefined,
  });
  await createMallaCurricular(input);
  redirect("/carga-academica");
}
