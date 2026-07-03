import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listProductos, listCategorias } from "@/modules/cafeteria";
import { createProductoAction, updateProductoAction, deleteProductoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function ProductosPage() {
  const [productos, categorias] = await Promise.all([listProductos(), listCategorias()]);

  return (
    <>
      <Header title="Productos de cafetería" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {productos.length === 0 ? <EmptyState title="Aún no hay productos" /> : (
            <Table>
              <Thead><Th>Nombre</Th><Th>Categoría</Th><Th>Precio</Th><Th>Stock</Th><Th>Estado</Th><Th>{""}</Th></Thead>
              <Tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-medium">{p.nombre}</Td>
                    <Td>{p.categoria?.nombre ?? "—"}</Td>
                    <Td>{fmt(p.precio)}</Td>
                    <Td><span className={p.stock <= 5 ? "text-red-600 font-medium" : ""}>{p.stock}</span></Td>
                    <Td>{p.is_active ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <ActionForm action={deleteProductoAction} confirmMessage="¿Eliminar este producto?" className="inline">
                        <input type="hidden" name="id" value={p.id} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo producto</h2>
          <form action={createProductoAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre"><TextInput id="nombre" name="nombre" required /></Field>
            <Field label="Categoría" htmlFor="categoria_id">
              <Select id="categoria_id" name="categoria_id" defaultValue="">
                <option value="">Sin categoría</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Precio (COP)" htmlFor="precio"><TextInput id="precio" name="precio" type="number" min={0} required /></Field>
            <Field label="Stock inicial" htmlFor="stock"><TextInput id="stock" name="stock" type="number" min={0} defaultValue={0} /></Field>
            <Field label="Descripción" htmlFor="descripcion"><TextInput id="descripcion" name="descripcion" /></Field>
            <SubmitButton>Crear producto</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
