"use server";

import { revalidatePath } from "next/cache";
import { usuarioSchema, createUsuario, actualizarEstadoUsuario } from "@/modules/core";

export async function createUsuarioAction(formData: FormData) {
  const input = usuarioSchema.parse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    documento_numero: formData.get("documento_numero") || undefined,
    phone: formData.get("phone") || undefined,
  });
  await createUsuario(input);
  revalidatePath("/administracion/usuarios");
}

export async function actualizarEstadoUsuarioAction(formData: FormData) {
  const id = String(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await actualizarEstadoUsuario(id, activo);
  revalidatePath("/administracion/usuarios");
}
