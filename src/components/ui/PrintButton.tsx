"use client";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 print:hidden"
    >
      {children}
    </button>
  );
}
