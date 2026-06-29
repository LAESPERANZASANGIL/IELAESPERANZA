"use server";

import { revalidatePath } from "next/cache";
import { vincularAcudienteSchema, vincularAcudiente, estudianteUpdateSchema, updateEstudiante, deleteEstudiante } from "@/modules/estudiantes";
import { matriculaSchema, createMatriculaDirecta, retirarMatricula } from "@/modules/matricula";

export async function updateEstudianteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = estudianteUpdateSchema.parse({
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    documento_tipo: formData.get("documento_tipo") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    fecha_nacimiento: formData.get("fecha_nacimiento") || undefined,
    genero: formData.get("genero") || undefined,
    estado_general: formData.get("estado_general"),
  });
  await updateEstudiante(id, input);
  revalidatePath(`/estudiantes/${id}`);
  revalidatePath("/estudiantes");
}

export async function deleteEstudianteAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteEstudiante(id);
  revalidatePath("/estudiantes");
}

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
