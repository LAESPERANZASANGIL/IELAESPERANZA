import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
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

export default async function DashboardPage() {
  const profile = await requireProfile();
  const widgets = ROLE_WIDGETS[profile.role] ?? [];

  return (
    <>
      <Header title={`Panel - ${ROLE_LABELS[profile.role]}`} />
      <main className="p-6">
        <p className="mb-6 text-sm text-slate-500">
          Bienvenido(a), {profile.full_name}. Este es tu panel principal según tu rol.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <Card key={widget.title} title={widget.title}>
              <p className="text-sm text-slate-500">{widget.description}</p>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
