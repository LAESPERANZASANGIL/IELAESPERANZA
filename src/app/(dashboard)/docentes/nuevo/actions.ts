"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { docenteCreateSchema, createDocente } from "@/modules/academico";

export async function crearDocenteAction(formData: FormData) {
  const input = docenteCreateSchema.parse({
    documento_tipo: formData.get("documento_tipo") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
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

  await createDocente(input);
  revalidatePath("/docentes");
  redirect("/docentes");
}
