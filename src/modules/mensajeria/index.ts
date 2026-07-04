import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Mensaje, Profile } from "@/types/database.types";

export const mensajeSchema = z.object({
  destinatario_id: z.string().uuid("Selecciona un destinatario"),
  asunto: z.string().min(1, "El asunto es obligatorio"),
  contenido: z.string().min(1, "El contenido es obligatorio"),
  parent_id: z.string().uuid().optional(),
});

export type MensajeConPerfiles = Mensaje & {
  remitente: Pick<Profile, "id" | "full_name" | "role">;
  destinatario: Pick<Profile, "id" | "full_name" | "role">;
};

export async function listMensajesRecibidos(profileId: string): Promise<MensajeConPerfiles[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .select("*, remitente:profiles!mensajes_remitente_id_fkey(id,full_name,role), destinatario:profiles!mensajes_destinatario_id_fkey(id,full_name,role)")
    .eq("destinatario_id", profileId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as MensajeConPerfiles[];
}

export async function listMensajesEnviados(profileId: string): Promise<MensajeConPerfiles[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .select("*, remitente:profiles!mensajes_remitente_id_fkey(id,full_name,role), destinatario:profiles!mensajes_destinatario_id_fkey(id,full_name,role)")
    .eq("remitente_id", profileId)
    .is("parent_id", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as MensajeConPerfiles[];
}

export async function getMensaje(id: string): Promise<MensajeConPerfiles | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .select("*, remitente:profiles!mensajes_remitente_id_fkey(id,full_name,role), destinatario:profiles!mensajes_destinatario_id_fkey(id,full_name,role)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as MensajeConPerfiles | null;
}

export async function getRespuestas(parentId: string): Promise<MensajeConPerfiles[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .select("*, remitente:profiles!mensajes_remitente_id_fkey(id,full_name,role), destinatario:profiles!mensajes_destinatario_id_fkey(id,full_name,role)")
    .eq("parent_id", parentId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return data as unknown as MensajeConPerfiles[];
}

export async function enviarMensaje(
  remitenteId: string,
  input: z.infer<typeof mensajeSchema>,
): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mensajes")
    .insert({ remitente_id: remitenteId, ...input })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function marcarLeido(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mensajes").update({ leido: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countNoLeidos(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_id", profileId)
    .eq("leido", false);
  if (error) return 0;
  return count ?? 0;
}
