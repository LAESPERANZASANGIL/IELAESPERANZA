import { Header } from "@/components/layout/Header";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CertificadosPage() {
  return (
    <>
      <Header title="Certificados institucionales" />
      <main className="p-6">
        <EmptyState
          title="Aún no hay certificados solicitados"
          description="Solicita y genera certificados de estudio, conducta, notas y paz y salvo."
        />
      </main>
    </>
  );
}
