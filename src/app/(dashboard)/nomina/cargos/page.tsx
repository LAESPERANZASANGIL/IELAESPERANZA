import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCargos } from "@/modules/nomina";
import { createCargoAction, deleteCargoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function CargosPage() {
  const cargos = await listCargos();
  return (
    <>
      <Header title="Cargos de nómina" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {cargos.length === 0 ? <EmptyState title="Aún no hay cargos registrados" /> : (
            <Table>
              <Thead><Th>Cargo</Th><Th>Descripción</Th><Th>Salario base</Th><Th>{""}</Th></Thead>
              <Tbody>
                {cargos.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium">{c.nombre}</Td>
                    <Td>{c.descripcion ?? "—"}</Td>
                    <Td>{fmt(Number(c.salario_base))}</Td>
                    <Td>
                      <ActionForm action={deleteCargoAction} confirmMessage="¿Eliminar este cargo?" className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                      </ActionForm>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo cargo</h2>
          <form action={createCargoAction} className="space-y-4">
            <Field label="Nombre del cargo" htmlFor="nombre"><TextInput id="nombre" name="nombre" required /></Field>
            <Field label="Descripción" htmlFor="descripcion"><TextInput id="descripcion" name="descripcion" /></Field>
            <Field label="Salario base (COP)" htmlFor="salario_base"><TextInput id="salario_base" name="salario_base" type="number" min={0} /></Field>
            <SubmitButton>Crear cargo</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
