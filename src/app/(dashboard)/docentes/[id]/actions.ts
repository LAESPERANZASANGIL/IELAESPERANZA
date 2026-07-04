"use server";

import { revalidatePath } from "next/cache";
import { docenteUpdateSchema, updateDocente, deleteDocente } from "@/modules/academico";
import { actualizarEstadoUsuario } from "@/modules/core";

export async function updateDocenteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = docenteUpdateSchema.parse({
    documento_tipo: formData.get("documento_tipo") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    full_name: formData.get("full_name"),
    fecha_nacimiento: formData.get("fecha_nacimiento") || undefined,
    sexo: formData.get("sexo") || undefined,
    direccion: formData.get("direccion") || undefined,
    municipio: formData.get("municipio") || undefined,
    departamento: formData.get("departamento") || undefined,
    phone: formData.get("phone") || undefined,
    telefono: formData.get("telefono") || undefined,
    correo_personal: formData.get("correo_personal") || undefined,
    profesion: formData.get("profesion") || undefined,
    especialidad: formData.get("especialidad"),
    escalafon: formData.get("escalafon") || undefined,
    tipo_contrato: formData.get("tipo_contrato") || undefined,
    fecha_ingreso: formData.get("fecha_ingreso") || undefined,
  });
  await updateDocente(id, input);
  revalidatePath(`/docentes/${id}`);
  revalidatePath("/docentes");
}

export async function actualizarEstadoDocenteAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";
  await actualizarEstadoUsuario(id, isActive);
  revalidatePath(`/docentes/${id}`);
  revalidatePath("/docentes");
}

export async function deleteDocenteAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteDocente(id);
  revalidatePath("/docentes");
}
