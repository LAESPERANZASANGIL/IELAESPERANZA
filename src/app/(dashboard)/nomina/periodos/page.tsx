import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPeriodosNomina } from "@/modules/nomina";
import { createPeriodoAction, cerrarPeriodoAction } from "./actions";

const ESTADO_COLOR: Record<string, string> = {
  abierto: "bg-green-100 text-green-800",
  liquidado: "bg-blue-100 text-blue-800",
  pagado: "bg-slate-100 text-slate-700",
};

export default async function PeriodosNominaPage() {
  const periodos = await listPeriodosNomina();

  return (
    <>
      <Header title="Períodos de nómina" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {periodos.length === 0 ? <EmptyState title="Aún no hay períodos de nómina" /> : (
            <Table>
              <Thead><Th>Período</Th><Th>Inicio</Th><Th>Fin</Th><Th>Estado</Th><Th>{""}</Th></Thead>
              <Tbody>
                {periodos.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-medium">{p.nombre}</Td>
                    <Td>{p.fecha_inicio}</Td>
                    <Td>{p.fecha_fin}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[p.estado] ?? "bg-slate-100 text-slate-700"}`}>
                        {p.estado}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link href={`/nomina/periodos/${p.id}`} className="text-sm font-medium text-brand-700 hover:underline">Liquidar</Link>
                        {p.estado === "abierto" && (
                          <ActionForm action={cerrarPeriodoAction} confirmMessage="¿Cerrar este período? Ya no se podrán editar liquidaciones." className="inline">
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="text-sm font-medium text-red-600 hover:underline">Cerrar</button>
                          </ActionForm>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo período</h2>
          <form action={createPeriodoAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre"><TextInput id="nombre" name="nombre" placeholder="Ej. Enero 2026" required /></Field>
            <Field label="Fecha inicio" htmlFor="fecha_inicio"><TextInput id="fecha_inicio" name="fecha_inicio" type="date" required /></Field>
            <Field label="Fecha fin" htmlFor="fecha_fin"><TextInput id="fecha_fin" name="fecha_fin" type="date" required /></Field>
            <SubmitButton>Crear período</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
