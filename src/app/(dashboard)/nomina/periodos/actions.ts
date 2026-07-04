"use server";
import { revalidatePath } from "next/cache";
import { periodoSchema, createPeriodoNomina, cerrarPeriodoNomina, liquidarEmpleado } from "@/modules/nomina";

export async function createPeriodoAction(formData: FormData) {
  await createPeriodoNomina(periodoSchema.parse({ nombre: formData.get("nombre"), fecha_inicio: formData.get("fecha_inicio"), fecha_fin: formData.get("fecha_fin") }));
  revalidatePath("/nomina/periodos");
}
export async function cerrarPeriodoAction(formData: FormData) {
  await cerrarPeriodoNomina(formData.get("id") as string);
  revalidatePath("/nomina/periodos");
}
export async function liquidarEmpleadoAction(formData: FormData) {
  const periodoId = formData.get("periodo_id") as string;
  await liquidarEmpleado(periodoId, { empleado_id: formData.get("empleado_id") as string, bonificaciones: Number(formData.get("bonificaciones") || 0), deducciones: Number(formData.get("deducciones") || 0), observacion: formData.get("observacion") as string || undefined });
  revalidatePath(`/nomina/periodos`);
}
