import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EstudiantesPage() {
  return (
    <>
      <Header title="Estudiantes" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay estudiantes registrados"
          description="Aquí podrás matricular estudiantes, asignarlos a un grupo y consultar su información."
        />
      </main>
    </>
  );
}
