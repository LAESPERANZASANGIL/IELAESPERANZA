"use client";

import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteEstudianteButton({ id, action }: { id: string; action: (formData: FormData) => Promise<void> }) {
  const router = useRouter();

  return (
    <ActionForm
      action={action}
      confirmMessage="¿Eliminar este estudiante? Esta acción no se puede deshacer."
      onSuccess={() => router.push("/estudiantes")}
    >
      <input type="hidden" name="id" value={id} />
      <SubmitButton>Eliminar estudiante</SubmitButton>
    </ActionForm>
  );
}
