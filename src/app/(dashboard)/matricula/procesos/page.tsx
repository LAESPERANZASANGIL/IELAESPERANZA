import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import { listProcesosMatricula } from "@/modules/matricula";
import { listAniosLectivos } from "@/modules/core";
import { createProcesoMatriculaAction, deleteProcesoMatriculaAction } from "./actions";

export default async function ProcesosMatriculaPage() {
  const [procesos, anios] = await Promise.all([listProcesosMatricula(), listAniosLectivos()]);

  return (
    <>
      <Header title="Procesos de matrícula" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {procesos.length === 0 ? (
            <EmptyState title="Aún no hay procesos de matrícula" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Año lectivo</Th>
                <Th>Apertura</Th>
                <Th>Cierre</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Thead>
              <Tbody>
                {procesos.map((proceso) => (
                  <tr key={proceso.id}>
                    <Td>{proceso.nombre}</Td>
                    <Td>{proceso.anio_lectivo.anio}</Td>
                    <Td>{proceso.fecha_apertura}</Td>
                    <Td>{proceso.fecha_cierre}</Td>
                    <Td>{proceso.estado}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/matricula/procesos/${proceso.id}`}
                          className="text-sm font-medium text-brand-700 hover:underline"
                        >
                          Editar
                        </Link>
                        <ActionForm action={deleteProcesoMatriculaAction} confirmMessage="¿Eliminar este proceso?">
                          <input type="hidden" name="id" value={proceso.id} />
                          <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo proceso</h2>
          <form action={createProcesoMatriculaAction} className="space-y-4">
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" required defaultValue="">
                <option value="" disabled>Selecciona un año lectivo</option>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>{anio.anio}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Fecha de apertura" htmlFor="fecha_apertura">
              <TextInput id="fecha_apertura" name="fecha_apertura" type="date" required />
            </Field>
            <Field label="Fecha de cierre" htmlFor="fecha_cierre">
              <TextInput id="fecha_cierre" name="fecha_cierre" type="date" required />
            </Field>
            <SubmitButton>Crear proceso</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
