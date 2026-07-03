import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { requireProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/types/roles";
import { createClient } from "@/lib/supabase/server";
import { listAniosLectivos } from "@/modules/core";

async function getEstadisticasRector() {
  const supabase = await createClient();
  const anios = await listAniosLectivos();
  const anioActivo = anios.find((a) => a.estado === "activo") ?? anios[0];

  const [
    { count: totalEstudiantes },
    { count: totalDocentes },
    { count: matriculasActivas },
    { count: solicitudesPendientes },
    { count: certificadosPendientes },
    { count: mensajesNoLeidos },
  ] = await Promise.all([
    supabase.from("estudiantes").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("docentes").select("id", { count: "exact", head: true }),
    supabase.from("matriculas").select("id", { count: "exact", head: true }).eq("estado", "activa").eq("anio_lectivo_id", anioActivo?.id ?? ""),
    supabase.from("solicitudes_admision").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
    supabase.from("certificados").select("id", { count: "exact", head: true }).in("estado", ["solicitado", "en_proceso"]),
    supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("leido", false),
  ]);

  return { totalEstudiantes, totalDocentes, matriculasActivas, solicitudesPendientes, certificadosPendientes, mensajesNoLeidos, anioActivo };
}

async function getEstadisticasDocente(profileId: string) {
  const supabase = await createClient();
  const anios = await listAniosLectivos();
  const anioActivo = anios.find((a) => a.estado === "activo") ?? anios[0];

  const { data: mallas } = await supabase
    .from("malla_curricular")
    .select("id, grupo:grupos(id,nombre,grado:grados(nombre)), asignatura:asignaturas(nombre)")
    .eq("docente_id", profileId)
    .eq("is_active", true);

  const grupoIds = [...new Set((mallas ?? []).map((m: any) => m.grupo?.id).filter(Boolean))];
  let totalEstudiantes = 0;
  if (grupoIds.length > 0 && anioActivo) {
    const { count } = await supabase
      .from("matriculas")
      .select("id", { count: "exact", head: true })
      .in("grupo_id", grupoIds)
      .eq("anio_lectivo_id", anioActivo.id)
      .eq("estado", "activa");
    totalEstudiantes = count ?? 0;
  }

  const { count: mensajesNoLeidos } = await supabase
    .from("mensajes")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_id", profileId)
    .eq("leido", false);

  const hoy = new Date().toISOString().slice(0, 10);
  let asistenciaHoy = 0;
  if (grupoIds.length > 0 && anioActivo) {
    const { data: mats } = await supabase
      .from("matriculas")
      .select("id")
      .in("grupo_id", grupoIds)
      .eq("anio_lectivo_id", anioActivo.id)
      .eq("estado", "activa");
    const matIds = (mats ?? []).map((m: any) => m.id);
    if (matIds.length > 0) {
      const { count } = await supabase
        .from("asistencia")
        .select("id", { count: "exact", head: true })
        .in("matricula_id", matIds)
        .eq("fecha", hoy);
      asistenciaHoy = count ?? 0;
    }
  }

  return { mallas: mallas ?? [], grupoIds, totalEstudiantes, mensajesNoLeidos, asistenciaHoy, anioActivo };
}

const STAT_COLORS = [
  "border-l-brand-500",
  "border-l-accent-500",
  "border-l-brand-700",
  "border-l-green-500",
  "border-l-amber-500",
  "border-l-red-400",
];

function StatCard({
  title,
  value,
  description,
  href,
  index,
}: {
  title: string;
  value: number | string;
  description: string;
  href?: string;
  index: number;
}) {
  const card = (
    <div className={`rounded-xl border border-slate-200 border-l-4 ${STAT_COLORS[index % STAT_COLORS.length]} bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const esStaff = ["rector", "administrador", "secretaria"].includes(profile.role);

  let statsStaff: Awaited<ReturnType<typeof getEstadisticasRector>> | null = null;
  let statsDocente: Awaited<ReturnType<typeof getEstadisticasDocente>> | null = null;

  if (esStaff) {
    statsStaff = await getEstadisticasRector();
  } else if (profile.role === "docente") {
    statsDocente = await getEstadisticasDocente(profile.id);
  }

  return (
    <>
      <Header title="Panel principal" />
      <main className="p-6 space-y-6">
        {/* Bienvenida */}
        <div className="rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">{ROLE_LABELS[profile.role]}</p>
          <h2 className="mt-1 text-xl font-bold">Hola, {profile.full_name.split(" ")[0]} 👋</h2>
          <p className="mt-1 text-sm text-brand-50">
            {statsStaff?.anioActivo
              ? `Año lectivo activo: ${statsStaff.anioActivo.anio}`
              : statsDocente?.anioActivo
              ? `Año lectivo activo: ${statsDocente.anioActivo.anio}`
              : "Bienvenido a Campus La Esperanza."}
          </p>
        </div>

        {/* Stats para staff */}
        {statsStaff && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard index={0} title="Estudiantes activos" value={statsStaff.totalEstudiantes ?? 0} description="Total con is_active" href="/estudiantes" />
              <StatCard index={1} title="Docentes" value={statsStaff.totalDocentes ?? 0} description="Registrados en el sistema" href="/docentes" />
              <StatCard index={2} title="Matrículas activas" value={statsStaff.matriculasActivas ?? 0} description={`Año lectivo ${statsStaff.anioActivo?.anio ?? "—"}`} href="/matricula" />
              <StatCard index={3} title="Solicitudes pendientes" value={statsStaff.solicitudesPendientes ?? 0} description="Por revisar y admitir" href="/matricula/solicitudes" />
              <StatCard index={4} title="Certificados por atender" value={statsStaff.certificadosPendientes ?? 0} description="Solicitados o en proceso" href="/certificados" />
              <StatCard index={5} title="Mensajes no leídos" value={statsStaff.mensajesNoLeidos ?? 0} description="En toda la plataforma" href="/mensajeria" />
            </div>

            {/* Accesos rápidos */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Accesos rápidos</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Registrar asistencia", href: "/asistencia" },
                  { label: "Ingresar notas", href: "/notas" },
                  { label: "Generar boletines", href: "/boletines" },
                  { label: "Nueva matrícula directa", href: "/matricula" },
                ].map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-colors"
                  >
                    {a.label} →
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Stats para docente */}
        {statsDocente && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard index={0} title="Asignaturas a cargo" value={statsDocente.mallas.length} description="En la malla curricular activa" href="/carga-academica" />
              <StatCard index={1} title="Estudiantes en mis cursos" value={statsDocente.totalEstudiantes} description={`Matriculados año ${statsDocente.anioActivo?.anio ?? "—"}`} href="/asistencia" />
              <StatCard index={2} title="Registros de asistencia hoy" value={statsDocente.asistenciaHoy} description="De todos tus cursos" href="/asistencia" />
              <StatCard index={3} title="Mensajes no leídos" value={statsDocente.mensajesNoLeidos ?? 0} description="En tu bandeja de entrada" href="/mensajeria" />
            </div>

            {statsDocente.mallas.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-700">Mis asignaturas</h2>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {statsDocente.mallas.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{m.asignatura?.nombre}</p>
                        <p className="text-xs text-slate-500">{m.grupo?.grado?.nombre} · {m.grupo?.nombre}</p>
                      </div>
                      <div className="flex gap-3">
                        <Link href={`/asistencia?grupo_id=${m.grupo?.id}`} className="text-xs text-brand-700 hover:underline">Asistencia</Link>
                        <Link href={`/notas?malla_curricular_id=${m.id}`} className="text-xs text-brand-700 hover:underline">Notas</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Para otros roles */}
        {!esStaff && profile.role !== "docente" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Mis notas", description: "Calificaciones del periodo actual", href: "/notas", index: 0 },
              { title: "Mi asistencia", description: "Historial de asistencia", href: "/asistencia", index: 1 },
              { title: "Mensajería", description: "Comunicación con la institución", href: "/mensajeria", index: 2 },
            ].map((w) => (
              <StatCard key={w.href} index={w.index} title={w.title} value="→" description={w.description} href={w.href} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
