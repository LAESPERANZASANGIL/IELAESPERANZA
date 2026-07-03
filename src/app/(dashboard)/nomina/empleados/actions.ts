"use server";
import { revalidatePath } from "next/cache";
import { empleadoSchema, createEmpleado, updateEmpleado, actualizarEstadoEmpleado } from "@/modules/nomina";

export async function createEmpleadoAction(formData: FormData) {
  const input = empleadoSchema.parse({ nombres: formData.get("nombres"), apellidos: formData.get("apellidos"), documento: formData.get("documento") || undefined, cargo_id: formData.get("cargo_id") || null, fecha_ingreso: formData.get("fecha_ingreso") || undefined, tipo_contrato: formData.get("tipo_contrato") || "indefinido", salario: formData.get("salario") });
  await createEmpleado(input);
  revalidatePath("/nomina/empleados");
}
export async function actualizarEstadoEmpleadoAction(formData: FormData) {
  await actualizarEstadoEmpleado(formData.get("id") as string, formData.get("is_active") === "true");
  revalidatePath("/nomina/empleados");
}
