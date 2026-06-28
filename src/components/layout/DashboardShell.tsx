"use client";

import { useState, type ReactNode } from "react";
import type { Role } from "@/types/roles";
import { Sidebar } from "./Sidebar";

export function DashboardShell({
  role,
  fullName,
  children,
}: {
  role: Role;
  fullName: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} fullName={fullName} open={open} onNavigate={() => setOpen(false)} />

      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:ml-0">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
          >
            <span className="sr-only">Menú</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-4 bg-slate-600" />
              <span className="block h-0.5 w-4 bg-slate-600" />
              <span className="block h-0.5 w-4 bg-slate-600" />
            </div>
          </button>
          <p className="text-sm font-semibold text-slate-900">Campus La Esperanza</p>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
