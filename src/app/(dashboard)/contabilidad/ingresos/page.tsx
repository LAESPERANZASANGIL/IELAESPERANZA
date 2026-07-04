import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listIngresos, listPeriodosContables, listCuentas } from "@/modules/contabilidad";
import { createIngresoAction, deleteIngresoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function IngresosPage({ searchParams }: { searchParams: Promise<{ periodo_id?: string }> }) {
  const params = await searchParams;
  const [ingresos, periodos, cuentas] = await Promise.all([
    listIngresos(params.periodo_id),
    listPeriodosContables(),
    listCuentas("ingreso"),
  ]);

  const total = ingresos.reduce((a, i) => a + Number(i.valor), 0);

  return (
    <>
      <Header title="Ingresos contables" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <form className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Período:</label>
              <select name="periodo_id" defaultValue={params.periodo_id ?? ""} onChange={undefined}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Todos</option>
                {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200">Filtrar</button>
            </form>
            {ingresos.length > 0 && (
              <span className="ml-auto text-sm font-semibold text-emerald-700">Total: {fmt(total)}</span>
            )}
          </div>
          {ingresos.length === 0 ? <EmptyState title="No hay ingresos registrados" /> : (
            <Table>
              <Thead><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Comprobante</Th><Th>Valor</Th><Th>{""}</Th></Thead>
              <Tbody>
                {ingresos.map((i) => (
                  <tr key={i.id}>
                    <Td>{i.fecha}</Td>
                    <Td className="font-medium">{i.concepto}</Td>
                    <Td className="text-slate-500">{i.cuenta?.nombre ?? "—"}</Td>
                    <Td className="text-slate-500">{i.comprobante ?? "—"}</Td>
                    <Td className="font-semibold text-emerald-700">{fmt(Number(i.valor))}</Td>
                    <Td>
                      <ActionForm action={deleteIngresoAction} confirmMessage="¿Eliminar este ingreso?" className="inline">
                        <input type="hidden" name="id" value={i.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </ActionForm>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Registrar ingreso</h2>
          <form action={createIngresoAction} className="space-y-4">
            <Field label="Período" htmlFor="periodo_id">
              <Select id="periodo_id" name="periodo_id" defaultValue="">
                <option value="">Sin período</option>
                {periodos.filter((p) => p.estado === "abierto").map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Cuenta" htmlFor="cuenta_id">
              <Select id="cuenta_id" name="cuenta_id" defaultValue="">
                <option value="">Sin cuenta</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Fecha" htmlFor="fecha"><TextInput id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
            <Field label="Concepto" htmlFor="concepto"><TextInput id="concepto" name="concepto" required /></Field>
            <Field label="Valor (COP)" htmlFor="valor"><TextInput id="valor" name="valor" type="number" min={0} required /></Field>
            <Field label="Comprobante" htmlFor="comprobante"><TextInput id="comprobante" name="comprobante" placeholder="Opcional" /></Field>
            <Field label="Observación" htmlFor="observacion"><TextInput id="observacion" name="observacion" placeholder="Opcional" /></Field>
            <SubmitButton>Guardar ingreso</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
