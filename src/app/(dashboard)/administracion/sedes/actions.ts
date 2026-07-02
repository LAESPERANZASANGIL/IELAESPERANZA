"use server";

import { revalidatePath } from "next/cache";
import { sedeSchema, createSede, updateSede, actualizarEstadoSede, deleteSede } from "@/modules/core";

export async function createSedeAction(formData: FormData) {
  const input = sedeSchema.parse({
    nombre: formData.get("nombre"),
    codigo_dane: formData.get("codigo_dane") || undefined,
    direccion: formData.get("direccion") || undefined,
    telefono: formData.get("telefono") || undefined,
  });
  await createSede(input);
  revalidatePath("/administracion/sedes");
}

export async function updateSedeAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = sedeSchema.parse({
    nombre: formData.get("nombre"),
    codigo_dane: formData.get("codigo_dane") || undefined,
    direccion: formData.get("direccion") || undefined,
    telefono: formData.get("telefono") || undefined,
  });
  await updateSede(id, input);
  revalidatePath("/administracion/sedes");
  revalidatePath(`/administracion/sedes/${id}`);
}

export async function actualizarEstadoSedeAction(formData: FormData) {
  const id = String(formData.get("id"));
  const activa = formData.get("activa") === "true";
  await actualizarEstadoSede(id, activa);
  revalidatePath("/administracion/sedes");
}

export async function deleteSedeAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteSede(id);
  revalidatePath("/administracion/sedes");
}
