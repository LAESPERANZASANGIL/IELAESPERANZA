"use client";

import { useFormStatus } from "react-dom";
import { useFormPending } from "./ActionForm";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending: statusPending } = useFormStatus();
  const contextPending = useFormPending();
  const pending = statusPending || contextPending;

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Guardando..." : children}
    </button>
  );
}
