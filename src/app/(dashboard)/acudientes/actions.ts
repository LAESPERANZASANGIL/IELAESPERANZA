"use server";

import { revalidatePath } from "next/cache";
import { acudienteSchema, createAcudiente } from "@/modules/estudiantes";

export async function createAcudienteAction(formData: FormData) {
  const input = acudienteSchema.parse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    documento_numero: formData.get("documento_numero") || undefined,
    ocupacion: formData.get("ocupacion") || undefined,
  });
  await createAcudiente(input);
  revalidatePath("/acudientes");
}
