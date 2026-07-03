"use server";
import { revalidatePath } from "next/cache";
import { novedadSchema, createNovedad, deleteNovedad } from "@/modules/nomina";
import { requireProfile } from "@/lib/auth/session";

export async function createNovedadAction(formData: FormData) {
  const profile = await requireProfile();
  const input = novedadSchema.parse({ empleado_id: formData.get("empleado_id"), tipo: formData.get("tipo"), fecha_inicio: formData.get("fecha_inicio"), fecha_fin: formData.get("fecha_fin") || undefined, dias: formData.get("dias") || undefined, descripcion: formData.get("descripcion") || undefined });
  await createNovedad(input, profile.id);
  revalidatePath("/nomina/novedades");
}
export async function deleteNovedadAction(formData: FormData) {
  await deleteNovedad(formData.get("id") as string);
  revalidatePath("/nomina/novedades");
}
