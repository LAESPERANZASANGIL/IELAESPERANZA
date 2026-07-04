import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { listEstudiantesConAsistencia, estadosAsistencia, getResumenAsistenciaGrupo } from "@/modules/asistencia";
import { requireProfile } from "@/lib/auth/session";
import { registrarAsistenciaAction } from "./actions";

const ESTADO_LABEL: Record<string, string> = {
  presente: "Presente",
  ausente: "Ausente",
  tarde: "Tarde",
  excusa: "Excusa",
};

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string; grupo_id?: string; fecha?: string; vista?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const puedeRegistrar = ["rector", "administrador", "secretaria", "docente"].includes(profile.role);

  const anios = await listAniosLectivos();
  const anioLectivoId = params.anio_lectivo_id || anios.find((a) => a.estado === "activo")?.id || anios[0]?.id;

  const grupos = anioLectivoId ? await listGrupos({ anio_lectivo_id: anioLectivoId }) : [];
  const grupoId = params.grupo_id || grupos[0]?.id;

  const hoy = new Date().toISOString().slice(0, 10);
  const fecha = params.fecha || hoy;
  const vista = params.vista || "registro";

  const filas = grupoId && anioLectivoId ? await listEstudiantesConAsistencia(grupoId, anioLectivoId, fecha) : [];
  const historial =
    vista === "historial" && grupoId && anioLectivoId
      ? await getResumenAsistenciaGrupo(grupoId, anioLectivoId)
      : [];

  return (
    <>
      <Header title="Asistencia" />
      <main className="space-y-6 p-6">
        {/* Filtros */}
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
              <option value="">Selecciona un curso</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha" htmlFor="fecha">
            <TextInput id="fecha" name="fecha" type="date" defaultValue={fecha} />
          </Field>
          <Field label="Vista" htmlFor="vista">
            <Select id="vista" name="vista" defaultValue={vista}>
              <option value="registro">Registro del día</option>
              <option value="historial">Historial</option>
            </Select>
          </Field>
          <div className="sm:col-span-4">
            <SubmitButton>Consultar</SubmitButton>
          </div>
        </form>

        {!grupoId ? (
          <EmptyState title="Selecciona un curso para ver la asistencia" />
        ) : vista === "historial" ? (
          historial.length === 0 ? (
            <EmptyState title="Sin registros de asistencia para este curso" />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <Thead>
                  <Th>Fecha</Th>
                  <Th>Presentes</Th>
                  <Th>Ausentes</Th>
                  <Th>Tarde</Th>
                  <Th>Excusa</Th>
                  <Th>Total</Th>
                </Thead>
                <Tbody>
                  {historial.map(({ fecha: f, resumen }) => (
                    <tr key={f}>
                      <Td>{f}</Td>
                      <Td>
                        <span className="font-medium text-green-700">{resumen.presente}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-red-600">{resumen.ausente}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-yellow-600">{resumen.tarde}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-blue-600">{resumen.excusa}</span>
                      </Td>
                      <Td>{resumen.total}</Td>
                    </tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )
        ) : filas.length === 0 ? (
          <EmptyState title="Este curso no tiene estudiantes matriculados activos" />
        ) : (
          <form action={registrarAsistenciaAction}>
            <input type="hidden" name="grupo_id" value={grupoId} />
            <input type="hidden" name="anio_lectivo_id" value={anioLectivoId} />
            <input type="hidden" name="fecha" value={fecha} />

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {filas.length} estudiante{filas.length !== 1 ? "s" : ""} · {fecha}
                {filas.some((f) => f.asistencia) && (
                  <span className="ml-2 text-green-700 font-medium">· Registrada</span>
                )}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <Thead>
                  <Th>Estudiante</Th>
                  {estadosAsistencia.map((e) => (
                    <Th key={e}>{ESTADO_LABEL[e]}</Th>
                  ))}
                  <Th>Observación</Th>
                </Thead>
                <Tbody>
                  {filas.map(({ matricula_id, estudiante, asistencia }) => {
                    const estadoActual = asistencia?.estado ?? "presente";
                    return (
                      <tr key={matricula_id}>
                        <Td>
                          <span className="font-medium text-slate-900">
                            {estudiante.apellidos}, {estudiante.nombres}
                          </span>
                        </Td>
                        {estadosAsistencia.map((e) => (
                          <Td key={e}>
                            <input
                              type="radio"
                              name={`estado__${matricula_id}`}
                              value={e}
                              defaultChecked={estadoActual === e}
                              disabled={!puedeRegistrar}
                              className="h-4 w-4 accent-brand-600"
                            />
                          </Td>
                        ))}
                        <Td>
                          <TextInput
                            name={`obs__${matricula_id}`}
                            defaultValue={asistencia?.observacion ?? ""}
                            placeholder="Opcional"
                            disabled={!puedeRegistrar}
                            className="w-40 text-xs"
                          />
                        </Td>
                      </tr>
                    );
                  })}
                </Tbody>
              </Table>
            </div>

            {puedeRegistrar && (
              <div className="mt-4">
                <SubmitButton>Guardar asistencia</SubmitButton>
              </div>
            )}
          </form>
        )}
      </main>
    </>
  );
}
