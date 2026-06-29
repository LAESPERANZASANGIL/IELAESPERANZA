import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrupos, listPeriodos } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { listBoletinesDeGrupo } from "@/modules/calificaciones";
import { generarBoletinAction } from "./actions";

export default async function BoletinesPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string; grupo_id?: string; periodo_academico_id?: string }>;
}) {
  const params = await searchParams;
  const anios = await listAniosLectivos();
  const anioLectivoId = params.anio_lectivo_id || anios.find((a) => a.estado === "activo")?.id || anios[0]?.id;

  const [grupos, periodos] = await Promise.all([
    anioLectivoId ? listGrupos({ anio_lectivo_id: anioLectivoId }) : Promise.resolve([]),
    anioLectivoId ? listPeriodos(anioLectivoId) : Promise.resolve([]),
  ]);

  const grupoId = params.grupo_id || grupos[0]?.id;
  const periodoAcademicoId = params.periodo_academico_id || periodos.find((p) => p.estado === "activo")?.id || periodos[0]?.id;

  const filas = grupoId && anioLectivoId ? await listBoletinesDeGrupo(grupoId, anioLectivoId) : [];

  return (
    <>
      <Header title="Boletines" />
      <main className="space-y-6 p-6">
        <form method="get" className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-3">
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
          <Field label="Periodo" htmlFor="periodo_academico_id">
            <Select id="periodo_academico_id" name="periodo_academico_id" defaultValue={periodoAcademicoId ?? ""}>
              {periodos.map((periodo) => (
                <option key={periodo.id} value={periodo.id}>
                  {periodo.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-3">
            <SubmitButton>Ver curso</SubmitButton>
          </div>
        </form>

        {!grupoId || !periodoAcademicoId ? (
          <EmptyState title="Selecciona un curso y un periodo" />
        ) : filas.length === 0 ? (
          <EmptyState title="Este curso no tiene estudiantes matriculados en este año lectivo" />
        ) : (
          <Table>
            <Thead>
              <Th>Estudiante</Th>
              <Th>Estado</Th>
              <Th>{""}</Th>
            </Thead>
            <Tbody>
              {filas.map((fila) => (
                <tr key={fila.matricula_id}>
                  <Td>
                    {fila.estudiante.apellidos} {fila.estudiante.nombres}
                  </Td>
                  <Td>{fila.boletin ? "Generado" : "Sin generar"}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <ActionForm action={generarBoletinAction} className="inline">
                        <input type="hidden" name="matricula_id" value={fila.matricula_id} />
                        <input type="hidden" name="periodo_academico_id" value={periodoAcademicoId} />
                        <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                          {fila.boletin ? "Regenerar" : "Generar"}
                        </button>
                      </ActionForm>
                      <Link
                        className="text-sm font-medium text-brand-700 hover:underline"
                        href={`/boletines/${fila.matricula_id}/${periodoAcademicoId}`}
                      >
                        Ver
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </main>
    </>
  );
}
