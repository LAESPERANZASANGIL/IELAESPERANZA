import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listMallaCurricular, listAsignaturas, listDocentes } from "@/modules/academico";
import { asignarMallaCurricularAction } from "./actions";

export default async function MallaCurricularPage({
  params,
}: {
  params: Promise<{ id: string; grupoId: string }>;
}) {
  const { id, grupoId } = await params;
  const [malla, asignaturas, docentes] = await Promise.all([
    listMallaCurricular(grupoId),
    listAsignaturas(),
    listDocentes(true),
  ]);

  return (
    <>
      <Header title="Malla curricular" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {malla.length === 0 ? (
            <EmptyState title="Aún no hay asignaturas asignadas a este grupo" />
          ) : (
            <Table>
              <Thead>
                <Th>Asignatura</Th>
                <Th>Docente</Th>
                <Th>Intensidad horaria</Th>
              </Thead>
              <Tbody>
                {malla.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.asignatura.nombre}</Td>
                    <Td>{item.docente?.profile.full_name ?? "—"}</Td>
                    <Td>{item.intensidad_horaria ?? "—"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Asignar asignatura</h2>
          <form action={asignarMallaCurricularAction} className="space-y-4">
            <input type="hidden" name="grado_id" value={id} />
            <input type="hidden" name="grupo_id" value={grupoId} />
            <Field label="Asignatura" htmlFor="asignatura_id">
              <Select id="asignatura_id" name="asignatura_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona una asignatura
                </option>
                {asignaturas.map((asignatura) => (
                  <option key={asignatura.id} value={asignatura.id}>
                    {asignatura.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Docente" htmlFor="docente_id">
              <Select id="docente_id" name="docente_id" defaultValue="">
                <option value="">Sin asignar</option>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Intensidad horaria" htmlFor="intensidad_horaria">
              <TextInput id="intensidad_horaria" name="intensidad_horaria" type="number" />
            </Field>
            <SubmitButton>Asignar</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
