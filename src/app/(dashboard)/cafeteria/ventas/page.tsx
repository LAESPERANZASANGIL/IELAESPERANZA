import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listVentas, listProductos } from "@/modules/cafeteria";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
const hoy = () => new Date().toISOString().slice(0, 10);

export default async function VentasPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const params = await searchParams;
  const fecha = params.fecha || hoy();
  const [ventas, productos] = await Promise.all([listVentas(fecha), listProductos(true)]);
  const totalDia = ventas.reduce((a, v) => a + Number(v.total), 0);

  return (
    <>
      <Header title="Ventas de cafetería" />
      <main className="space-y-6 p-6">
        <form method="get" className="flex gap-4 items-end rounded-xl border border-slate-200 bg-white p-4">
          <Field label="Fecha" htmlFor="fecha">
            <TextInput id="fecha" name="fecha" type="date" defaultValue={fecha} />
          </Field>
          <SubmitButton>Filtrar</SubmitButton>
          {ventas.length > 0 && (
            <p className="ml-auto text-sm font-semibold text-slate-700">
              Total del día: <span className="text-brand-700">{fmt(totalDia)}</span>
            </p>
          )}
        </form>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            {ventas.length === 0 ? <EmptyState title="Sin ventas para esta fecha" /> : (
              <Table>
                <Thead><Th>Cliente</Th><Th>Productos</Th><Th>Total</Th><Th>{""}</Th></Thead>
                <Tbody>
                  {ventas.map((v) => (
                    <tr key={v.id}>
                      <Td>{v.cliente_nombre ?? "Mostrador"}</Td>
                      <Td className="text-xs text-slate-500">
                        {(v.items ?? []).map((i) => `${i.cantidad}x ${i.nombre_producto}`).join(", ")}
                      </Td>
                      <Td className="font-medium">{fmt(Number(v.total))}</Td>
                      <Td>
                        <ActionForm action={async (fd: FormData) => { "use server"; const { deleteVenta } = await import("@/modules/cafeteria"); const { revalidatePath } = await import("next/cache"); await deleteVenta(fd.get("id") as string); revalidatePath("/cafeteria/ventas"); }} confirmMessage="¿Eliminar esta venta?" className="inline">
                          <input type="hidden" name="id" value={v.id} />
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
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Registrar venta</h2>
            <form action="/cafeteria/ventas/nueva" method="get">
              <p className="text-sm text-slate-500 mb-3">Usa el formulario detallado para registrar una venta con múltiples productos.</p>
              <button type="submit" className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Nueva venta →
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
