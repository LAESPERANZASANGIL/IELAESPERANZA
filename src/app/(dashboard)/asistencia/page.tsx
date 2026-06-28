import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AsistenciaPage() {
  return (
    <>
      <Header title="Asistencia" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay registros de asistencia"
          description="Registra la asistencia diaria por grupo y consulta el historial de fallas de cada estudiante."
        />
      </main>
    </>
  );
}
