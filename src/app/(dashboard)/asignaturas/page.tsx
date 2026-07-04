import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAsignaturas } from "@/modules/academico";
import { createAsignaturaAction, actualizarEstadoAsignaturaAction } from "./actions";

export default async function AsignaturasPage() {
  const asignaturas = await listAsignaturas();

  return (
    <>
      <Header title="Asignaturas" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {asignaturas.length === 0 ? (
            <EmptyState title="Aún no hay asignaturas registradas" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Área</Th>
                <Th>Descripción</Th>
                <Th>Estado</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {asignaturas.map((asignatura) => (
                  <tr key={asignatura.id}>
                    <Td>{asignatura.nombre}</Td>
                    <Td>{asignatura.area ?? "—"}</Td>
                    <Td>{asignatura.descripcion ?? "—"}</Td>
                    <Td>{asignatura.is_active ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <ActionForm action={actualizarEstadoAsignaturaAction} className="inline">
                        <input type="hidden" name="id" value={asignatura.id} />
                        <input type="hidden" name="is_active" value={(!asignatura.is_active).toString()} />
                        <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                          {asignatura.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </ActionForm>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva asignatura</h2>
          <form action={createAsignaturaAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Área" htmlFor="area">
              <TextInput id="area" name="area" />
            </Field>
            <Field label="Descripción" htmlFor="descripcion">
              <TextArea id="descripcion" name="descripcion" rows={3} />
            </Field>
            <SubmitButton>Crear asignatura</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
