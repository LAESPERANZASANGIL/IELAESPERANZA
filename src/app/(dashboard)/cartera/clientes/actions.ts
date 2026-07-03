"use server";
import { revalidatePath } from "next/cache";
import { clienteSchema, createClienteCartera, updateClienteCartera } from "@/modules/cartera";

export async function createClienteAction(formData: FormData) {
  await createClienteCartera(clienteSchema.parse({ nombres: formData.get("nombres"), apellidos: formData.get("apellidos"), documento: formData.get("documento") || undefined, telefono: formData.get("telefono") || undefined, email: formData.get("email") || undefined, direccion: formData.get("direccion") || undefined, tipo: formData.get("tipo") || "padre_familia" }));
  revalidatePath("/cartera/clientes");
}
