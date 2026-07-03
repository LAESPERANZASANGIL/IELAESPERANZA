"use server";

import { revalidatePath } from "next/cache";
import { institucionConfigSchema, upsertInstitucionConfig, resetInstitucionConfig } from "@/modules/institucion";

export async function updateInstitucionConfigAction(formData: FormData) {
  const input = institucionConfigSchema.parse({
    nombre: formData.get("nombre"),
    nit: formData.get("nit") || undefined,
    codigo_dane: formData.get("codigo_dane") || undefined,
    direccion: formData.get("direccion") || undefined,
    telefono: formData.get("telefono") || undefined,
    correo: formData.get("correo") || undefined,
    rector_id: formData.get("rector_id") || undefined,
    escudo_url: formData.get("escudo_url") || undefined,
    logo_url: formData.get("logo_url") || undefined,
    anio_lectivo_activo_id: formData.get("anio_lectivo_activo_id") || undefined,
    mensaje_bienvenida: formData.get("mensaje_bienvenida") || undefined,
    slogan: formData.get("slogan") || undefined,
  });
  await upsertInstitucionConfig(input);
  revalidatePath("/administracion/configuracion");
}

export async function resetInstitucionConfigAction() {
  await resetInstitucionConfig();
  revalidatePath("/administracion/configuracion");
}
