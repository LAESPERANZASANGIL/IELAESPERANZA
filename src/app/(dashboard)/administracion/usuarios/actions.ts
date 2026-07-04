"use server";

import { revalidatePath } from "next/cache";
import { usuarioSchema, usuarioUpdateSchema, createUsuario, updateUsuario, actualizarEstadoUsuario } from "@/modules/core";

export async function createUsuarioAction(formData: FormData) {
  const input = usuarioSchema.parse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    documento_numero: formData.get("documento_numero") || undefined,
    phone: formData.get("phone") || undefined,
    is_active: formData.get("is_active") === "on",
  });
  await createUsuario(input);
  revalidatePath("/administracion/usuarios");
}

export async function updateUsuarioAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = usuarioUpdateSchema.parse({
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    documento_numero: formData.get("documento_numero") || undefined,
    phone: formData.get("phone") || undefined,
  });
  await updateUsuario(id, input);
  revalidatePath("/administracion/usuarios");
  revalidatePath(`/administracion/usuarios/${id}`);
}

export async function actualizarEstadoUsuarioAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoUsuario(id, isActive);
  revalidatePath("/administracion/usuarios");
}
