"use server";

import { revalidatePath } from "next/cache";
import { estudianteSchema, createEstudiante } from "@/modules/estudiantes";

export async function createEstudianteAction(formData: FormData) {
  const input = estudianteSchema.parse({
    nombres: formData.get("nombres"),
    apellidos: formData.get("apellidos"),
    documento_tipo: formData.get("documento_tipo") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    fecha_nacimiento: formData.get("fecha_nacimiento") || undefined,
    genero: formData.get("genero") || undefined,
  });
  await createEstudiante(input);
  revalidatePath("/estudiantes");
}
