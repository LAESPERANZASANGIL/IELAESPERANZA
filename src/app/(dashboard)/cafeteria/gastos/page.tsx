import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGastos } from "@/modules/cafeteria";
import { createGastoAction, deleteGastoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function GastosPage() {
  const gastos = await listGastos();
  const total = gastos.reduce((a, g) => a + Number(g.monto), 0);

  return (
    <>
      <Header title="Gastos de cafetería" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {gastos.length === 0 ? <EmptyState title="Aún no hay gastos registrados" /> : (
            <>
              <p className="mb-3 text-sm font-medium text-slate-700">Total: <span className="text-red-600">{fmt(total)}</span></p>
              <Table>
                <Thead><Th>Fecha</Th><Th>Concepto</Th><Th>Monto</Th><Th>{""}</Th></Thead>
                <Tbody>
                  {gastos.map((g) => (
                    <tr key={g.id}>
                      <Td>{g.fecha}</Td>
                      <Td>{g.concepto}</Td>
                      <Td className="font-medium text-red-600">{fmt(Number(g.monto))}</Td>
                      <Td>
                        <ActionForm action={deleteGastoAction} confirmMessage="¿Eliminar este gasto?" className="inline">
                          <input type="hidden" name="id" value={g.id} />
                          <button type="submit" className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                        </ActionForm>
                      </Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Registrar gasto</h2>
          <form action={createGastoAction} className="space-y-4">
            <Field label="Fecha" htmlFor="fecha"><TextInput id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></Field>
            <Field label="Concepto" htmlFor="concepto"><TextInput id="concepto" name="concepto" required /></Field>
            <Field label="Monto (COP)" htmlFor="monto"><TextInput id="monto" name="monto" type="number" min={0} required /></Field>
            <Field label="Observación" htmlFor="observacion"><TextInput id="observacion" name="observacion" /></Field>
            <SubmitButton>Registrar gasto</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
