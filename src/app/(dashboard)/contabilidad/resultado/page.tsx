import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { getResultadoEjercicio, listPeriodosContables } from "@/modules/contabilidad";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function ResultadoPage({ searchParams }: { searchParams: Promise<{ periodo_id?: string }> }) {
  const params = await searchParams;
  const [resultado, periodos] = await Promise.all([
    getResultadoEjercicio(params.periodo_id),
    listPeriodosContables(),
  ]);

  const { totalIngresos, totalEgresos, resultado: utilidad, ingresos, egresos } = resultado;
  const isUtilidad = utilidad >= 0;

  return (
    <>
      <Header title="Resultado del ejercicio" />
      <main className="space-y-6 p-6">
        <form className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Período:</label>
          <select name="periodo_id" defaultValue={params.periodo_id ?? ""}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todos los períodos</option>
            {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium hover:bg-slate-200">Aplicar</button>
        </form>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total ingresos", value: totalIngresos, color: "border-l-emerald-500", textColor: "text-emerald-700" },
            { label: "Total egresos", value: totalEgresos, color: "border-l-red-400", textColor: "text-red-700" },
            { label: isUtilidad ? "Utilidad del ejercicio" : "Pérdida del ejercicio", value: Math.abs(utilidad), color: isUtilidad ? "border-l-blue-500" : "border-l-orange-500", textColor: isUtilidad ? "text-blue-700" : "text-orange-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-slate-200 border-l-4 ${s.color} bg-white p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.textColor}`}>{fmt(s.value)}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Ingresos</h2>
            {ingresos.length === 0 ? <EmptyState title="Sin ingresos" /> : (
              <Table>
                <Thead><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Valor</Th></Thead>
                <Tbody>
                  {ingresos.map((i) => (
                    <tr key={i.id}>
                      <Td>{i.fecha}</Td>
                      <Td>{i.concepto}</Td>
                      <Td className="text-slate-500">{i.cuenta?.nombre ?? "—"}</Td>
                      <Td className="font-semibold text-emerald-700">{fmt(Number(i.valor))}</Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Egresos</h2>
            {egresos.length === 0 ? <EmptyState title="Sin egresos" /> : (
              <Table>
                <Thead><Th>Fecha</Th><Th>Concepto</Th><Th>Cuenta</Th><Th>Valor</Th></Thead>
                <Tbody>
                  {egresos.map((e) => (
                    <tr key={e.id}>
                      <Td>{e.fecha}</Td>
                      <Td>{e.concepto}</Td>
                      <Td className="text-slate-500">{e.cuenta?.nombre ?? "—"}</Td>
                      <Td className="font-semibold text-red-700">{fmt(Number(e.valor))}</Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
