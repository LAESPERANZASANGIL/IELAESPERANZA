"use server";
import { revalidatePath } from "next/cache";
import { cargoSchema, createCargo, updateCargo, deleteCargo } from "@/modules/nomina";

export async function createCargoAction(formData: FormData) {
  await createCargo(cargoSchema.parse({ nombre: formData.get("nombre"), descripcion: formData.get("descripcion") || undefined, salario_base: formData.get("salario_base") || 0 }));
  revalidatePath("/nomina/cargos");
}
export async function deleteCargoAction(formData: FormData) {
  await deleteCargo(formData.get("id") as string);
  revalidatePath("/nomina/cargos");
}
