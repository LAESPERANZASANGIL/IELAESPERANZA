"use server";

import { revalidatePath } from "next/cache";
import { actualizarEstadoMallaCurricular, deleteMallaCurricular } from "@/modules/academico";

export async function actualizarEstadoMallaAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoMallaCurricular(id, isActive);
  revalidatePath("/carga-academica");
}

export async function deleteMallaAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteMallaCurricular(id);
  revalidatePath("/carga-academica");
}
