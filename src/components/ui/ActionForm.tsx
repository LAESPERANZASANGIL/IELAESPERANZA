"use client";

import { createContext, useContext, useState, useTransition, type FormEvent, type ReactNode } from "react";

const PendingContext = createContext(false);

export function useFormPending() {
  return useContext(PendingContext);
}

export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  confirmMessage?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      }
    });
  }

  return (
    <PendingContext.Provider value={pending}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
        {error && (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
      </form>
    </PendingContext.Provider>
  );
}
