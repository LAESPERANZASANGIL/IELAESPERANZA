"use server";

import { revalidatePath } from "next/cache";
import { guardarNotas, tipoEvaluacionSchema, createTipoEvaluacion } from "@/modules/calificaciones";

export async function createTipoEvaluacionAction(formData: FormData) {
  const input = tipoEvaluacionSchema.parse({
    nombre: formData.get("nombre"),
    peso_porcentual: formData.get("peso_porcentual") || undefined,
  });
  await createTipoEvaluacion(input);
  revalidatePath("/notas");
}

export async function guardarNotasAction(formData: FormData) {
  const mallaCurricularId = formData.get("malla_curricular_id") as string;
  const periodoAcademicoId = formData.get("periodo_academico_id") as string;

  const entradas: { matricula_id: string; tipo_evaluacion_id: string; valor: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("nota__")) continue;
    const valorTexto = (value as string).trim();
    if (valorTexto === "") continue;
    const [, matriculaId, tipoEvaluacionId] = key.split("__");
    entradas.push({ matricula_id: matriculaId, tipo_evaluacion_id: tipoEvaluacionId, valor: Number(valorTexto) });
  }

  await guardarNotas({
    malla_curricular_id: mallaCurricularId,
    periodo_academico_id: periodoAcademicoId,
    entradas,
  });

  revalidatePath("/notas");
}
