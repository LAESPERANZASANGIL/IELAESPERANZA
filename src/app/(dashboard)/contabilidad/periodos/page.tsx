import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPeriodosContables } from "@/modules/contabilidad";
import { createPeriodoContableAction, cerrarPeriodoContableAction } from "./actions";

const ESTADO_COLOR: Record<string, string> = {
  abierto: "bg-emerald-100 text-emerald-800",
  cerrado: "bg-slate-100 text-slate-500",
};

export default async function PeriodosContablesPage() {
  const periodos = await listPeriodosContables();

  return (
    <>
      <Header title="Períodos contables" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {periodos.length === 0 ? <EmptyState title="No hay períodos contables" /> : (
            <Table>
              <Thead><Th>Nombre</Th><Th>Inicio</Th><Th>Fin</Th><Th>Estado</Th><Th>{""}</Th></Thead>
              <Tbody>
                {periodos.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-medium">{p.nombre}</Td>
                    <Td>{p.fecha_inicio}</Td>
                    <Td>{p.fecha_fin}</Td>
                    <Td><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[p.estado] ?? ""}`}>{p.estado}</span></Td>
                    <Td>
                      {p.estado === "abierto" && (
                        <ActionForm action={cerrarPeriodoContableAction} confirmMessage="¿Cerrar este período? No se podrán agregar más movimientos." className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <button type="submit" className="text-sm text-slate-600 hover:underline">Cerrar período</button>
                        </ActionForm>
                      )}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo período contable</h2>
          <form action={createPeriodoContableAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre"><TextInput id="nombre" name="nombre" placeholder="Ej. 2025-I" required /></Field>
            <Field label="Fecha inicio" htmlFor="fecha_inicio"><TextInput id="fecha_inicio" name="fecha_inicio" type="date" required /></Field>
            <Field label="Fecha fin" htmlFor="fecha_fin"><TextInput id="fecha_fin" name="fecha_fin" type="date" required /></Field>
            <SubmitButton>Crear período</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
