import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listGrados, listMallaCurricular, listPeriodos } from "@/modules/academico";
import { listMatriculasDeGrupo, listNotas, listTiposEvaluacion } from "@/modules/notas";
import { createNotaAction, deleteNotaAction } from "./actions";

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string; malla?: string; periodo?: string }>;
}) {
  const { grupo: grupoId, malla: mallaId, periodo: periodoId } = await searchParams;

  const [grupos, grados, periodos, tiposEvaluacion] = await Promise.all([
    listGrupos(),
    listGrados(),
    listPeriodos(),
    listTiposEvaluacion(),
  ]);
  const gradoPorId = new Map(grados.map((grado) => [grado.id, grado.nombre]));

  const malla = grupoId ? await listMallaCurricular(grupoId) : [];
  const seleccionCompleta = Boolean(grupoId && mallaId && periodoId);

  const [matriculas, notas] = seleccionCompleta
    ? await Promise.all([
        listMatriculasDeGrupo(grupoId!),
        listNotas({ malla_curricular_id: mallaId!, periodo_academico_id: periodoId! }),
      ])
    : [[], []];

  const notasPorMatricula = new Map<string, typeof notas>();
  for (const nota of notas) {
    const lista = notasPorMatricula.get(nota.matricula_id) ?? [];
    lista.push(nota);
    notasPorMatricula.set(nota.matricula_id, lista);
  }
  const tipoPorId = new Map(tiposEvaluacion.map((tipo) => [tipo.id, tipo.nombre]));

  return (
    <>
      <Header title="Notas" />
      <main className="space-y-6 p-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Selecciona curso, asignatura y periodo</h2>
          <form method="get" className="grid gap-4 sm:grid-cols-4">
            <Field label="Curso" htmlFor="grupo">
              <Select id="grupo" name="grupo" required defaultValue={grupoId ?? ""}>
                <option value="" disabled>
                  Selecciona un curso
                </option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {gradoPorId.get(grupo.grado_id) ?? ""} — {grupo.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Asignatura" htmlFor="malla">
              <Select id="malla" name="malla" defaultValue={mallaId ?? ""} disabled={!grupoId}>
                <option value="" disabled>
                  {grupoId ? "Selecciona una asignatura" : "Primero elige un curso"}
                </option>
                {malla.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.asignatura.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Periodo" htmlFor="periodo">
              <Select id="periodo" name="periodo" defaultValue={periodoId ?? ""}>
                <option value="" disabled>
                  Selecciona un periodo
                </option>
                {periodos.map((periodo) => (
                  <option key={periodo.id} value={periodo.id}>
                    {periodo.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <button
                className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                type="submit"
              >
                Consultar
              </button>
            </div>
          </form>
        </section>

        {!seleccionCompleta ? (
          <EmptyState
            title="Elige un curso, una asignatura y un periodo"
            description="Después de consultar podrás registrar y revisar las calificaciones de cada estudiante."
          />
        ) : matriculas.length === 0 ? (
          <EmptyState title="No hay estudiantes matriculados en este curso" />
        ) : (
          <Table>
            <Thead>
              <Th>Estudiante</Th>
              <Th>Notas del periodo</Th>
              <Th>Promedio</Th>
              <Th>Registrar nota</Th>
            </Thead>
            <Tbody>
              {matriculas.map((matricula) => {
                const notasEstudiante = notasPorMatricula.get(matricula.id) ?? [];
                const promedio =
                  notasEstudiante.length > 0
                    ? notasEstudiante.reduce((suma, nota) => suma + Number(nota.valor), 0) / notasEstudiante.length
                    : null;
                return (
                  <tr key={matricula.id}>
                    <Td>
                      {matricula.estudiante.apellidos} {matricula.estudiante.nombres}
                    </Td>
                    <Td>
                      {notasEstudiante.length === 0 ? (
                        <span className="text-slate-400">Sin notas</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {notasEstudiante.map((nota) => (
                            <span
                              key={nota.id}
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                              title={[
                                nota.tipo_evaluacion_id ? tipoPorId.get(nota.tipo_evaluacion_id) : null,
                                nota.descripcion,
                              ]
                                .filter(Boolean)
                                .join(" — ")}
                            >
                              <strong>{Number(nota.valor).toFixed(1)}</strong>
                              {nota.descripcion ? <span className="text-slate-500">{nota.descripcion}</span> : null}
                              <ActionForm
                                action={deleteNotaAction}
                                confirmMessage="¿Eliminar esta nota?"
                                className="inline"
                              >
                                <input type="hidden" name="id" value={nota.id} />
                                <button className="font-medium text-red-600 hover:underline" type="submit">
                                  ×
                                </button>
                              </ActionForm>
                            </span>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {promedio === null ? (
                        "—"
                      ) : (
                        <span className={promedio < 3 ? "font-semibold text-red-600" : "font-semibold text-emerald-700"}>
                          {promedio.toFixed(1)}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <ActionForm action={createNotaAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="matricula_id" value={matricula.id} />
                        <input type="hidden" name="malla_curricular_id" value={mallaId} />
                        <input type="hidden" name="periodo_academico_id" value={periodoId} />
                        <TextInput
                          name="valor"
                          type="number"
                          step="0.1"
                          min={0}
                          max={5}
                          required
                          placeholder="0.0"
                          className="w-20"
                          aria-label="Valor de la nota"
                        />
                        {tiposEvaluacion.length > 0 && (
                          <Select name="tipo_evaluacion_id" defaultValue="" className="w-36" aria-label="Tipo de evaluación">
                            <option value="">Sin tipo</option>
                            {tiposEvaluacion.map((tipo) => (
                              <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                              </option>
                            ))}
                          </Select>
                        )}
                        <TextInput
                          name="descripcion"
                          placeholder="Descripción (opcional)"
                          className="w-44"
                          aria-label="Descripción de la nota"
                        />
                        <button
                          className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                          type="submit"
                        >
                          Guardar
                        </button>
                      </ActionForm>
                    </Td>
                  </tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </main>
    </>
  );
}
