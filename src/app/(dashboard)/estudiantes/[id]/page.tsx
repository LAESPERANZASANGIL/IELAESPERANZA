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
import {
  vincularAcudienteAction,
  createMatriculaDirectaAction,
  retirarMatriculaAction,
  updateEstudianteAction,
} from "./actions";

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
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Datos del estudiante</h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <form action={updateEstudianteAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <Field label="Nombres" htmlFor="nombres">
                <TextInput id="nombres" name="nombres" defaultValue={estudiante.nombres} required />
              </Field>
              <Field label="Apellidos" htmlFor="apellidos">
                <TextInput id="apellidos" name="apellidos" defaultValue={estudiante.apellidos} required />
              </Field>
              <Field label="Tipo de documento" htmlFor="documento_tipo">
                <TextInput id="documento_tipo" name="documento_tipo" defaultValue={estudiante.documento_tipo ?? ""} />
              </Field>
              <Field label="Número de documento" htmlFor="documento_numero">
                <TextInput id="documento_numero" name="documento_numero" defaultValue={estudiante.documento_numero ?? ""} />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
                <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" defaultValue={estudiante.fecha_nacimiento ?? ""} />
              </Field>
              <Field label="Género" htmlFor="genero">
                <TextInput id="genero" name="genero" defaultValue={estudiante.genero ?? ""} />
              </Field>
              <Field label="Estado" htmlFor="estado_general">
                <Select id="estado_general" name="estado_general" defaultValue={estudiante.estado_general}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="graduado">Graduado</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton>Guardar cambios</SubmitButton>
              </div>
            </form>
          </div>
        </section>

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
