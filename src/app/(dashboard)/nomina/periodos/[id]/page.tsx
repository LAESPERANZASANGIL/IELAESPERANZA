import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listEmpleados, listLiquidaciones, listPeriodosNomina } from "@/modules/nomina";
import { liquidarEmpleadoAction } from "../actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function LiquidarPeriodoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const periodos = await listPeriodosNomina();
  const periodo = periodos.find((p) => p.id === id);
  if (!periodo) notFound();

  const [empleados, liquidaciones] = await Promise.all([listEmpleados(true), listLiquidaciones(id)]);
  const liquidadosIds = new Set(liquidaciones.map((l) => l.empleado_id));
  const pendientes = empleados.filter((e) => !liquidadosIds.has(e.id));
  const totalNeto = liquidaciones.reduce((a, l) => a + Number(l.neto), 0);

  return (
    <>
      <Header title={`Nómina: ${periodo.nombre}`} />
      <main className="space-y-6 p-6">
        {liquidaciones.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Liquidaciones ({liquidaciones.length})</h2>
              <span className="text-sm font-semibold text-slate-700">Total neto: {fmt(totalNeto)}</span>
            </div>
            <Table>
              <Thead><Th>Empleado</Th><Th>Salario base</Th><Th>Bonificaciones</Th><Th>Deducciones</Th><Th>Neto</Th></Thead>
              <Tbody>
                {liquidaciones.map((l) => (
                  <tr key={l.id}>
                    <Td className="font-medium">{l.empleado?.apellidos} {l.empleado?.nombres}</Td>
                    <Td>{fmt(Number(l.salario_base))}</Td>
                    <Td className="text-green-700">{fmt(Number(l.bonificaciones))}</Td>
                    <Td className="text-red-600">{fmt(Number(l.deducciones))}</Td>
                    <Td className="font-semibold">{fmt(Number(l.neto))}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}

        {pendientes.length === 0 ? (
          <EmptyState title="Todos los empleados han sido liquidados en este período" />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Liquidar empleados pendientes ({pendientes.length})</h2>
            <div className="space-y-3">
              {pendientes.map((e) => (
                <ActionForm key={e.id} action={liquidarEmpleadoAction} className="grid gap-3 sm:grid-cols-5 border border-slate-100 rounded-lg p-3 bg-slate-50">
                  <input type="hidden" name="periodo_id" value={id} />
                  <input type="hidden" name="empleado_id" value={e.id} />
                  <div className="sm:col-span-2 flex items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.apellidos} {e.nombres}</p>
                      <p className="text-xs text-slate-500">Salario: {fmt(Number(e.salario))}</p>
                    </div>
                  </div>
                  <Field label="Bonificaciones" htmlFor={`bon_${e.id}`}>
                    <TextInput id={`bon_${e.id}`} name="bonificaciones" type="number" min={0} defaultValue={0} />
                  </Field>
                  <Field label="Deducciones" htmlFor={`ded_${e.id}`}>
                    <TextInput id={`ded_${e.id}`} name="deducciones" type="number" min={0} defaultValue={0} />
                  </Field>
                  <div className="flex items-end">
                    <button type="submit" className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                      Liquidar
                    </button>
                  </div>
                </ActionForm>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
