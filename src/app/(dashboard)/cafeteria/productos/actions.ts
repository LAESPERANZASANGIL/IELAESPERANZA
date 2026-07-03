"use server";
import { revalidatePath } from "next/cache";
import { productoSchema, createProducto, updateProducto, deleteProducto } from "@/modules/cafeteria";

export async function createProductoAction(formData: FormData) {
  const input = productoSchema.parse({
    nombre: formData.get("nombre"),
    categoria_id: formData.get("categoria_id") || null,
    precio: formData.get("precio"),
    stock: formData.get("stock") || 0,
    descripcion: formData.get("descripcion") || undefined,
  });
  await createProducto(input);
  revalidatePath("/cafeteria/productos");
}

export async function updateProductoAction(formData: FormData) {
  const id = formData.get("id") as string;
  const input = productoSchema.parse({
    nombre: formData.get("nombre"),
    categoria_id: formData.get("categoria_id") || null,
    precio: formData.get("precio"),
    stock: formData.get("stock") || 0,
    descripcion: formData.get("descripcion") || undefined,
  });
  await updateProducto(id, input);
  revalidatePath("/cafeteria/productos");
}

export async function deleteProductoAction(formData: FormData) {
  await deleteProducto(formData.get("id") as string);
  revalidatePath("/cafeteria/productos");
}
