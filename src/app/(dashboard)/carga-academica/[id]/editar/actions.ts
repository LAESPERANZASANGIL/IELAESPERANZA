"use server";

import { redirect } from "next/navigation";
import { updateMallaCurricular, mallaCurricularCreateSchema } from "@/modules/academico";

export async function editarMallaAction(formData: FormData) {
  const id = String(formData.get("id"));
  const updateSchema = mallaCurricularCreateSchema.pick({ docente_id: true, intensidad_horaria: true });
  const input = updateSchema.parse({
    docente_id: formData.get("docente_id") || undefined,
    intensidad_horaria: formData.get("intensidad_horaria") || undefined,
  });
  await updateMallaCurricular(id, input);
  redirect("/carga-academica");
}
