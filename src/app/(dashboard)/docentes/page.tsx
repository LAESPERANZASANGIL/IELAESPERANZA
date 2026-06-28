import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DocentesPage() {
  return (
    <>
      <Header title="Docentes" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay docentes registrados"
          description="Registra docentes, su especialidad y las asignaturas o grupos a su cargo."
        />
      </main>
    </>
  );
}
