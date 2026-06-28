import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GradosPage() {
  return (
    <>
      <Header title="Grados y cursos" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay grados ni grupos creados"
          description="Define los grados (ej. Sexto, Séptimo) y los grupos o cursos (ej. 6-1, 6-2) de cada año lectivo."
        />
      </main>
    </>
  );
}
