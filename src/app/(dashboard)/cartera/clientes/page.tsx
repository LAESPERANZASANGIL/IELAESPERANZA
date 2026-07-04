import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listClientesCartera } from "@/modules/cartera";
import { createClienteAction } from "./actions";

export default async function ClientesCarteraPage() {
  const clientes = await listClientesCartera();
  return (
    <>
      <Header title="Clientes de cartera" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {clientes.length === 0 ? <EmptyState title="Aún no hay clientes registrados" /> : (
            <Table>
              <Thead><Th>Nombre</Th><Th>Documento</Th><Th>Tipo</Th><Th>Teléfono</Th><Th>Email</Th></Thead>
              <Tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium">{c.apellidos} {c.nombres}</Td>
                    <Td>{c.documento ?? "—"}</Td>
                    <Td>{c.tipo}</Td>
                    <Td>{c.telefono ?? "—"}</Td>
                    <Td>{c.email ?? "—"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo cliente</h2>
          <form action={createClienteAction} className="space-y-4">
            <Field label="Nombres" htmlFor="nombres"><TextInput id="nombres" name="nombres" required /></Field>
            <Field label="Apellidos" htmlFor="apellidos"><TextInput id="apellidos" name="apellidos" required /></Field>
            <Field label="Documento" htmlFor="documento"><TextInput id="documento" name="documento" /></Field>
            <Field label="Tipo" htmlFor="tipo">
              <Select id="tipo" name="tipo" defaultValue="padre_familia">
                <option value="padre_familia">Padre de familia</option>
                <option value="empresa">Empresa</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
            <Field label="Teléfono" htmlFor="telefono"><TextInput id="telefono" name="telefono" /></Field>
            <Field label="Email" htmlFor="email"><TextInput id="email" name="email" type="email" /></Field>
            <Field label="Dirección" htmlFor="direccion"><TextInput id="direccion" name="direccion" /></Field>
            <SubmitButton>Crear cliente</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
