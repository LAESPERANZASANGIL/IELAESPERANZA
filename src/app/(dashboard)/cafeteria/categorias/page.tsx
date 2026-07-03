import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listCategorias } from "@/modules/cafeteria";
import { createCategoriaAction, deleteCategoriaAction } from "./actions";

export default async function CategoriasPage() {
  const categorias = await listCategorias();
  return (
    <>
      <Header title="Categorías de cafetería" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {categorias.length === 0 ? <EmptyState title="Aún no hay categorías" /> : (
            <Table>
              <Thead><Th>Nombre</Th><Th>Descripción</Th><Th>{""}</Th></Thead>
              <Tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium">{c.nombre}</Td>
                    <Td>{c.descripcion ?? "—"}</Td>
                    <Td>
                      <ActionForm action={deleteCategoriaAction} confirmMessage="¿Eliminar esta categoría?" className="inline">
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva categoría</h2>
          <form action={createCategoriaAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre"><TextInput id="nombre" name="nombre" required /></Field>
            <Field label="Descripción" htmlFor="descripcion"><TextInput id="descripcion" name="descripcion" /></Field>
            <SubmitButton>Crear categoría</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
