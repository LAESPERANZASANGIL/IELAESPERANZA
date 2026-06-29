import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listEstudiantes } from "@/modules/estudiantes";
import { createEstudianteAction, actualizarEstadoEstudianteAction } from "./actions";

export default async function EstudiantesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const estudiantes = await listEstudiantes(q);

  return (
    <>
      <Header title="Estudiantes" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <form className="flex gap-2">
            <TextInput name="q" defaultValue={q} placeholder="Buscar por nombre o documento" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Buscar
            </button>
          </form>
          {estudiantes.length === 0 ? (
            <EmptyState
              title="Aún no hay estudiantes registrados"
              description="Aquí podrás matricular estudiantes, asignarlos a un grupo y consultar su información."
            />
          ) : (
            <Table>
              <Thead>
                <Th>Nombres</Th>
                <Th>Apellidos</Th>
                <Th>Documento</Th>
                <Th>Estado</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {estudiantes.map((estudiante) => (
                  <tr key={estudiante.id}>
                    <Td>{estudiante.nombres}</Td>
                    <Td>{estudiante.apellidos}</Td>
                    <Td>{estudiante.documento_numero ?? "—"}</Td>
                    <Td>{estudiante.is_active ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link className="text-sm font-medium text-brand-700 hover:underline" href={`/estudiantes/${estudiante.id}`}>
                          Ver
                        </Link>
                        <ActionForm action={actualizarEstadoEstudianteAction} className="inline">
                          <input type="hidden" name="id" value={estudiante.id} />
                          <input type="hidden" name="is_active" value={(!estudiante.is_active).toString()} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            {estudiante.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </ActionForm>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo estudiante</h2>
          <ActionForm action={createEstudianteAction} className="space-y-4">
            <Field label="Nombres" htmlFor="nombres">
              <TextInput id="nombres" name="nombres" required />
            </Field>
            <Field label="Apellidos" htmlFor="apellidos">
              <TextInput id="apellidos" name="apellidos" required />
            </Field>
            <Field label="Tipo de documento" htmlFor="documento_tipo">
              <TextInput id="documento_tipo" name="documento_tipo" />
            </Field>
            <Field label="Número de documento" htmlFor="documento_numero">
              <TextInput id="documento_numero" name="documento_numero" />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
              <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
            </Field>
            <Field label="Género" htmlFor="genero">
              <TextInput id="genero" name="genero" />
            </Field>
            <SubmitButton>Crear estudiante</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
