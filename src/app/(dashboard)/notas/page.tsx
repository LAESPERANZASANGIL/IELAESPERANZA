import { Header } from "@/components/layout/Header";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listMallaCurricular, listPeriodos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { listPlanilla } from "@/modules/calificaciones";
import { requireProfile } from "@/lib/auth/session";
import { guardarNotasAction, crearActividadAction, editarActividadAction, eliminarActividadAction } from "./actions";

// Colores por desempeño, como la planilla institucional:
// SUP (4.6-5.0) verde · ALTO (4.0-4.5) azul · BÁSICO (3.0-3.9) amarillo · BAJO (<3.0) magenta
function colorNota(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  if (valor >= 4.6) return "bg-green-200";
  if (valor >= 4.0) return "bg-sky-200";
  if (valor >= 3.0) return "bg-yellow-200";
  return "bg-fuchsia-200";
}

const DES_BADGE: Record<string, string> = {
  Superior: "bg-green-200 text-green-900",
  Alto: "bg-sky-200 text-sky-900",
  Básico: "bg-yellow-200 text-yellow-900",
  Bajo: "bg-fuchsia-200 text-fuchsia-900",
};

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string; grupo_id?: string; malla_curricular_id?: string; periodo_academico_id?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const esAdmin = ["rector", "administrador", "secretaria"].includes(profile.role);
  const esDocente = profile.role === "docente";

  // Solo el admin y los docentes pueden entrar a la planilla
  if (!esAdmin && !esDocente) {
    return (
      <>
        <Header title="Planilla de calificaciones" />
        <main className="p-6">
          <EmptyState
            title="Acceso restringido"
            description="La planilla de calificaciones solo está disponible para la administración y los docentes. Consulta tus calificaciones en el módulo de Boletines."
          />
        </main>
      </>
    );
  }

  const anios = await listAniosLectivos();
  const anioLectivoId = params.anio_lectivo_id || anios.find((a) => a.estado === "activo")?.id || anios[0]?.id;

  const [grupos, periodos] = await Promise.all([
    anioLectivoId ? listGrupos({ anio_lectivo_id: anioLectivoId }) : Promise.resolve([]),
    anioLectivoId ? listPeriodos(anioLectivoId) : Promise.resolve([]),
  ]);

  const grupoId = params.grupo_id || grupos[0]?.id;
  const todasMallas = grupoId ? await listMallaCurricular(grupoId) : [];
  // El docente solo ve las asignaturas que tiene asignadas
  const mallas = esDocente ? todasMallas.filter((m) => m.docente_id === profile.id) : todasMallas;
  const mallaCurricularId = params.malla_curricular_id && mallas.some((m) => m.id === params.malla_curricular_id)
    ? params.malla_curricular_id
    : mallas[0]?.id;
  const periodoAcademicoId = params.periodo_academico_id || periodos.find((p) => p.estado === "activo")?.id || periodos[0]?.id;

  const mallaSeleccionada = mallas.find((m) => m.id === mallaCurricularId);
  const esDocenteAsignado = esDocente && mallaSeleccionada?.docente_id === profile.id;
  const puedeRegistrarNotas = esDocenteAsignado || ["rector", "administrador"].includes(profile.role);

  const planilla = mallaCurricularId && periodoAcademicoId ? await listPlanilla(mallaCurricularId, periodoAcademicoId) : null;

  // Promedio por actividad (fila de totales al pie, como la planilla)
  const promediosPorActividad = new Map<string, number>();
  if (planilla) {
    for (const actividad of planilla.actividades) {
      const valores = planilla.estudiantes
        .map((f) => f.notas.find((n) => n.actividad_id === actividad.id)?.valor)
        .filter((v): v is number => v !== undefined && v !== null);
      if (valores.length > 0) {
        promediosPorActividad.set(actividad.id, Math.round((valores.reduce((a, v) => a + v, 0) / valores.length) * 100) / 100);
      }
    }
  }
  const promediosFilas = (planilla?.estudiantes ?? []).map((f) => f.promedio).filter((p): p is number => p !== null);
  const promedioGrupo = promediosFilas.length > 0
    ? Math.round((promediosFilas.reduce((a, p) => a + p, 0) / promediosFilas.length) * 100) / 100
    : null;

  return (
    <>
      <Header title="Planilla de calificaciones" />
      <main className="space-y-6 p-6">
        {/* Barra de selección estilo planilla */}
        <form method="get" className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" defaultValue={anioLectivoId ?? ""}>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>{anio.anio}</option>
                ))}
              </Select>
            </Field>
            <Field label="Curso" htmlFor="grupo_id">
              <Select id="grupo_id" name="grupo_id" defaultValue={grupoId ?? ""}>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                ))}
              </Select>
            </Field>
            <Field label="Asignatura" htmlFor="malla_curricular_id">
              <Select id="malla_curricular_id" name="malla_curricular_id" defaultValue={mallaCurricularId ?? ""}>
                {mallas.map((malla) => (
                  <option key={malla.id} value={malla.id}>{malla.asignatura.nombre}</option>
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
          </div>
          <div className="mt-4 flex items-center gap-4">
            <SubmitButton>Ver planilla</SubmitButton>
            {/* Convenciones de color */}
            <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-green-200 px-2 py-0.5 font-medium text-green-900">SUP 4.6-5.0</span>
              <span className="rounded bg-sky-200 px-2 py-0.5 font-medium text-sky-900">ALTO 4.0-4.5</span>
              <span className="rounded bg-yellow-200 px-2 py-0.5 font-medium text-yellow-900">BÁSICO 3.0-3.9</span>
              <span className="rounded bg-fuchsia-200 px-2 py-0.5 font-medium text-fuchsia-900">BAJO &lt;3.0</span>
            </div>
          </div>
        </form>

        {esDocente && mallas.length === 0 && (
          <EmptyState
            title="No tienes asignaturas asignadas en este curso"
            description="Solo puedes ver las planillas de las asignaturas que tienes asignadas en la malla curricular."
          />
        )}

        {!planilla ? (
          mallas.length > 0 && (
            <EmptyState
              title="Selecciona curso, asignatura y periodo"
              description="Define grados, cursos, asignaturas y periodos antes de registrar notas."
            />
          )
        ) : planilla.estudiantes.length === 0 ? (
          <EmptyState title="Este curso no tiene estudiantes matriculados en este año lectivo" />
        ) : (
          <>
            {esAdmin && (
              <details className="rounded-xl border border-slate-200 bg-white">
                <summary className="cursor-pointer px-5 py-3 text-sm font-semibold text-slate-900">
                  ⚙️ Actividades de evaluación (configuración)
                </summary>
                <div className="border-t border-slate-100 p-5">
                  <p className="mb-4 text-sm text-slate-500">
                    Configura las asignaciones (ej. Parciales, Quiz, Autoevaluación, Bimestral) y su peso porcentual.
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
                  <ActionForm action={crearActividadAction} className="grid gap-4 sm:grid-cols-5">
                    <input type="hidden" name="malla_curricular_id" value={mallaCurricularId} />
                    <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />
                    <Field label="Nombre" htmlFor="nombre">
                      <TextInput id="nombre" name="nombre" placeholder="Ej. Quiz" required />
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
              </details>
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
                description="El Rector, el Administrador o la Secretaría deben configurar al menos una actividad antes de registrar notas."
              />
            ) : (
              <ActionForm action={guardarNotasAction}>
                <input type="hidden" name="malla_curricular_id" value={mallaCurricularId} />
                <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />

                {/* Encabezado de planilla */}
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-t-xl px-5 py-3 text-white" style={{ background: "#1E4E8C" }}>
                  <p className="text-sm font-bold uppercase">
                    {planilla.malla.asignatura.nombre}
                  </p>
                  <p className="text-xs text-blue-100">
                    {grupos.find((g) => g.id === grupoId)?.nombre} · {planilla.periodo.nombre}
                  </p>
                  {puedeRegistrarNotas && planilla.periodo.estado !== "cerrado" && (
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        name="motivo"
                        placeholder="Motivo del cambio (auditoría)"
                        className="rounded px-2 py-1 text-xs text-slate-900"
                      />
                      <SubmitButton>💾 Guardar cambios</SubmitButton>
                    </div>
                  )}
                </div>

                {/* Tabla tipo hoja de cálculo */}
                <div className="overflow-x-auto rounded-b-xl border border-slate-300">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-white" style={{ background: "#1E4E8C" }}>
                        <th className="sticky left-0 border border-slate-400 px-3 py-2 text-left" style={{ background: "#1E4E8C" }}>
                          # Nombre
                        </th>
                        {planilla.actividades.map((actividad, i) => (
                          <th key={actividad.id} className="border border-slate-400 px-2 py-2 text-center whitespace-nowrap">
                            {i + 1}. {actividad.nombre}
                            <span className="block text-[10px] font-normal text-blue-200">({actividad.peso_porcentual}%)</span>
                          </th>
                        ))}
                        <th className="border border-slate-400 px-2 py-2 text-center">Acumulado</th>
                        <th className="border border-slate-400 px-2 py-2 text-center">Desempeño</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planilla.estudiantes.map((fila, idx) => {
                        const notaPorActividad = new Map(fila.notas.map((n) => [n.actividad_id, n.valor]));
                        return (
                          <tr key={fila.matricula_id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                            <td className="sticky left-0 border border-slate-300 bg-inherit px-3 py-1.5 font-medium whitespace-nowrap uppercase text-slate-900">
                              <span className="mr-2 text-slate-400">{idx + 1}.</span>
                              {fila.estudiante.apellidos} {fila.estudiante.nombres}
                            </td>
                            {planilla.actividades.map((actividad) => {
                              const valor = notaPorActividad.get(actividad.id);
                              return (
                                <td key={actividad.id} className={`border border-slate-300 px-1 py-1 text-center ${colorNota(valor)}`}>
                                  {puedeRegistrarNotas && planilla.periodo.estado !== "cerrado" ? (
                                    <input
                                      type="number"
                                      step="0.1"
                                      min={0}
                                      max={5}
                                      name={`nota__${fila.matricula_id}__${actividad.id}`}
                                      defaultValue={valor ?? ""}
                                      className="w-16 rounded border border-slate-300 bg-white/70 px-1 py-0.5 text-center text-sm font-semibold focus:border-brand-500 focus:outline-none"
                                    />
                                  ) : (
                                    <span className="font-semibold">{valor?.toFixed(1) ?? "—"}</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className={`border border-slate-300 px-2 py-1 text-center font-bold ${colorNota(fila.promedio)}`}>
                              {fila.promedio?.toFixed(1) ?? "—"}
                            </td>
                            <td className="border border-slate-300 px-2 py-1 text-center">
                              {fila.desempeno ? (
                                <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase ${DES_BADGE[fila.desempeno] ?? ""}`}>
                                  {fila.desempeno}
                                </span>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-200 font-bold">
                        <td className="sticky left-0 border border-slate-300 bg-slate-200 px-3 py-1.5 text-xs uppercase text-slate-600">
                          Promedio del grupo
                        </td>
                        {planilla.actividades.map((actividad) => (
                          <td key={actividad.id} className="border border-slate-300 px-2 py-1.5 text-center text-sm">
                            {promediosPorActividad.get(actividad.id)?.toFixed(2) ?? "—"}
                          </td>
                        ))}
                        <td className="border border-slate-300 px-2 py-1.5 text-center text-sm">
                          {promedioGrupo?.toFixed(2) ?? "—"}
                        </td>
                        <td className="border border-slate-300" />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {!puedeRegistrarNotas && esDocente && (
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
