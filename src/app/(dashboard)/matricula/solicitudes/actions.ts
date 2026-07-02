"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  solicitudAdmisionSchema,
  createSolicitudAdmision,
  rechazarSolicitud,
  admitirSolicitud,
} from "@/modules/matricula";
import { createClient } from "@/lib/supabase/server";
import type { SolicitudAdmision } from "@/types/database.types";

export async function createSolicitudAction(formData: FormData) {
  const input = solicitudAdmisionSchema.parse({
    proceso_matricula_id: formData.get("proceso_matricula_id"),
    aspirante_nombres: formData.get("aspirante_nombres"),
    aspirante_apellidos: formData.get("aspirante_apellidos"),
    aspirante_documento: formData.get("aspirante_documento") || undefined,
    fecha_nacimiento: formData.get("fecha_nacimiento") || undefined,
    grado_solicitado_id: formData.get("grado_solicitado_id") || undefined,
    acudiente_id: formData.get("acudiente_id") || undefined,
  });
  await createSolicitudAdmision(input);
  revalidatePath("/matricula/solicitudes");
}

export async function rechazarSolicitudAction(formData: FormData) {
  const id = String(formData.get("id"));
  await rechazarSolicitud(id);
  revalidatePath("/matricula/solicitudes");
}

const admitirSchema = z.object({
  solicitud_id: z.string().uuid(),
  grupo_id: z.string().uuid("Selecciona un grupo"),
});

export async function admitirSolicitudAction(formData: FormData) {
  const { solicitud_id, grupo_id } = admitirSchema.parse({
    solicitud_id: formData.get("solicitud_id"),
    grupo_id: formData.get("grupo_id"),
  });

  const supabase = await createClient();
  const { data: solicitud, error } = await supabase
    .from("solicitudes_admision")
    .select("*")
    .eq("id", solicitud_id)
    .single();
  if (error) throw new Error(error.message);

  await admitirSolicitud({ solicitud: solicitud as SolicitudAdmision, grupo_id });
  revalidatePath("/matricula/solicitudes");
}
