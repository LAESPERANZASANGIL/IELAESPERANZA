"use server";

import { revalidatePath } from "next/cache";
import {
  anioLectivoSchema,
  createAnioLectivo,
  updateAnioLectivo,
  activarAnioLectivo,
  cerrarAnioLectivo,
  deleteAnioLectivo,
} from "@/modules/core";

export async function createAnioLectivoAction(formData: FormData) {
  const input = anioLectivoSchema.parse({
    anio: formData.get("anio"),
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  await createAnioLectivo(input);
  revalidatePath("/administracion/anios-lectivos");
}

export async function updateAnioLectivoAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = anioLectivoSchema.parse({
    anio: formData.get("anio"),
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  await updateAnioLectivo(id, input);
  revalidatePath("/administracion/anios-lectivos");
  revalidatePath(`/administracion/anios-lectivos/${id}`);
}

export async function activarAnioLectivoAction(formData: FormData) {
  const id = String(formData.get("id"));
  await activarAnioLectivo(id);
  revalidatePath("/administracion/anios-lectivos");
}

export async function cerrarAnioLectivoAction(formData: FormData) {
  const id = String(formData.get("id"));
  await cerrarAnioLectivo(id);
  revalidatePath("/administracion/anios-lectivos");
}

export async function deleteAnioLectivoAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteAnioLectivo(id);
  revalidatePath("/administracion/anios-lectivos");
}
