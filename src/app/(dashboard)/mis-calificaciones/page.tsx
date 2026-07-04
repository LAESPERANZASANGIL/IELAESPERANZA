import { Header } from "@/components/layout/Header";
import { Field, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { listPeriodos } from "@/modules/academico";
import { listCalificacionesEstudiante } from "@/modules/calificaciones";

// Colores por valoración: SUP verde · ALTO azul · BÁSICO amarillo · BAJO magenta
function colorNota(valor: number): string {
  if (valor >= 4.6) return "bg-green-200 text-green-900";
  if (valor >= 4.0) return "bg-sky-200 text-sky-900";
  if (valor >= 3.0) return "bg-yellow-200 text-yellow-900";
  return "bg-fuchsia-200 text-fuchsia-900";
}

const DES_BADGE: Record<string, string> = {
  Superior: "bg-green-200 text-green-900",
  Alto: "bg-sky-200 text-sky-900",
  Básico: "bg-yellow-200 text-yellow-900",
  Bajo: "bg-fuchsia-200 text-fuchsia-900",
};

export default async function MisCalificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ estudiante_id?: string; matricula_id?: string; periodo_academico_id?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  // Resuelve los estudiantes visibles para este usuario
  let estudiantes: { id: string; nombres: string; apellidos: string }[] = [];

  if (profile.role === "estudiante") {
    const { data } = await supabase
      .from("estudiantes")
      .select("id, nombres, apellidos")
      .eq("profile_id", profile.id);
    estudiantes = data ?? [];
  } else if (profile.role === "padre_familia") {
    const { data: vinculos } = await supabase
      .from("estudiante_acudientes")
      .select("estudiante:estudiantes(id, nombres, apellidos)")
      .eq("acudiente_id", profile.id);
    estudiantes = (vinculos ?? [])
      .map((v: { estudiante: unknown }) => v.estudiante as { id: string; nombres: string; apellidos: string } | null)
      .filter((e): e is { id: string; nombres: string; apellidos: string } => e !== null);
  } else {
    return (
      <>
        <Header title="Mis calificaciones" />
        <main className="p-6">
          <EmptyState
            title="Esta vista es para estudiantes y acudientes"
            description="La administración y los docentes gestionan las notas desde la Planilla de calificaciones."
          />
        </main>
      </>
    );
  }

  if (estudiantes.length === 0) {
    return (
      <>
        <Header title="Mis calificaciones" />
        <main className="p-6">
          <EmptyState
            title="No hay estudiantes vinculados a tu cuenta"
            description="Pide a la secretaría que vincule tu usuario con el estudiante correspondiente."
          />
        </main>
      </>
    );
  }

  const estudianteId = params.estudiante_id && estudiantes.some((e) => e.id === params.estudiante_id)
    ? params.estudiante_id
    : estudiantes[0].id;
  const estudiante = estudiantes.find((e) => e.id === estudianteId)!;

  // Matrículas del estudiante (más reciente primero)
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, estado, anio:anios_lectivos(anio), grupo:grupos(nombre, grado:grados(nombre)), anio_lectivo_id")
    .eq("estudiante_id", estudianteId)
    .order("fecha_matricula", { ascending: false });

  type MatriculaFila = {
    id: string;
    estado: string;
    anio_lectivo_id: string;
    anio: { anio: number } | null;
    grupo: { nombre: string; grado: { nombre: string } | null } | null;
  };
  const mats = (matriculas ?? []) as unknown as MatriculaFila[];

  if (mats.length === 0) {
    return (
      <>
        <Header title="Mis calificaciones" />
        <main className="p-6">
          <EmptyState title="El estudiante no tiene matrículas registradas" />
        </main>
      </>
    );
  }

  const matriculaId = params.matricula_id && mats.some((m) => m.id === params.matricula_id)
    ? params.matricula_id
    : (mats.find((m) => m.estado === "activa") ?? mats[0]).id;
  const matricula = mats.find((m) => m.id === matriculaId)!;

  const periodos = await listPeriodos(matricula.anio_lectivo_id);
  const periodoAcademicoId = params.periodo_academico_id && periodos.some((p) => p.id === params.periodo_academico_id)
    ? params.periodo_academico_id
    : (periodos.find((p) => p.estado === "activo") ?? periodos[0])?.id;

  const asignaturas = periodoAcademicoId
    ? await listCalificacionesEstudiante(matriculaId, periodoAcademicoId)
    : [];

  const periodoSel = periodos.find((p) => p.id === periodoAcademicoId);

  return (
    <>
      <Header title="Mis calificaciones" />
      <main className="space-y-6 p-6">
        {/* Selectores */}
        <form method="get" className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
          {estudiantes.length > 1 && (
            <Field label="Estudiante" htmlFor="estudiante_id">
              <Select id="estudiante_id" name="estudiante_id" defaultValue={estudianteId}>
                {estudiantes.map((e) => (
                  <option key={e.id} value={e.id}>{e.apellidos} {e.nombres}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Año / Curso" htmlFor="matricula_id">
            <Select id="matricula_id" name="matricula_id" defaultValue={matriculaId}>
              {mats.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.anio?.anio} — {m.grupo?.grado?.nombre} {m.grupo?.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Periodo" htmlFor="periodo_academico_id">
            <Select id="periodo_academico_id" name="periodo_academico_id" defaultValue={periodoAcademicoId ?? ""}>
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <SubmitButton>Ver</SubmitButton>
          </div>
        </form>

        {/* Encabezado azul con el estudiante */}
        <div>
          <div className="flex flex-wrap items-center gap-3 rounded-t-xl px-5 py-3 text-white" style={{ background: "#1E4E8C" }}>
            <p className="text-sm font-bold uppercase">
              {estudiante.apellidos} {estudiante.nombres}
            </p>
            <p className="text-xs text-blue-100">
              {matricula.grupo?.grado?.nombre} {matricula.grupo?.nombre} · {periodoSel?.nombre ?? ""}
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-green-200 px-2 py-0.5 font-medium text-green-900">SUP 4.6-5.0</span>
              <span className="rounded bg-sky-200 px-2 py-0.5 font-medium text-sky-900">ALTO 4.0-4.5</span>
              <span className="rounded bg-yellow-200 px-2 py-0.5 font-medium text-yellow-900">BÁSICO 3.0-3.9</span>
              <span className="rounded bg-fuchsia-200 px-2 py-0.5 font-medium text-fuchsia-900">BAJO &lt;3.0</span>
            </div>
          </div>

          {/* Tabla de calificaciones (solo lectura) */}
          <div className="overflow-x-auto rounded-b-xl border border-slate-300 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-white" style={{ background: "#1E4E8C" }}>
                  <th className="sticky left-0 border border-slate-400 px-3 py-2 text-left" style={{ background: "#1E4E8C" }}>Asignatura</th>
                  <th className="border border-slate-400 px-3 py-2 text-left">Calificaciones</th>
                  <th className="border border-slate-400 px-2 py-2 text-center whitespace-nowrap">Acumulado</th>
                  <th className="border border-slate-400 px-2 py-2 text-center whitespace-nowrap">Valoración</th>
                </tr>
              </thead>
              <tbody>
                {asignaturas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      Sin calificaciones registradas para este periodo.
                    </td>
                  </tr>
                ) : (
                  asignaturas.map((fila, idx) => (
                    <tr key={fila.asignatura.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="sticky left-0 border border-slate-300 bg-inherit px-3 py-2 font-medium whitespace-nowrap text-slate-900">
                        {fila.asignatura.nombre}
                      </td>
                      <td className="border border-slate-300 px-3 py-2">
                        {fila.notas.length === 0 ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {fila.notas.map((n, i) => (
                              <span
                                key={i}
                                title={`${n.actividad_nombre} (${n.peso_porcentual}%)`}
                                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${colorNota(n.valor)}`}
                              >
                                {n.valor.toFixed(1)}
                                <span className="font-normal opacity-70">({n.peso_porcentual}%)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className={`border border-slate-300 px-2 py-2 text-center font-bold ${fila.acumulado !== null ? colorNota(fila.acumulado) : ""}`}>
                        {fila.acumulado?.toFixed(1) ?? "—"}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-center">
                        {fila.desempeno ? (
                          <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold uppercase ${DES_BADGE[fila.desempeno] ?? ""}`}>
                            {fila.desempeno}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Vista de solo lectura. Pasa el cursor sobre una nota para ver la actividad y su peso. El boletín oficial se
          descarga desde el módulo de Boletines.
        </p>
      </main>
    </>
  );
}
