import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MensajeriaPage() {
  return (
    <>
      <Header title="Mensajería" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay mensajes"
          description="Comunícate con docentes, acudientes o el área administrativa de la institución."
        />
      </main>
    </>
  );
}
