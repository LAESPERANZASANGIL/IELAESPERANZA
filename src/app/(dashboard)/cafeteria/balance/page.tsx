import { Header } from "@/components/layout/Header";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getBalance, listVentas, listGastos } from "@/modules/cafeteria";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function BalancePage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const params = await searchParams;
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = params.desde || hoy;
  const hasta = params.hasta || hoy;

  const [balance, ventas, gastos] = await Promise.all([
    getBalance(desde, hasta),
    listVentas(),
    listGastos(),
  ]);

  return (
    <>
      <Header title="Balance de cafetería" />
      <main className="space-y-6 p-6">
        <form method="get" className="flex flex-wrap gap-4 items-end rounded-xl border border-slate-200 bg-white p-4">
          <Field label="Desde" htmlFor="desde"><TextInput id="desde" name="desde" type="date" defaultValue={desde} /></Field>
          <Field label="Hasta" htmlFor="hasta"><TextInput id="hasta" name="hasta" type="date" defaultValue={hasta} /></Field>
          <SubmitButton>Consultar</SubmitButton>
        </form>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Ingresos (ventas)", value: balance.totalIngresos, color: "border-l-green-500 text-green-700" },
            { label: "Egresos (gastos)", value: balance.totalGastos, color: "border-l-red-400 text-red-600" },
            { label: "Balance", value: balance.balance, color: balance.balance >= 0 ? "border-l-brand-500 text-brand-700" : "border-l-red-500 text-red-700" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border border-slate-200 border-l-4 ${stat.color.split(" ")[0]} bg-white p-5`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color.split(" ")[1]}`}>{fmt(stat.value)}</p>
              <p className="mt-1 text-xs text-slate-400">{desde} — {hasta}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
