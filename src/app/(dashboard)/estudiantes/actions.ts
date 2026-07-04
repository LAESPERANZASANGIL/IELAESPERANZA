"use server";

import { revalidatePath } from "next/cache";
import { estudianteSchema, createEstudiante, actualizarEstadoEstudiante } from "@/modules/estudiantes";

export async function createEstudianteAction(formData: FormData) {
  const input = estudianteSchema.parse({
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    documento_tipo: formData.get("documento_tipo") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    fecha_nacimiento: formData.get("fecha_nacimiento") || undefined,
    genero: formData.get("genero") || undefined,
  });
  try {
    await createEstudiante(input);
  } catch (err) {
    if (err instanceof Error && (err.message.includes("duplicate") || err.message.includes("23505"))) {
      throw new Error("Ya existe un estudiante con ese número de documento.");
    }
    throw err;
  }
  revalidatePath("/estudiantes");
}

export async function actualizarEstadoEstudianteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoEstudiante(id, isActive);
  revalidatePath("/estudiantes");
}
