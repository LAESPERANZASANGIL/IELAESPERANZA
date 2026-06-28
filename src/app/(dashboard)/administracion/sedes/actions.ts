"use server";

import { revalidatePath } from "next/cache";
import { sedeSchema, createSede } from "@/modules/core";

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
