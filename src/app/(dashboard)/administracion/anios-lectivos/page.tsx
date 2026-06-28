import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAniosLectivos } from "@/modules/core";
import { createAnioLectivoAction, activarAnioLectivoAction } from "./actions";

export default async function AniosLectivosPage() {
  const anios = await listAniosLectivos();

  return (
    <>
      <Header title="Años lectivos" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {anios.length === 0 ? (
            <EmptyState title="Aún no hay años lectivos registrados" />
          ) : (
            <Table>
              <Thead>
                <Th>Año</Th>
                <Th>Inicio</Th>
                <Th>Fin</Th>
                <Th>Estado</Th>
                <Th>Acción</Th>
              </Thead>
              <Tbody>
                {anios.map((anio) => (
                  <tr key={anio.id}>
                    <Td>{anio.anio}</Td>
                    <Td>{anio.fecha_inicio}</Td>
                    <Td>{anio.fecha_fin}</Td>
                    <Td>{anio.estado}</Td>
                    <Td>
                      {anio.estado !== "activo" && (
                        <form action={activarAnioLectivoAction}>
                          <input type="hidden" name="id" value={anio.id} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            Activar
                          </button>
                        </form>
                      )}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo año lectivo</h2>
          <form action={createAnioLectivoAction} className="space-y-4">
            <Field label="Año" htmlFor="anio">
              <TextInput id="anio" name="anio" type="number" required />
            </Field>
            <Field label="Fecha de inicio" htmlFor="fecha_inicio">
              <TextInput id="fecha_inicio" name="fecha_inicio" type="date" required />
            </Field>
            <Field label="Fecha de fin" htmlFor="fecha_fin">
              <TextInput id="fecha_fin" name="fecha_fin" type="date" required />
            </Field>
            <SubmitButton>Crear año lectivo</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
