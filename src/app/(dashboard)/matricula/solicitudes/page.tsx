import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listSolicitudesAdmision, listProcesosMatricula } from "@/modules/matricula";
import { listGrados, listGrupos } from "@/modules/academico";
import { listAcudientes } from "@/modules/estudiantes";
import { createSolicitudAction, rechazarSolicitudAction, admitirSolicitudAction } from "./actions";

export default async function SolicitudesAdmisionPage() {
  const [solicitudes, procesos, grados, grupos, acudientes] = await Promise.all([
    listSolicitudesAdmision(),
    listProcesosMatricula(),
    listGrados(),
    listGrupos(),
    listAcudientes(),
  ]);

  const pendientes = solicitudes.filter((solicitud) => solicitud.estado === "pendiente");

  return (
    <>
      <Header title="Solicitudes de admisión" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {solicitudes.length === 0 ? (
            <EmptyState title="Aún no hay solicitudes de admisión" />
          ) : (
            <Table>
              <Thead>
                <Th>Aspirante</Th>
                <Th>Grado solicitado</Th>
                <Th>Estado</Th>
                <Th>Acción</Th>
              </Thead>
              <Tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id}>
                    <Td>
                      {solicitud.aspirante_nombres} {solicitud.aspirante_apellidos}
                    </Td>
                    <Td>{solicitud.grado_solicitado?.nombre ?? "—"}</Td>
                    <Td>{solicitud.estado}</Td>
                    <Td>
                      {pendientes.includes(solicitud) && (
                        <div className="flex flex-col gap-2">
                          <form action={admitirSolicitudAction} className="flex items-center gap-2">
                            <input type="hidden" name="solicitud_id" value={solicitud.id} />
                            <Select name="grupo_id" required defaultValue="" className="text-xs">
                              <option value="" disabled>
                                Grupo
                              </option>
                              {grupos.map((grupo) => (
                                <option key={grupo.id} value={grupo.id}>
                                  {grupo.nombre}
                                </option>
                              ))}
                            </Select>
                            <button className="text-sm font-medium text-emerald-700 hover:underline" type="submit">
                              Admitir
                            </button>
                          </form>
                          <form action={rechazarSolicitudAction}>
                            <input type="hidden" name="id" value={solicitud.id} />
                            <button className="text-sm font-medium text-red-600 hover:underline" type="submit">
                              Rechazar
                            </button>
                          </form>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nueva solicitud</h2>
          <form action={createSolicitudAction} className="space-y-4">
            <Field label="Proceso de matrícula" htmlFor="proceso_matricula_id">
              <Select id="proceso_matricula_id" name="proceso_matricula_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona un proceso
                </option>
                {procesos.map((proceso) => (
                  <option key={proceso.id} value={proceso.id}>
                    {proceso.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombres del aspirante" htmlFor="aspirante_nombres">
              <TextInput id="aspirante_nombres" name="aspirante_nombres" required />
            </Field>
            <Field label="Apellidos del aspirante" htmlFor="aspirante_apellidos">
              <TextInput id="aspirante_apellidos" name="aspirante_apellidos" required />
            </Field>
            <Field label="Documento" htmlFor="aspirante_documento">
              <TextInput id="aspirante_documento" name="aspirante_documento" />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
              <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
            </Field>
            <Field label="Grado solicitado" htmlFor="grado_solicitado_id">
              <Select id="grado_solicitado_id" name="grado_solicitado_id" defaultValue="">
                <option value="">Sin especificar</option>
                {grados.map((grado) => (
                  <option key={grado.id} value={grado.id}>
                    {grado.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Acudiente" htmlFor="acudiente_id">
              <Select id="acudiente_id" name="acudiente_id" defaultValue="">
                <option value="">Sin especificar</option>
                {acudientes.map((acudiente) => (
                  <option key={acudiente.id} value={acudiente.id}>
                    {acudiente.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton>Crear solicitud</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
