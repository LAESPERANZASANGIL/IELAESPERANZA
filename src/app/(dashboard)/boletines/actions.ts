"use server";

import { revalidatePath } from "next/cache";
import { generarBoletin } from "@/modules/calificaciones";
import { requireProfile } from "@/lib/auth/session";

export async function generarBoletinAction(formData: FormData) {
  const matriculaId = formData.get("matricula_id") as string;
  const periodoAcademicoId = formData.get("periodo_academico_id") as string;
  const profile = await requireProfile();

  await generarBoletin(matriculaId, periodoAcademicoId, profile.id);
  revalidatePath("/boletines");
}
