"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { z } from "zod";

const solicitudSchema = z.object({
  estudiante_id: z.string().uuid(),
  anio_lectivo_id: z.string().uuid().optional(),
  tipo: z.enum(["estudio", "conducta", "notas", "paz_y_salvo"]),
});

export async function solicitarCertificadoAction(formData: FormData) {
  const profile = await requireProfile();
  const input = solicitudSchema.parse({
    estudiante_id: formData.get("estudiante_id"),
    anio_lectivo_id: formData.get("anio_lectivo_id") || undefined,
    tipo: formData.get("tipo"),
  });

  const supabase = await createClient();
  const { error } = await supabase.from("certificados").insert({
    ...input,
    solicitado_por: profile.id,
    estado: "solicitado",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/certificados");
}

export async function actualizarEstadoCertificadoAction(formData: FormData) {
  await requireProfile();
  const id = formData.get("id") as string;
  const estado = formData.get("estado") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("certificados").update({ estado }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/certificados");
}
