"use server";

import { revalidatePath } from "next/cache";
import { guardarNotas, actividadEvaluacionSchema, crearActividad, eliminarActividad } from "@/modules/calificaciones";
import { requireProfile } from "@/lib/auth/session";

export async function crearActividadAction(formData: FormData) {
  const profile = await requireProfile();
  if (!["rector", "administrador", "secretaria"].includes(profile.role)) {
    throw new Error("Solo el Rector, el Administrador o la Secretaría pueden configurar actividades de evaluación.");
  }
  const input = actividadEvaluacionSchema.parse({
    malla_curricular_id: formData.get("malla_curricular_id"),
    periodo_academico_id: formData.get("periodo_academico_id"),
    nombre: formData.get("nombre"),
    peso_porcentual: formData.get("peso_porcentual"),
    tipo: formData.get("tipo") || "normal",
    orden: formData.get("orden") || 0,
  });
  await crearActividad(input);
  revalidatePath("/notas");
}

export async function eliminarActividadAction(formData: FormData) {
  const profile = await requireProfile();
  if (!["rector", "administrador", "secretaria"].includes(profile.role)) {
    throw new Error("Solo el Rector, el Administrador o la Secretaría pueden configurar actividades de evaluación.");
  }
  await eliminarActividad(formData.get("id") as string);
  revalidatePath("/notas");
}

export async function guardarNotasAction(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "docente") {
    throw new Error("Solo el docente asignado puede registrar o modificar notas.");
  }

  const mallaCurricularId = formData.get("malla_curricular_id") as string;
  const periodoAcademicoId = formData.get("periodo_academico_id") as string;
  const motivo = (formData.get("motivo") as string) || undefined;

  const entradas: { matricula_id: string; actividad_id: string; valor: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("nota__")) continue;
    const valorTexto = (value as string).trim();
    if (valorTexto === "") continue;
    const [, matriculaId, actividadId] = key.split("__");
    entradas.push({ matricula_id: matriculaId, actividad_id: actividadId, valor: Number(valorTexto) });
  }

  await guardarNotas(
    {
      malla_curricular_id: mallaCurricularId,
      periodo_academico_id: periodoAcademicoId,
      motivo,
      entradas,
    },
    profile.id,
  );

  revalidatePath("/notas");
}
