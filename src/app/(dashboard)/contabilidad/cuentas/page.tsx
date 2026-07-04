import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCuentas } from "@/modules/contabilidad";
import { createCuentaAction } from "./actions";

const TIPO_COLOR: Record<string, string> = {
  ingreso: "bg-emerald-100 text-emerald-800",
  egreso: "bg-red-100 text-red-800",
  activo: "bg-blue-100 text-blue-800",
  pasivo: "bg-orange-100 text-orange-800",
  patrimonio: "bg-purple-100 text-purple-800",
};

export default async function CuentasPage() {
  const cuentas = await listCuentas();

  return (
    <>
      <Header title="Plan de cuentas" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {cuentas.length === 0 ? <EmptyState title="No hay cuentas registradas" /> : (
            <Table>
              <Thead><Th>Código</Th><Th>Nombre</Th><Th>Tipo</Th><Th>Descripción</Th></Thead>
              <Tbody>
                {cuentas.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-mono font-medium">{c.codigo}</Td>
                    <Td className="font-medium">{c.nombre}</Td>
                    <Td><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLOR[c.tipo] ?? ""}`}>{c.tipo}</span></Td>
                    <Td className="text-slate-500">{c.descripcion ?? "—"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva cuenta</h2>
          <form action={createCuentaAction} className="space-y-4">
            <Field label="Código" htmlFor="codigo"><TextInput id="codigo" name="codigo" placeholder="Ej. 4105" required /></Field>
            <Field label="Nombre" htmlFor="nombre"><TextInput id="nombre" name="nombre" required /></Field>
            <Field label="Tipo" htmlFor="tipo">
              <Select id="tipo" name="tipo" required defaultValue="">
                <option value="" disabled>Selecciona un tipo</option>
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
                <option value="patrimonio">Patrimonio</option>
              </Select>
            </Field>
            <Field label="Descripción" htmlFor="descripcion"><TextInput id="descripcion" name="descripcion" placeholder="Opcional" /></Field>
            <SubmitButton>Crear cuenta</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
