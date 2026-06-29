import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listMallaCurricular, listPeriodos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { listPlanilla, calcularPromedio, calcularDesempeno } from "@/modules/calificaciones";
import { guardarNotasAction, createTipoEvaluacionAction } from "./actions";

export default async function NotasPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string; grupo_id?: string; malla_curricular_id?: string; periodo_academico_id?: string }>;
}) {
  const params = await searchParams;
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
                  {periodo.nombre}
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
        ) : planilla.periodo.estado === "cerrado" ? (
          <EmptyState
            title="Este periodo está cerrado"
            description="No se pueden registrar ni modificar notas de un periodo cerrado."
          />
        ) : planilla.estudiantes.length === 0 ? (
          <EmptyState title="Este curso no tiene estudiantes matriculados en este año lectivo" />
        ) : planilla.tiposEvaluacion.length === 0 ? (
          <div className="max-w-md rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Crea un tipo de evaluación</h2>
            <p className="mb-4 text-sm text-slate-500">
              Aún no hay tipos de evaluación (ej. Talleres, Examen). Crea al menos uno antes de registrar notas.
            </p>
            <form action={createTipoEvaluacionAction} className="space-y-4">
              <Field label="Nombre" htmlFor="nombre">
                <TextInput id="nombre" name="nombre" required />
              </Field>
              <Field label="Peso porcentual (opcional)" htmlFor="peso_porcentual">
                <TextInput id="peso_porcentual" name="peso_porcentual" type="number" min={0} max={100} />
              </Field>
              <SubmitButton>Crear tipo de evaluación</SubmitButton>
            </form>
          </div>
        ) : (
          <form action={guardarNotasAction}>
            <input type="hidden" name="malla_curricular_id" value={mallaCurricularId} />
            <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />
            <Table>
              <Thead>
                <Th>Estudiante</Th>
                {planilla.tiposEvaluacion.map((tipo) => (
                  <Th key={tipo.id}>
                    {tipo.nombre}
                    {tipo.peso_porcentual ? ` (${tipo.peso_porcentual}%)` : ""}
                  </Th>
                ))}
                <Th>Promedio</Th>
                <Th>Desempeño</Th>
              </Thead>
              <Tbody>
                {planilla.estudiantes.map((fila) => {
                  const promedio = calcularPromedio(fila.notas, planilla.tiposEvaluacion);
                  const notaPorTipo = new Map(fila.notas.map((n) => [n.tipo_evaluacion_id, n.valor]));
                  return (
                    <tr key={fila.matricula_id}>
                      <Td>
                        {fila.estudiante.apellidos} {fila.estudiante.nombres}
                      </Td>
                      {planilla.tiposEvaluacion.map((tipo) => (
                        <Td key={tipo.id}>
                          <TextInput
                            type="number"
                            step="0.1"
                            min={0}
                            max={5}
                            name={`nota__${fila.matricula_id}__${tipo.id}`}
                            defaultValue={notaPorTipo.get(tipo.id) ?? ""}
                            className="w-20"
                          />
                        </Td>
                      ))}
                      <Td>{promedio ?? "—"}</Td>
                      <Td>{promedio === null ? "—" : calcularDesempeno(promedio)}</Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
            <div className="mt-4">
              <SubmitButton>Guardar notas</SubmitButton>
            </div>
          </form>
        )}
      </main>
    </>
  );
}
