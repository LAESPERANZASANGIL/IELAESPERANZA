import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAsignaturas } from "@/modules/academico";
import { createAsignaturaAction } from "./actions";

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
              </Thead>
              <Tbody>
                {asignaturas.map((asignatura) => (
                  <tr key={asignatura.id}>
                    <Td>{asignatura.nombre}</Td>
                    <Td>{asignatura.area ?? "—"}</Td>
                    <Td>{asignatura.descripcion ?? "—"}</Td>
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
