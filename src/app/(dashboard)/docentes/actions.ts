"use server";

import { revalidatePath } from "next/cache";
import { actualizarEstadoUsuario } from "@/modules/core";

export async function actualizarEstadoDocenteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoUsuario(id, isActive);
  revalidatePath("/docentes");
}
