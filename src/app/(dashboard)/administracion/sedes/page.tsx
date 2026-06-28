import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listSedes } from "@/modules/core";
import { createSedeAction } from "./actions";

export default async function SedesPage() {
  const sedes = await listSedes();

  return (
    <>
      <Header title="Sedes" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {sedes.length === 0 ? (
            <EmptyState title="Aún no hay sedes registradas" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Código DANE</Th>
                <Th>Dirección</Th>
                <Th>Teléfono</Th>
              </Thead>
              <Tbody>
                {sedes.map((sede) => (
                  <tr key={sede.id}>
                    <Td>{sede.nombre}</Td>
                    <Td>{sede.codigo_dane ?? "—"}</Td>
                    <Td>{sede.direccion ?? "—"}</Td>
                    <Td>{sede.telefono ?? "—"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva sede</h2>
          <form action={createSedeAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Código DANE" htmlFor="codigo_dane">
              <TextInput id="codigo_dane" name="codigo_dane" />
            </Field>
            <Field label="Dirección" htmlFor="direccion">
              <TextInput id="direccion" name="direccion" />
            </Field>
            <Field label="Teléfono" htmlFor="telefono">
              <TextInput id="telefono" name="telefono" />
            </Field>
            <SubmitButton>Crear sede</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
