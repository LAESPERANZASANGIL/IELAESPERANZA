import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AsignaturasPage() {
  return (
    <>
      <Header title="Asignaturas" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay asignaturas registradas"
          description="Crea las asignaturas del plan de estudios y asígnalas a cada grupo con su docente."
        />
      </main>
    </>
  );
}
