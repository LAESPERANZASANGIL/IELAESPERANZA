import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listFacturas, listClientesCartera, getResumenCartera } from "@/modules/cartera";
import { createFacturaAction, anularFacturaAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const ESTADO_COLOR: Record<string, string> = { pendiente: "bg-amber-100 text-amber-800", parcial: "bg-blue-100 text-blue-800", pagada: "bg-green-100 text-green-800", vencida: "bg-red-100 text-red-700", anulada: "bg-slate-100 text-slate-500" };

export default async function FacturasPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const params = await searchParams;
  const [facturas, clientes, resumen] = await Promise.all([listFacturas(params.estado), listClientesCartera(true), getResumenCartera()]);

  return (
    <>
      <Header title="Facturas de cartera" />
      <main className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Por cobrar", value: resumen.totalPendiente, color: "border-l-amber-500" },
            { label: "Cobrado", value: resumen.totalCobrado, color: "border-l-green-500" },
            { label: "En mora", value: resumen.enMora, color: "border-l-red-400", prefix: "" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-200 border-l-4 ${s.color} bg-white p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{s.label === "En mora" ? `${s.value} fact.` : fmt(s.value)}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {facturas.length === 0 ? <EmptyState title="Aún no hay facturas" /> : (
              <Table>
                <Thead><Th>Cliente</Th><Th>Concepto</Th><Th>Valor</Th><Th>Saldo</Th><Th>Vence</Th><Th>Estado</Th><Th>{""}</Th></Thead>
                <Tbody>
                  {facturas.map((f) => (
                    <tr key={f.id}>
                      <Td className="font-medium">{f.cliente?.apellidos} {f.cliente?.nombres}</Td>
                      <Td>{f.concepto}</Td>
                      <Td>{fmt(Number(f.valor_total))}</Td>
                      <Td className={Number(f.saldo) > 0 ? "text-amber-700 font-medium" : ""}>{fmt(Number(f.saldo))}</Td>
                      <Td>{f.fecha_vencimiento ?? "—"}</Td>
                      <Td><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_COLOR[f.estado] ?? ""}`}>{f.estado}</span></Td>
                      <Td>
                        {f.estado !== "anulada" && f.estado !== "pagada" && (
                          <ActionForm action={anularFacturaAction} confirmMessage="¿Anular esta factura?" className="inline">
                            <input type="hidden" name="id" value={f.id} />
                            <button type="submit" className="text-sm text-red-600 hover:underline">Anular</button>
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
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva factura</h2>
            <form action={createFacturaAction} className="space-y-4">
              <Field label="Cliente" htmlFor="cliente_id">
                <Select id="cliente_id" name="cliente_id" required defaultValue="">
                  <option value="" disabled>Selecciona un cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.apellidos} {c.nombres}</option>)}
                </Select>
              </Field>
              <Field label="N° Factura" htmlFor="numero"><TextInput id="numero" name="numero" /></Field>
              <Field label="Concepto" htmlFor="concepto"><TextInput id="concepto" name="concepto" required /></Field>
              <Field label="Valor total (COP)" htmlFor="valor_total"><TextInput id="valor_total" name="valor_total" type="number" min={0} required /></Field>
              <Field label="Fecha emisión" htmlFor="fecha_emision"><TextInput id="fecha_emision" name="fecha_emision" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></Field>
              <Field label="Fecha vencimiento" htmlFor="fecha_vencimiento"><TextInput id="fecha_vencimiento" name="fecha_vencimiento" type="date" /></Field>
              <SubmitButton>Crear factura</SubmitButton>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
