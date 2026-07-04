import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listEmpleados, listCargos } from "@/modules/nomina";
import { createEmpleadoAction, actualizarEstadoEmpleadoAction } from "./actions";

const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default async function EmpleadosPage() {
  const [empleados, cargos] = await Promise.all([listEmpleados(), listCargos()]);

  return (
    <>
      <Header title="Empleados" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {empleados.length === 0 ? <EmptyState title="Aún no hay empleados registrados" /> : (
            <Table>
              <Thead><Th>Nombre</Th><Th>Cargo</Th><Th>Contrato</Th><Th>Salario</Th><Th>Estado</Th><Th>{""}</Th></Thead>
              <Tbody>
                {empleados.map((e) => (
                  <tr key={e.id}>
                    <Td className="font-medium">{e.apellidos} {e.nombres}</Td>
                    <Td>{e.cargo?.nombre ?? "—"}</Td>
                    <Td>{e.tipo_contrato}</Td>
                    <Td>{fmt(Number(e.salario))}</Td>
                    <Td>{e.is_active ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <ActionForm action={actualizarEstadoEmpleadoAction} className="inline">
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="is_active" value={(!e.is_active).toString()} />
                        <button type="submit" className="text-sm font-medium text-brand-700 hover:underline">{e.is_active ? "Desactivar" : "Activar"}</button>
                      </ActionForm>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo empleado</h2>
          <form action={createEmpleadoAction} className="space-y-4">
            <Field label="Nombres" htmlFor="nombres"><TextInput id="nombres" name="nombres" required /></Field>
            <Field label="Apellidos" htmlFor="apellidos"><TextInput id="apellidos" name="apellidos" required /></Field>
            <Field label="Documento" htmlFor="documento"><TextInput id="documento" name="documento" /></Field>
            <Field label="Cargo" htmlFor="cargo_id">
              <Select id="cargo_id" name="cargo_id" defaultValue="">
                <option value="">Sin cargo</option>
                {cargos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Tipo de contrato" htmlFor="tipo_contrato">
              <Select id="tipo_contrato" name="tipo_contrato" defaultValue="indefinido">
                <option value="indefinido">Indefinido</option>
                <option value="fijo">Término fijo</option>
                <option value="prestacion_servicios">Prestación de servicios</option>
              </Select>
            </Field>
            <Field label="Salario mensual (COP)" htmlFor="salario"><TextInput id="salario" name="salario" type="number" min={0} required /></Field>
            <Field label="Fecha de ingreso" htmlFor="fecha_ingreso"><TextInput id="fecha_ingreso" name="fecha_ingreso" type="date" /></Field>
            <SubmitButton>Crear empleado</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
