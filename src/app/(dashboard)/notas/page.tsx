import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotasPage() {
  return (
    <>
      <Header title="Notas" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay notas registradas"
          description="Registra y consulta las calificaciones de los estudiantes por asignatura y periodo."
        />
      </main>
    </>
  );
}
