import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { InstitucionConfig } from "@/types/database.types";

const INSTITUCION_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export const institucionConfigSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  nit: z.string().optional(),
  codigo_dane: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().email("Correo inválido").optional().or(z.literal("")),
  rector_id: z.string().uuid().optional().or(z.literal("")),
  escudo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  logo_url: z.string().url("URL inválida").optional().or(z.literal("")),
  anio_lectivo_activo_id: z.string().uuid().optional().or(z.literal("")),
});

export async function getInstitucionConfig(): Promise<InstitucionConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("institucion_config")
    .select("*")
    .eq("id", INSTITUCION_CONFIG_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as InstitucionConfig | null;
}

export async function upsertInstitucionConfig(input: z.infer<typeof institucionConfigSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("institucion_config").upsert({
    id: INSTITUCION_CONFIG_ID,
    nombre: input.nombre,
    nit: input.nit || null,
    codigo_dane: input.codigo_dane || null,
    direccion: input.direccion || null,
    telefono: input.telefono || null,
    correo: input.correo || null,
    rector_id: input.rector_id || null,
    escudo_url: input.escudo_url || null,
    logo_url: input.logo_url || null,
    anio_lectivo_activo_id: input.anio_lectivo_activo_id || null,
  });
  if (error) throw new Error(error.message);
}
