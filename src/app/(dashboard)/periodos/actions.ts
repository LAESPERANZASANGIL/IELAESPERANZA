"use server";

import { revalidatePath } from "next/cache";
import { periodoSchema, createPeriodo, cambiarEstadoPeriodo } from "@/modules/academico";
import { requireProfile } from "@/lib/auth/session";

export async function createPeriodoAction(formData: FormData) {
  const input = periodoSchema.parse({
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    orden: formData.get("orden") || 0,
    fecha_inicio: formData.get("fecha_inicio"),
    fecha_fin: formData.get("fecha_fin"),
  });
  await createPeriodo(input);
  revalidatePath("/periodos");
}

export async function cerrarPeriodoAction(formData: FormData) {
  const profile = await requireProfile();
  if (!["rector", "administrador", "secretaria"].includes(profile.role)) {
    throw new Error("No tienes permisos para cerrar periodos.");
  }
  const id = formData.get("id") as string;
  await cambiarEstadoPeriodo(id, "cerrado", profile.id);
  revalidatePath("/periodos");
}

export async function reabrirPeriodoAction(formData: FormData) {
  const profile = await requireProfile();
  if (!["rector", "administrador"].includes(profile.role)) {
    throw new Error("Solo el Rector o el Administrador pueden reabrir un periodo cerrado.");
  }
  const id = formData.get("id") as string;
  await cambiarEstadoPeriodo(id, "activo", profile.id);
  revalidatePath("/periodos");
}
