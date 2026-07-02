import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listDocentes, getGrado } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import {
  createGrupoAction,
  updateGradoAction,
  actualizarEstadoGrupoAction,
  deleteGrupoAction,
} from "../actions";

const NIVELES = ["preescolar", "primaria", "secundaria", "media"] as const;

export default async function GrupoDeGradoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const grado = await getGrado(id);
  if (!grado) notFound();

  const [grupos, anios, docentes] = await Promise.all([
    listGrupos({ grado_id: id }),
    listAniosLectivos(),
    listDocentes(),
  ]);

  return (
    <>
      <Header title={`Grado: ${grado.nombre}`} />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Datos del grado</h2>
            <ActionForm action={updateGradoAction} className="grid gap-4 sm:grid-cols-3">
              <input type="hidden" name="id" value={id} />
              <Field label="Nombre" htmlFor="nombre">
                <TextInput id="nombre" name="nombre" defaultValue={grado.nombre} required />
              </Field>
              <Field label="Nivel" htmlFor="nivel">
                <Select id="nivel" name="nivel" defaultValue={grado.nivel} required>
                  {NIVELES.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Orden" htmlFor="orden">
                <TextInput id="orden" name="orden" type="number" defaultValue={grado.orden} />
              </Field>
              <div className="sm:col-span-3">
                <SubmitButton>Guardar cambios</SubmitButton>
              </div>
            </ActionForm>
          </div>

          <h2 className="text-sm font-semibold text-slate-900">Cursos</h2>
          {grupos.length === 0 ? (
            <EmptyState title="Aún no hay cursos para este grado" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Jornada</Th>
                <Th>Capacidad</Th>
                <Th>Estado</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.id}>
                    <Td>{grupo.nombre}</Td>
                    <Td>{grupo.jornada ?? "—"}</Td>
                    <Td>{grupo.capacidad ?? "—"}</Td>
                    <Td>{grupo.activo ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link
                          className="text-sm font-medium text-brand-700 hover:underline"
                          href={`/grados/${id}/grupos/${grupo.id}`}
                        >
                          Malla curricular
                        </Link>
                        <Link
                          className="text-sm font-medium text-brand-700 hover:underline"
                          href={`/grados/${id}/grupos/${grupo.id}/editar`}
                        >
                          Editar
                        </Link>
                        <ActionForm action={actualizarEstadoGrupoAction} className="inline">
                          <input type="hidden" name="grado_id" value={id} />
                          <input type="hidden" name="id" value={grupo.id} />
                          <input type="hidden" name="activo" value={(!grupo.activo).toString()} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            {grupo.activo ? "Desactivar" : "Activar"}
                          </button>
                        </ActionForm>
                        <ActionForm action={deleteGrupoAction} confirmMessage="¿Eliminar este curso?" className="inline">
                          <input type="hidden" name="grado_id" value={id} />
                          <input type="hidden" name="id" value={grupo.id} />
                          <button className="text-sm font-medium text-red-600 hover:underline" type="submit">
                            Eliminar
                          </button>
                        </ActionForm>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo curso</h2>
          <ActionForm action={createGrupoAction} className="space-y-4">
            <input type="hidden" name="grado_id" value={id} />
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona un año lectivo
                </option>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>
                    {anio.anio}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre del curso" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Capacidad" htmlFor="capacidad">
              <TextInput id="capacidad" name="capacidad" type="number" />
            </Field>
            <Field label="Jornada" htmlFor="jornada">
              <Select id="jornada" name="jornada" required defaultValue="">
                <option value="" disabled>
                  Selecciona una jornada
                </option>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </Select>
            </Field>
            <Field label="Director de grupo" htmlFor="director_grupo_id">
              <Select id="director_grupo_id" name="director_grupo_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona un director
                </option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton>Crear curso</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
