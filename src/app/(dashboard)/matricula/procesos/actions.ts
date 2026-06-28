"use server";

import { revalidatePath } from "next/cache";
import { procesoMatriculaSchema, createProcesoMatricula } from "@/modules/matricula";

export async function createProcesoMatriculaAction(formData: FormData) {
  const input = procesoMatriculaSchema.parse({
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    fecha_apertura: formData.get("fecha_apertura"),
    fecha_cierre: formData.get("fecha_cierre"),
  });
  await createProcesoMatricula(input);
  revalidatePath("/matricula/procesos");
}
