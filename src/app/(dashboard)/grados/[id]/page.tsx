import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { createGrupoAction } from "../actions";

export default async function GrupoDeGradoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [grupos, anios] = await Promise.all([listGrupos({ grado_id: id }), listAniosLectivos()]);

  return (
    <>
      <Header title="Grupos" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {grupos.length === 0 ? (
            <EmptyState title="Aún no hay grupos para este grado" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Capacidad</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.id}>
                    <Td>{grupo.nombre}</Td>
                    <Td>{grupo.capacidad ?? "—"}</Td>
                    <Td>
                      <Link className="text-sm font-medium text-emerald-700 hover:underline" href={`/grados/${id}/grupos/${grupo.id}`}>
                        Malla curricular
                      </Link>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo grupo</h2>
          <form action={createGrupoAction} className="space-y-4">
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
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Capacidad" htmlFor="capacidad">
              <TextInput id="capacidad" name="capacidad" type="number" />
            </Field>
            <SubmitButton>Crear grupo</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
