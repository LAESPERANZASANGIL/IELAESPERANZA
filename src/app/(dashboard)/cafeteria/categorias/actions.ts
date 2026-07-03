"use server";
import { revalidatePath } from "next/cache";
import { categoriaSchema, createCategoria, updateCategoria, deleteCategoria } from "@/modules/cafeteria";

export async function createCategoriaAction(formData: FormData) {
  await createCategoria(categoriaSchema.parse({ nombre: formData.get("nombre"), descripcion: formData.get("descripcion") || undefined }));
  revalidatePath("/cafeteria/categorias");
}
export async function updateCategoriaAction(formData: FormData) {
  await updateCategoria(formData.get("id") as string, categoriaSchema.parse({ nombre: formData.get("nombre"), descripcion: formData.get("descripcion") || undefined }));
  revalidatePath("/cafeteria/categorias");
}
export async function deleteCategoriaAction(formData: FormData) {
  await deleteCategoria(formData.get("id") as string);
  revalidatePath("/cafeteria/categorias");
}
