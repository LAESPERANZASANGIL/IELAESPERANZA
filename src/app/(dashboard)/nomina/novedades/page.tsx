import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listNovedades, listEmpleados } from "@/modules/nomina";
import { createNovedadAction, deleteNovedadAction } from "./actions";

export default async function NovedadesPage() {
  const [novedades, empleados] = await Promise.all([listNovedades(), listEmpleados(true)]);
  const empMap = new Map(empleados.map((e) => [e.id, `${e.apellidos} ${e.nombres}`]));

  return (
    <>
      <Header title="Novedades de nómina" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {novedades.length === 0 ? <EmptyState title="Aún no hay novedades registradas" /> : (
            <Table>
              <Thead><Th>Empleado</Th><Th>Tipo</Th><Th>Inicio</Th><Th>Fin</Th><Th>Días</Th><Th>{""}</Th></Thead>
              <Tbody>
                {novedades.map((n) => (
                  <tr key={n.id}>
                    <Td className="font-medium">{empMap.get(n.empleado_id) ?? "—"}</Td>
                    <Td>{n.tipo}</Td>
                    <Td>{n.fecha_inicio}</Td>
                    <Td>{n.fecha_fin ?? "—"}</Td>
                    <Td>{n.dias ?? "—"}</Td>
                    <Td>
                      <ActionForm action={deleteNovedadAction} confirmMessage="¿Eliminar esta novedad?" className="inline">
                        <input type="hidden" name="id" value={n.id} />
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
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva novedad</h2>
          <form action={createNovedadAction} className="space-y-4">
            <Field label="Empleado" htmlFor="empleado_id">
              <Select id="empleado_id" name="empleado_id" required defaultValue="">
                <option value="" disabled>Selecciona un empleado</option>
                {empleados.map((e) => <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>)}
              </Select>
            </Field>
            <Field label="Tipo" htmlFor="tipo">
              <Select id="tipo" name="tipo" defaultValue="licencia">
                <option value="licencia">Licencia</option>
                <option value="incapacidad">Incapacidad</option>
                <option value="vacaciones">Vacaciones</option>
                <option value="permiso">Permiso</option>
                <option value="sancion">Sanción</option>
              </Select>
            </Field>
            <Field label="Fecha inicio" htmlFor="fecha_inicio"><TextInput id="fecha_inicio" name="fecha_inicio" type="date" required /></Field>
            <Field label="Fecha fin" htmlFor="fecha_fin"><TextInput id="fecha_fin" name="fecha_fin" type="date" /></Field>
            <Field label="Días" htmlFor="dias"><TextInput id="dias" name="dias" type="number" min={1} /></Field>
            <Field label="Descripción" htmlFor="descripcion"><TextInput id="descripcion" name="descripcion" /></Field>
            <SubmitButton>Registrar novedad</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
