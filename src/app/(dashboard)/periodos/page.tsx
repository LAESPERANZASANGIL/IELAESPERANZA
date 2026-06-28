import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PeriodosPage() {
  return (
    <>
      <Header title="Periodos académicos" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay periodos académicos definidos"
          description="Configura los periodos del año lectivo (ej. Periodo 1, 2, 3, 4) y sus fechas de inicio y cierre."
        />
      </main>
    </>
  );
}
