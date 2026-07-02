import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BoletinesPage() {
  return (
    <>
      <Header title="Boletines" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay boletines generados"
          description="Genera y descarga en PDF el boletín de calificaciones de cada estudiante por periodo."
        />
      </main>
    </>
  );
}
