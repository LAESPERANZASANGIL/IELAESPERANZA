"use server";

import { revalidatePath } from "next/cache";
import { procesoMatriculaSchema, createProcesoMatricula, updateProcesoMatricula, deleteProcesoMatricula } from "@/modules/matricula";

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

export async function updateProcesoMatriculaAction(formData: FormData) {
  const id = formData.get("id") as string;
  const input = procesoMatriculaSchema.parse({
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    fecha_apertura: formData.get("fecha_apertura"),
    fecha_cierre: formData.get("fecha_cierre"),
  });
  await updateProcesoMatricula(id, input);
  revalidatePath("/matricula/procesos");
}

export async function deleteProcesoMatriculaAction(formData: FormData) {
  const id = formData.get("id") as string;
  await deleteProcesoMatricula(id);
  revalidatePath("/matricula/procesos");
}
