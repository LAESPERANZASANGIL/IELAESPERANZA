"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mensajeSchema, enviarMensaje, marcarLeido } from "@/modules/mensajeria";
import { requireProfile } from "@/lib/auth/session";

export async function enviarMensajeAction(formData: FormData) {
  const profile = await requireProfile();
  const input = mensajeSchema.parse({
    destinatario_id: formData.get("destinatario_id"),
    asunto: formData.get("asunto"),
    contenido: formData.get("contenido"),
    parent_id: formData.get("parent_id") || undefined,
  });
  const id = await enviarMensaje(profile.id, input);
  revalidatePath("/mensajeria");
  const parentId = formData.get("parent_id") as string | null;
  redirect(`/mensajeria/${parentId ?? id}`);
}

export async function marcarLeidoAction(formData: FormData) {
  const id = formData.get("id") as string;
  await marcarLeido(id);
  revalidatePath("/mensajeria");
}
