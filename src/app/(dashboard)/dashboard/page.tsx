import { Header } from "@/components/layout/Header";
import { requireProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/types/roles";

const ROLE_WIDGETS: Record<string, { title: string; description: string }[]> = {
  rector: [
    { title: "Estudiantes activos", description: "Resumen general de matrícula vigente." },
    { title: "Docentes", description: "Planta docente activa por sede." },
    { title: "Asistencia general", description: "Indicadores de asistencia institucional." },
  ],
  administrador: [
    { title: "Estudiantes activos", description: "Resumen general de matrícula vigente." },
    { title: "Grupos y grados", description: "Distribución de grupos por grado." },
    { title: "Certificados pendientes", description: "Solicitudes por generar o entregar." },
  ],
  secretaria: [
    { title: "Matrículas", description: "Nuevas matrículas y novedades." },
    { title: "Certificados pendientes", description: "Solicitudes por generar o entregar." },
    { title: "Mensajería", description: "Mensajes recientes de acudientes." },
  ],
  docente: [
    { title: "Mis grupos", description: "Grupos y asignaturas a cargo." },
    { title: "Notas pendientes", description: "Registros de calificaciones por completar." },
    { title: "Asistencia de hoy", description: "Registrar asistencia del día." },
  ],
  padre_familia: [
    { title: "Mis hijos", description: "Resumen académico de cada estudiante." },
    { title: "Boletines", description: "Boletines disponibles para consulta." },
    { title: "Mensajería", description: "Comunicación con la institución." },
  ],
  estudiante: [
    { title: "Mis notas", description: "Calificaciones del periodo actual." },
    { title: "Mi asistencia", description: "Historial de asistencia." },
    { title: "Mis boletines", description: "Boletines disponibles para consulta." },
  ],
};

const ACCENTS = ["bg-brand-500", "bg-accent-500", "bg-brand-700"];

export default async function DashboardPage() {
  const profile = await requireProfile();
  const widgets = ROLE_WIDGETS[profile.role] ?? [];

  return (
    <>
      <Header title="Panel principal" />
      <main className="p-6">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-500 p-6 text-white">
          <p className="text-sm font-medium text-brand-100">{ROLE_LABELS[profile.role]}</p>
          <h2 className="mt-1 text-xl font-bold">Hola, {profile.full_name.split(" ")[0]} 👋</h2>
          <p className="mt-1 text-sm text-brand-50">
            Este es tu panel principal en Campus La Esperanza.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget, index) => (
            <div
              key={widget.title}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className={`h-1.5 ${ACCENTS[index % ACCENTS.length]}`} />
              <div className="p-5">
                <h3 className="text-sm font-semibold text-slate-800">{widget.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{widget.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
