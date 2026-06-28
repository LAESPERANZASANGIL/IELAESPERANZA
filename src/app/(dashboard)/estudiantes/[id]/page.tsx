import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getEstudiante,
  listMatriculasDeEstudiante,
  listAcudientesDeEstudiante,
  listAcudientes,
} from "@/modules/estudiantes";
import { listAniosLectivos } from "@/modules/core";
import { listGrupos } from "@/modules/academico";
import { vincularAcudienteAction, createMatriculaDirectaAction, retirarMatriculaAction } from "./actions";

export default async function EstudianteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estudiante = await getEstudiante(id);
  if (!estudiante) notFound();

  const [matriculas, acudientes, todosAcudientes, anios, grupos] = await Promise.all([
    listMatriculasDeEstudiante(id),
    listAcudientesDeEstudiante(id),
    listAcudientes(),
    listAniosLectivos(),
    listGrupos(),
  ]);

  return (
    <>
      <Header title={`${estudiante.nombres} ${estudiante.apellidos}`} />
      <main className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Matrículas</h2>
          {matriculas.length === 0 ? (
            <EmptyState title="Sin matrículas registradas" />
          ) : (
            <Table>
              <Thead>
                <Th>Grupo</Th>
                <Th>Estado</Th>
                <Th>Fecha matrícula</Th>
                <Th>Acción</Th>
              </Thead>
              <Tbody>
                {matriculas.map((matricula) => (
                  <tr key={matricula.id}>
                    <Td>{matricula.grupo.nombre}</Td>
                    <Td>{matricula.estado}</Td>
                    <Td>{matricula.fecha_matricula}</Td>
                    <Td>
                      {matricula.estado === "activa" && (
                        <form action={retirarMatriculaAction} className="flex items-center gap-2">
                          <input type="hidden" name="estudiante_id" value={id} />
                          <input type="hidden" name="matricula_id" value={matricula.id} />
                          <TextInput name="motivo" placeholder="Motivo de retiro" className="text-xs" />
                          <button className="text-sm font-medium text-red-600 hover:underline" type="submit">
                            Retirar
                          </button>
                        </form>
                      )}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Nueva matrícula</h3>
            <form action={createMatriculaDirectaAction} className="space-y-4">
              <input type="hidden" name="estudiante_id" value={id} />
              <Field label="Año lectivo" htmlFor="anio_lectivo_id">
                <Select id="anio_lectivo_id" name="anio_lectivo_id" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un año lectivo
                  </option>
                  {anios.map((anio) => (
                    <option key={anio.id} value={anio.id}>
                      {anio.anio}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Grupo" htmlFor="grupo_id">
                <Select id="grupo_id" name="grupo_id" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un grupo
                  </option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </Select>
              </Field>
              <SubmitButton>Matricular</SubmitButton>
            </form>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Acudientes</h2>
          {acudientes.length === 0 ? (
            <EmptyState title="Sin acudientes vinculados" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Parentesco</Th>
                <Th>Principal</Th>
              </Thead>
              <Tbody>
                {acudientes.map((vinculo) => (
                  <tr key={vinculo.acudiente.id}>
                    <Td>{vinculo.acudiente.profile.full_name}</Td>
                    <Td>{vinculo.parentesco ?? "—"}</Td>
                    <Td>{vinculo.es_acudiente_principal ? "Sí" : "No"}</Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Vincular acudiente</h3>
            <form action={vincularAcudienteAction} className="space-y-4">
              <input type="hidden" name="estudiante_id" value={id} />
              <Field label="Acudiente" htmlFor="acudiente_id">
                <Select id="acudiente_id" name="acudiente_id" required defaultValue="">
                  <option value="" disabled>
                    Selecciona un acudiente
                  </option>
                  {todosAcudientes.map((acudiente) => (
                    <option key={acudiente.id} value={acudiente.id}>
                      {acudiente.profile.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Parentesco" htmlFor="parentesco">
                <TextInput id="parentesco" name="parentesco" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="es_acudiente_principal" />
                Es acudiente principal
              </label>
              <SubmitButton>Vincular</SubmitButton>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
