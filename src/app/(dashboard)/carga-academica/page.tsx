import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import {
  listMallaCurricularPaginado,
  mallaCurricularFiltrosSchema,
  listGrados,
  listGrupos,
  listAsignaturas,
  listDocentes,
} from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { actualizarEstadoMallaAction, deleteMallaAction } from "./[id]/actions";

export default async function CargaAcademicaPage({
  searchParams,
}: {
  searchParams: Promise<{
    anio_lectivo_id?: string;
    grado_id?: string;
    grupo_id?: string;
    asignatura_id?: string;
    docente_id?: string;
    estado?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;

  const filtros = mallaCurricularFiltrosSchema.parse({
    anio_lectivo_id: params.anio_lectivo_id || undefined,
    grupo_id: params.grupo_id || undefined,
    asignatura_id: params.asignatura_id || undefined,
    docente_id: params.docente_id || undefined,
    estado: params.estado === "activo" || params.estado === "inactivo" ? params.estado : undefined,
    page: params.page || 1,
  });

  const gradoIdFiltro = params.grado_id || undefined;

  const [{ malla, total, page, pageSize }, anios, grados, grupos, asignaturas, docentes] = await Promise.all([
    listMallaCurricularPaginado(filtros),
    listAniosLectivos(),
    listGrados(),
    listGrupos({
      grado_id: gradoIdFiltro,
      anio_lectivo_id: filtros.anio_lectivo_id,
    }),
    listAsignaturas(),
    listDocentes(false),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildQuery(targetPage: number, extra?: Record<string, string>) {
    const query = new URLSearchParams();
    if (filtros.anio_lectivo_id) query.set("anio_lectivo_id", filtros.anio_lectivo_id);
    if (gradoIdFiltro) query.set("grado_id", gradoIdFiltro);
    if (filtros.grupo_id) query.set("grupo_id", filtros.grupo_id);
    if (filtros.asignatura_id) query.set("asignatura_id", filtros.asignatura_id);
    if (filtros.docente_id) query.set("docente_id", filtros.docente_id);
    if (filtros.estado) query.set("estado", filtros.estado);
    query.set("page", String(targetPage));
    if (extra) Object.entries(extra).forEach(([k, v]) => query.set(k, v));
    return `/carga-academica?${query.toString()}`;
  }

  return (
    <>
      <Header title="Carga académica" />
      <main className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {total} asignación{total === 1 ? "" : "es"} registrada{total === 1 ? "" : "s"}
          </p>
          <Link
            href="/carga-academica/nueva"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Nueva asignación
          </Link>
        </div>

        <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Año lectivo" htmlFor="anio_lectivo_id">
            <Select id="anio_lectivo_id" name="anio_lectivo_id" defaultValue={filtros.anio_lectivo_id ?? ""}>
              <option value="">Todos</option>
              {anios.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.anio}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Grado" htmlFor="grado_id">
            <Select id="grado_id" name="grado_id" defaultValue={gradoIdFiltro ?? ""}>
              <option value="">Todos</option>
              {grados.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Curso" htmlFor="grupo_id">
            <Select id="grupo_id" name="grupo_id" defaultValue={filtros.grupo_id ?? ""}>
              <option value="">Todos</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Asignatura" htmlFor="asignatura_id">
            <Select id="asignatura_id" name="asignatura_id" defaultValue={filtros.asignatura_id ?? ""}>
              <option value="">Todas</option>
              {asignaturas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Docente" htmlFor="docente_id">
            <Select id="docente_id" name="docente_id" defaultValue={filtros.docente_id ?? ""}>
              <option value="">Todos</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.profile.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado" htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={filtros.estado ?? ""}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Select>
          </Field>
          <div className="flex items-end lg:col-span-3">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Buscar
            </button>
          </div>
        </form>

        {malla.length === 0 ? (
          <EmptyState
            title="No se encontraron asignaciones"
            description="Ajusta los filtros o crea una nueva asignación de carga académica."
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Curso</Th>
                <Th>Grado</Th>
                <Th>Asignatura</Th>
                <Th>Docente</Th>
                <Th>Intensidad horaria</Th>
                <Th>Estado</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {malla.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.grupo.nombre}</Td>
                    <Td>{item.grupo.grado.nombre}</Td>
                    <Td>{item.asignatura.nombre}</Td>
                    <Td>{item.docente?.profile.full_name ?? "—"}</Td>
                    <Td>{item.intensidad_horaria ?? "—"}</Td>
                    <Td>
                      <Badge color={item.is_active ? "green" : "red"}>
                        {item.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link
                          className="text-sm font-medium text-brand-700 hover:underline"
                          href={`/carga-academica/${item.id}/editar`}
                        >
                          Editar
                        </Link>
                        <ActionForm action={actualizarEstadoMallaAction} className="inline">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="is_active" value={(!item.is_active).toString()} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            {item.is_active ? "Desactivar" : "Activar"}
                          </button>
                        </ActionForm>
                        {!item.is_active && (
                          <ActionForm
                            action={deleteMallaAction}
                            confirmMessage="¿Eliminar esta asignación? Esta acción no se puede deshacer."
                            className="inline"
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <button className="text-sm font-medium text-red-600 hover:underline" type="submit">
                              Eliminar
                            </button>
                          </ActionForm>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>

            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2">
                <Link
                  href={buildQuery(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium ${
                    page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Anterior
                </Link>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={buildQuery(p)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      p === page
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                <Link
                  href={buildQuery(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={`rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium ${
                    page >= totalPages ? "pointer-events-none text-slate-300" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Siguiente
                </Link>
              </nav>
            )}
          </>
        )}
      </main>
    </>
  );
}
