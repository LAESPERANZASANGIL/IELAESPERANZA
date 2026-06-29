import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrados } from "@/modules/academico";
import { createGradoAction, actualizarEstadoGradoAction, deleteGradoAction } from "./actions";

const NIVELES = ["preescolar", "primaria", "secundaria", "media"] as const;

export default async function GradosPage() {
  const grados = await listGrados();

  return (
    <>
      <Header title="Grados y cursos" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {grados.length === 0 ? (
            <EmptyState title="Aún no hay grados registrados" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Nivel</Th>
                <Th>Orden</Th>
                <Th>Estado</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {grados.map((grado) => (
                  <tr key={grado.id}>
                    <Td>{grado.nombre}</Td>
                    <Td>{grado.nivel}</Td>
                    <Td>{grado.orden}</Td>
                    <Td>{grado.is_active ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link className="text-sm font-medium text-brand-700 hover:underline" href={`/grados/${grado.id}`}>
                          Editar / Ver cursos
                        </Link>
                        <ActionForm action={actualizarEstadoGradoAction} className="inline">
                          <input type="hidden" name="id" value={grado.id} />
                          <input type="hidden" name="is_active" value={(!grado.is_active).toString()} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            {grado.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </ActionForm>
                        <ActionForm action={deleteGradoAction} confirmMessage="¿Eliminar este grado?" className="inline">
                          <input type="hidden" name="id" value={grado.id} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo grado</h2>
          <ActionForm action={createGradoAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Nivel" htmlFor="nivel">
              <Select id="nivel" name="nivel" required defaultValue="">
                <option value="" disabled>
                  Selecciona un nivel
                </option>
                {NIVELES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Orden" htmlFor="orden">
              <TextInput id="orden" name="orden" type="number" defaultValue={0} />
            </Field>
            <SubmitButton>Crear grado</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
