import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { listDocentesPaginado, docenteFiltrosSchema } from "@/modules/academico";

export default async function DocentesPage({
  searchParams,
}: {
  searchParams: Promise<{
    documento?: string;
    nombre?: string;
    especialidad?: string;
    correo?: string;
    estado?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const filtros = docenteFiltrosSchema.parse({
    documento: params.documento || undefined,
    nombre: params.nombre || undefined,
    especialidad: params.especialidad || undefined,
    correo: params.correo || undefined,
    estado: params.estado === "activo" || params.estado === "inactivo" ? params.estado : undefined,
    page: params.page || 1,
  });

  const { docentes, total, page, pageSize } = await listDocentesPaginado(filtros);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildQuery(targetPage: number) {
    const query = new URLSearchParams();
    if (filtros.documento) query.set("documento", filtros.documento);
    if (filtros.nombre) query.set("nombre", filtros.nombre);
    if (filtros.especialidad) query.set("especialidad", filtros.especialidad);
    if (filtros.correo) query.set("correo", filtros.correo);
    if (filtros.estado) query.set("estado", filtros.estado);
    query.set("page", String(targetPage));
    return `/docentes?${query.toString()}`;
  }

  return (
    <>
      <Header title="Docentes" />
      <main className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{total} docente{total === 1 ? "" : "s"} registrado{total === 1 ? "" : "s"}</p>
          <Link
            href="/docentes/nuevo"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Crear docente
          </Link>
        </div>

        <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Documento" htmlFor="documento">
            <TextInput id="documento" name="documento" defaultValue={filtros.documento} />
          </Field>
          <Field label="Nombre" htmlFor="nombre">
            <TextInput id="nombre" name="nombre" defaultValue={filtros.nombre} />
          </Field>
          <Field label="Especialidad" htmlFor="especialidad">
            <TextInput id="especialidad" name="especialidad" defaultValue={filtros.especialidad} />
          </Field>
          <Field label="Correo" htmlFor="correo">
            <TextInput id="correo" name="correo" defaultValue={filtros.correo} />
          </Field>
          <Field label="Estado" htmlFor="estado">
            <Select id="estado" name="estado" defaultValue={filtros.estado ?? ""}>
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </Select>
          </Field>
          <div className="flex items-end lg:col-span-5">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Buscar
            </button>
          </div>
        </form>

        {docentes.length === 0 ? (
          <EmptyState
            title="No se encontraron docentes"
            description="Ajusta los filtros de búsqueda o crea un nuevo docente."
          />
        ) : (
          <>
            <Table>
              <Thead>
                <Th>Documento</Th>
                <Th>Nombre</Th>
                <Th>Especialidad</Th>
                <Th>Correo</Th>
                <Th>Estado</Th>
              </Thead>
              <Tbody>
                {docentes.map((docente) => (
                  <tr key={docente.id}>
                    <Td>{docente.profile.documento_numero ?? "—"}</Td>
                    <Td>
                      <Link className="font-medium text-brand-700 hover:underline" href={`/docentes/${docente.id}`}>
                        {docente.profile.full_name}
                      </Link>
                    </Td>
                    <Td>{docente.especialidad ?? "—"}</Td>
                    <Td>{docente.profile.email}</Td>
                    <Td>
                      <Badge color={docente.profile.is_active ? "green" : "red"}>
                        {docente.profile.is_active ? "Activo" : "Inactivo"}
                      </Badge>
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
