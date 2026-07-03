import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listMallaCurricular, listPeriodos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { listPlanilla } from "@/modules/calificaciones";
import { requireProfile } from "@/lib/auth/session";
import { guardarNotasAction, crearActividadAction, editarActividadAction, eliminarActividadAction } from "./actions";

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string; grupo_id?: string; malla_curricular_id?: string; periodo_academico_id?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const esConfigurador = ["rector", "administrador", "secretaria"].includes(profile.role);

  const anios = await listAniosLectivos();
  const anioLectivoId = params.anio_lectivo_id || anios.find((a) => a.estado === "activo")?.id || anios[0]?.id;

  const [grupos, periodos] = await Promise.all([
    anioLectivoId ? listGrupos({ anio_lectivo_id: anioLectivoId }) : Promise.resolve([]),
    anioLectivoId ? listPeriodos(anioLectivoId) : Promise.resolve([]),
  ]);

  const grupoId = params.grupo_id || grupos[0]?.id;
  const mallas = grupoId ? await listMallaCurricular(grupoId) : [];
  const mallaCurricularId = params.malla_curricular_id || mallas[0]?.id;
  const periodoAcademicoId = params.periodo_academico_id || periodos.find((p) => p.estado === "activo")?.id || periodos[0]?.id;

  const mallaSeleccionada = mallas.find((m) => m.id === mallaCurricularId);
  const esDocenteAsignado = profile.role === "docente" && mallaSeleccionada?.docente_id === profile.id;
  const puedeRegistrarNotas = esDocenteAsignado;

  const planilla = mallaCurricularId && periodoAcademicoId ? await listPlanilla(mallaCurricularId, periodoAcademicoId) : null;

  return (
    <>
      <Header title="Notas" />
      <main className="space-y-6 p-6">
        <form method="get" className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
          <Field label="Año lectivo" htmlFor="anio_lectivo_id">
            <Select id="anio_lectivo_id" name="anio_lectivo_id" defaultValue={anioLectivoId ?? ""}>
              {anios.map((anio) => (
                <option key={anio.id} value={anio.id}>
                  {anio.anio}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Curso" htmlFor="grupo_id">
            <Select id="grupo_id" name="grupo_id" defaultValue={grupoId ?? ""}>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asignatura" htmlFor="malla_curricular_id">
            <Select id="malla_curricular_id" name="malla_curricular_id" defaultValue={mallaCurricularId ?? ""}>
              {mallas.map((malla) => (
                <option key={malla.id} value={malla.id}>
                  {malla.asignatura.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periodo" htmlFor="periodo_academico_id">
            <Select id="periodo_academico_id" name="periodo_academico_id" defaultValue={periodoAcademicoId ?? ""}>
              {periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.nombre} {periodo.estado === "cerrado" ? "(cerrado)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-4">
            <SubmitButton>Ver planilla</SubmitButton>
          </div>
        </form>

        {!planilla ? (
          <EmptyState
            title="Selecciona curso, asignatura y periodo"
            description="Define grados, cursos, asignaturas y periodos antes de registrar notas."
          />
        ) : planilla.estudiantes.length === 0 ? (
          <EmptyState title="Este curso no tiene estudiantes matriculados en este año lectivo" />
        ) : (
          <>
            {esConfigurador && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-slate-900">
                  Actividades de evaluación de esta asignatura y periodo
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Configura aquí las actividades (ej. Talleres, Examen, Recuperación) y su peso porcentual antes de
                  que el docente registre notas. Los pesos no necesitan sumar exactamente 100, pero se recomienda.
                </p>
                {planilla.actividades.length > 0 && (
                  <div className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    {planilla.actividades.map((actividad) => (
                      <ActionForm key={actividad.id} action={editarActividadAction} className="grid gap-3 p-3 sm:grid-cols-5 bg-white hover:bg-slate-50">
                        <input type="hidden" name="id" value={actividad.id} />
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
                          <TextInput name="nombre" defaultValue={actividad.nombre} required className="text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Peso %</label>
                          <TextInput name="peso_porcentual" type="number" min={0} max={100} defaultValue={actividad.peso_porcentual} required className="text-sm" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Tipo</label>
                          <Select name="tipo" defaultValue={actividad.tipo}>
                            <option value="normal">Normal</option>
                            <option value="recuperacion">Recuperación</option>
                            <option value="nivelacion">Nivelación</option>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Orden</label>
                          <TextInput name="orden" type="number" defaultValue={actividad.orden} className="text-sm" />
                        </div>
                        <div className="flex items-end gap-2">
                          <SubmitButton>Guardar</SubmitButton>
                          <ActionForm action={eliminarActividadAction} confirmMessage="¿Eliminar esta actividad?" className="inline flex items-end pb-0.5">
                            <input type="hidden" name="id" value={actividad.id} />
                            <button type="submit" className="text-sm font-medium text-red-600 hover:underline">Eliminar</button>
                          </ActionForm>
                        </div>
                      </ActionForm>
                    ))}
                  </div>
                )}
                <ActionForm action={crearActividadAction} className="mt-4 grid gap-4 sm:grid-cols-5">
                  <input type="hidden" name="malla_curricular_id" value={mallaCurricularId} />
                  <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />
                  <Field label="Nombre" htmlFor="nombre">
                    <TextInput id="nombre" name="nombre" required />
                  </Field>
                  <Field label="Peso %" htmlFor="peso_porcentual">
                    <TextInput id="peso_porcentual" name="peso_porcentual" type="number" min={0} max={100} required />
                  </Field>
                  <Field label="Tipo" htmlFor="tipo">
                    <Select id="tipo" name="tipo" defaultValue="normal">
                      <option value="normal">Normal</option>
                      <option value="recuperacion">Recuperación</option>
                      <option value="nivelacion">Nivelación</option>
                    </Select>
                  </Field>
                  <Field label="Orden" htmlFor="orden">
                    <TextInput id="orden" name="orden" type="number" defaultValue={0} />
                  </Field>
                  <div className="flex items-end">
                    <SubmitButton>Agregar actividad</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            )}

            {planilla.periodo.estado === "cerrado" && (
              <EmptyState
                title="Este periodo está cerrado"
                description="No se pueden registrar ni modificar notas. Solo el Rector o el Administrador pueden reabrirlo desde Periodos académicos."
              />
            )}

            {planilla.actividades.length === 0 ? (
              <EmptyState
                title="Aún no hay actividades de evaluación configuradas"
                description="El Rector, el Administrador o la Secretaría deben configurar al menos una actividad antes de que el docente pueda registrar notas."
              />
            ) : (
              <ActionForm action={guardarNotasAction}>
                <input type="hidden" name="malla_curricular_id" value={mallaCurricularId} />
                <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />
                {puedeRegistrarNotas && (
                  <div className="mb-4 max-w-md">
                    <Field label="Motivo del registro/cambio (opcional, queda en la auditoría)" htmlFor="motivo">
                      <TextInput id="motivo" name="motivo" placeholder="Ej. corrección de digitación" />
                    </Field>
                  </div>
                )}
                <Table>
                  <Thead>
                    <Th>Estudiante</Th>
                    {planilla.actividades.map((actividad) => (
                      <Th key={actividad.id}>
                        {actividad.nombre} ({actividad.peso_porcentual}%)
                      </Th>
                    ))}
                    <Th>Promedio</Th>
                    <Th>Desempeño</Th>
                  </Thead>
                  <Tbody>
                    {planilla.estudiantes.map((fila) => {
                      const notaPorActividad = new Map(fila.notas.map((n) => [n.actividad_id, n.valor]));
                      return (
                        <tr key={fila.matricula_id}>
                          <Td>
                            {fila.estudiante.apellidos} {fila.estudiante.nombres}
                          </Td>
                          {planilla.actividades.map((actividad) => (
                            <Td key={actividad.id}>
                              {puedeRegistrarNotas && planilla.periodo.estado !== "cerrado" ? (
                                <TextInput
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  max={5}
                                  name={`nota__${fila.matricula_id}__${actividad.id}`}
                                  defaultValue={notaPorActividad.get(actividad.id) ?? ""}
                                  className="w-20"
                                />
                              ) : (
                                <span>{notaPorActividad.get(actividad.id) ?? "—"}</span>
                              )}
                            </Td>
                          ))}
                          <Td>{fila.promedio ?? "—"}</Td>
                          <Td>{fila.desempeno ?? "—"}</Td>
                        </tr>
                      );
                    })}
                  </Tbody>
                </Table>
                {puedeRegistrarNotas && planilla.periodo.estado !== "cerrado" && (
                  <div className="mt-4">
                    <SubmitButton>Guardar notas</SubmitButton>
                  </div>
                )}
                {!puedeRegistrarNotas && profile.role === "docente" && (
                  <p className="mt-4 text-sm text-slate-500">
                    Solo puedes registrar notas en las asignaturas que tienes asignadas en la malla curricular.
                  </p>
                )}
              </ActionForm>
            )}
          </>
        )}
      </main>
    </>
  );
}
