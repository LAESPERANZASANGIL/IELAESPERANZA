"use server";

import { revalidatePath } from "next/cache";
import {
  gradoSchema,
  createGrado,
  updateGrado,
  actualizarEstadoGrado,
  deleteGrado,
  grupoSchema,
  createGrupo,
  updateGrupo,
  actualizarEstadoGrupo,
  deleteGrupo,
} from "@/modules/academico";

export async function createGradoAction(formData: FormData) {
  const input = gradoSchema.parse({
    nombre: formData.get("nombre"),
    nivel: formData.get("nivel"),
    orden: formData.get("orden") || 0,
  });
  await createGrado(input);
  revalidatePath("/grados");
}

export async function updateGradoAction(formData: FormData) {
  const id = String(formData.get("id"));
  const input = gradoSchema.parse({
    nombre: formData.get("nombre"),
    nivel: formData.get("nivel"),
    orden: formData.get("orden") || 0,
  });
  await updateGrado(id, input);
  revalidatePath("/grados");
  revalidatePath(`/grados/${id}`);
}

export async function actualizarEstadoGradoAction(formData: FormData) {
  const id = String(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await actualizarEstadoGrado(id, activo);
  revalidatePath("/grados");
}

export async function deleteGradoAction(formData: FormData) {
  const id = String(formData.get("id"));
  await deleteGrado(id);
  revalidatePath("/grados");
}

export async function createGrupoAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const input = grupoSchema.parse({
    grado_id: gradoId,
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    capacidad: formData.get("capacidad") || undefined,
    jornada: formData.get("jornada"),
    director_grupo_id: formData.get("director_grupo_id"),
  });
  await createGrupo(input);
  revalidatePath(`/grados/${gradoId}`);
}

export async function updateGrupoAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const id = String(formData.get("id"));
  const input = grupoSchema.parse({
    grado_id: gradoId,
    anio_lectivo_id: formData.get("anio_lectivo_id"),
    nombre: formData.get("nombre"),
    capacidad: formData.get("capacidad") || undefined,
    jornada: formData.get("jornada"),
    director_grupo_id: formData.get("director_grupo_id"),
  });
  await updateGrupo(id, input);
  revalidatePath(`/grados/${gradoId}`);
}

export async function actualizarEstadoGrupoAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const id = String(formData.get("id"));
  const activo = formData.get("activo") === "true";
  await actualizarEstadoGrupo(id, activo);
  revalidatePath(`/grados/${gradoId}`);
}

export async function deleteGrupoAction(formData: FormData) {
  const gradoId = String(formData.get("grado_id"));
  const id = String(formData.get("id"));
  await deleteGrupo(id);
  revalidatePath(`/grados/${gradoId}`);
}
