import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listEgresos, listPeriodosContables, listCuentas } from "@/modules/contabilidad";
import { createEgresoAction, deleteEgresoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function EgresosPage({ searchParams }: { searchParams: Promise<{ periodo_id?: string }> }) {
  const params = await searchParams;
  const [egresos, periodos, cuentas] = await Promise.all([
    listEgresos(params.periodo_id),
    listPeriodosContables(),
    listCuentas("egreso"),
  ]);

  const total = egresos.reduce((a, e) => a + Number(e.valor), 0);

  return (
    <>
      <Header title="Egresos contables" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4">
            <form className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Período:</label>
              <select name="periodo_id" defaultValue={params.periodo_id ?? ""}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Todos</option>
                {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200">Filtrar</button>
            </form>
            {egresos.length > 0 && (
              <span className="ml-auto text-sm font-semibold text-red-700">Total: {fmt(total)}</span>
            )}
          </div>
          {egresos.length === 0 ? <EmptyState title="No hay egresos registrados" /> : (
            <Table>
              <Thead><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Comprobante</Th><Th>Valor</Th><Th>{""}</Th></Thead>
              <Tbody>
                {egresos.map((e) => (
                  <tr key={e.id}>
                    <Td>{e.fecha}</Td>
                    <Td className="font-medium">{e.concepto}</Td>
                    <Td className="text-slate-500">{e.cuenta?.nombre ?? "—"}</Td>
                    <Td className="text-slate-500">{e.comprobante ?? "—"}</Td>
                    <Td className="font-semibold text-red-700">{fmt(Number(e.valor))}</Td>
                    <Td>
                      <ActionForm action={deleteEgresoAction} confirmMessage="¿Eliminar este egreso?" className="inline">
                        <input type="hidden" name="id" value={e.id} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Registrar egreso</h2>
          <form action={createEgresoAction} className="space-y-4">
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
            <SubmitButton>Guardar egreso</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
