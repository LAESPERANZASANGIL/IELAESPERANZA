"use server";

import { revalidatePath } from "next/cache";
import { registrarAsistenciaMasiva } from "@/modules/asistencia";
import { requireProfile } from "@/lib/auth/session";

export async function registrarAsistenciaAction(formData: FormData) {
  const profile = await requireProfile();
  const grupoId = formData.get("grupo_id") as string;
  const anioLectivoId = formData.get("anio_lectivo_id") as string;
  const fecha = formData.get("fecha") as string;

  // Collect registros: form fields named "estado__<matricula_id>"
  const registros: { matricula_id: string; estado: string; observacion?: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("estado__")) {
      const matriculaId = key.replace("estado__", "");
      const obs = formData.get(`obs__${matriculaId}`) as string | null;
      registros.push({
        matricula_id: matriculaId,
        estado: value as string,
        observacion: obs || undefined,
      });
    }
  }

  await registrarAsistenciaMasiva({ grupo_id: grupoId, fecha, registros, registrado_por: profile.id });
  revalidatePath(`/asistencia?grupo_id=${grupoId}&anio_lectivo_id=${anioLectivoId}&fecha=${fecha}`);
}
