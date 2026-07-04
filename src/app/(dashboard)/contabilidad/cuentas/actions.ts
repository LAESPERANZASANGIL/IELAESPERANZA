"use server";
import { revalidatePath } from "next/cache";
import { cuentaSchema, createCuenta, updateCuenta } from "@/modules/contabilidad";

export async function createCuentaAction(formData: FormData) {
  const input = cuentaSchema.parse({ codigo: formData.get("codigo"), nombre: formData.get("nombre"), tipo: formData.get("tipo"), descripcion: formData.get("descripcion") || undefined });
  await createCuenta(input);
  revalidatePath("/contabilidad/cuentas");
}
export async function updateCuentaAction(formData: FormData) {
  const id = formData.get("id") as string;
  const input = cuentaSchema.parse({ codigo: formData.get("codigo"), nombre: formData.get("nombre"), tipo: formData.get("tipo"), descripcion: formData.get("descripcion") || undefined });
  await updateCuenta(id, input);
  revalidatePath("/contabilidad/cuentas");
}
