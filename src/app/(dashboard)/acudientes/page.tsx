import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listAcudientes } from "@/modules/estudiantes";
import { createAcudienteAction } from "./actions";

export default async function AcudientesPage() {
  const acudientes = await listAcudientes();

  return (
    <>
      <Header title="Acudientes" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {acudientes.length === 0 ? (
            <EmptyState title="Aún no hay acudientes registrados" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Teléfono</Th>
                <Th>Ocupación</Th>
              </Thead>
              <Tbody>
                {acudientes.map((acudiente) => (
                  <tr key={acudiente.id}>
                    <Td>{acudiente.profile.full_name}</Td>
                    <Td>{acudiente.profile.email}</Td>
                    <Td>{acudiente.profile.phone ?? "—"}</Td>
                    <Td>{acudiente.ocupacion ?? "—"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo acudiente</h2>
          <ActionForm action={createAcudienteAction} className="space-y-4">
            <Field label="Nombre completo" htmlFor="full_name">
              <TextInput id="full_name" name="full_name" required />
            </Field>
            <Field label="Correo" htmlFor="email">
              <TextInput id="email" name="email" type="email" required />
            </Field>
            <Field label="Contraseña temporal" htmlFor="password">
              <TextInput id="password" name="password" type="password" minLength={6} required />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <TextInput id="phone" name="phone" />
            </Field>
            <Field label="Documento" htmlFor="documento_numero">
              <TextInput id="documento_numero" name="documento_numero" />
            </Field>
            <Field label="Ocupación" htmlFor="ocupacion">
              <TextInput id="ocupacion" name="ocupacion" />
            </Field>
            <SubmitButton>Crear acudiente</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
