import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPeriodos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { createPeriodoAction } from "./actions";

export default async function PeriodosPage() {
  const [periodos, anios] = await Promise.all([listPeriodos(), listAniosLectivos()]);
  const anioPorId = new Map(anios.map((anio) => [anio.id, anio]));

  return (
    <>
      <Header title="Periodos académicos" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {periodos.length === 0 ? (
            <EmptyState title="Aún no hay periodos académicos definidos" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Año lectivo</Th>
                <Th>Inicio</Th>
                <Th>Fin</Th>
                <Th>Estado</Th>
              </Thead>
              <Tbody>
                {periodos.map((periodo) => (
                  <tr key={periodo.id}>
                    <Td>{periodo.nombre}</Td>
                    <Td>{anioPorId.get(periodo.anio_lectivo_id)?.anio ?? "—"}</Td>
                    <Td>{periodo.fecha_inicio}</Td>
                    <Td>{periodo.fecha_fin}</Td>
                    <Td>{periodo.estado}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo periodo</h2>
          <form action={createPeriodoAction} className="space-y-4">
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
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Orden" htmlFor="orden">
              <TextInput id="orden" name="orden" type="number" defaultValue={0} />
            </Field>
            <Field label="Fecha de inicio" htmlFor="fecha_inicio">
              <TextInput id="fecha_inicio" name="fecha_inicio" type="date" required />
            </Field>
            <Field label="Fecha de fin" htmlFor="fecha_fin">
              <TextInput id="fecha_fin" name="fecha_fin" type="date" required />
            </Field>
            <SubmitButton>Crear periodo</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
