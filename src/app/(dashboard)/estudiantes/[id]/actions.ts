"use server";

import { revalidatePath } from "next/cache";
import { vincularAcudienteSchema, vincularAcudiente } from "@/modules/estudiantes";
import { matriculaSchema, createMatriculaDirecta, retirarMatricula } from "@/modules/matricula";

export async function vincularAcudienteAction(formData: FormData) {
  const estudianteId = String(formData.get("estudiante_id"));
  const input = vincularAcudienteSchema.parse({
    estudiante_id: estudianteId,
    acudiente_id: formData.get("acudiente_id"),
    parentesco: formData.get("parentesco") || undefined,
    es_acudiente_principal: formData.get("es_acudiente_principal") === "on",
  });
  await vincularAcudiente(input);
  revalidatePath(`/estudiantes/${estudianteId}`);
}

export async function createMatriculaDirectaAction(formData: FormData) {
  const estudianteId = String(formData.get("estudiante_id"));
  const input = matriculaSchema.parse({
    estudiante_id: estudianteId,
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    grupo_id: formData.get("grupo_id"),
  });
  await createMatriculaDirecta(input);
  revalidatePath(`/estudiantes/${estudianteId}`);
}

export async function retirarMatriculaAction(formData: FormData) {
  const estudianteId = String(formData.get("estudiante_id"));
  const id = String(formData.get("matricula_id"));
  const motivo = String(formData.get("motivo") ?? "");
  await retirarMatricula(id, motivo);
  revalidatePath(`/estudiantes/${estudianteId}`);
}
