import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listFacturas } from "@/modules/cartera";
import { registrarPagoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function CobrosPage() {
  const pendientes = await listFacturas("pendiente");
  const parciales = await listFacturas("parcial");
  const facturasPorCobrar = [...pendientes, ...parciales];

  return (
    <>
      <Header title="Cobros de cartera" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {facturasPorCobrar.length === 0 ? <EmptyState title="No hay facturas pendientes de cobro" /> : (
            <Table>
              <Thead><Th>Cliente</Th><Th>Concepto</Th><Th>Saldo</Th><Th>Vence</Th></Thead>
              <Tbody>
                {facturasPorCobrar.map((f) => (
                  <tr key={f.id}>
                    <Td className="font-medium">{f.cliente?.apellidos} {f.cliente?.nombres}</Td>
                    <Td>{f.concepto}</Td>
                    <Td className="font-semibold text-amber-700">{fmt(Number(f.saldo))}</Td>
                    <Td className={f.fecha_vencimiento && f.fecha_vencimiento < new Date().toISOString().slice(0,10) ? "text-red-600 font-medium" : ""}>
                      {f.fecha_vencimiento ?? "—"}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Registrar cobro</h2>
          <form action={registrarPagoAction} className="space-y-4">
            <Field label="Factura" htmlFor="factura_id">
              <Select id="factura_id" name="factura_id" required defaultValue="">
                <option value="" disabled>Selecciona una factura</option>
                {facturasPorCobrar.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.cliente?.apellidos} {f.cliente?.nombres} — {fmt(Number(f.saldo))}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" htmlFor="fecha"><TextInput id="fecha" name="fecha" type="date" defaultValue={new Date().toISOString().slice(0,10)} required /></Field>
            <Field label="Monto cobrado (COP)" htmlFor="monto"><TextInput id="monto" name="monto" type="number" min={0} required /></Field>
            <Field label="Forma de pago" htmlFor="forma_pago">
              <Select id="forma_pago" name="forma_pago" defaultValue="efectivo">
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
            <Field label="Referencia" htmlFor="referencia"><TextInput id="referencia" name="referencia" placeholder="Opcional" /></Field>
            <SubmitButton>Registrar cobro</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
