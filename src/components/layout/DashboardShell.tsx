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
        <div className="flex items-center gap-3 px-4 py-3 lg:hidden" style={{ background: "#0B6B3A" }}>
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <span className="sr-only">Menú</span>
            <div className="space-y-1">
              <span className="block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
            </div>
          </button>
          <p className="text-sm font-bold text-white">La Esperanza</p>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
