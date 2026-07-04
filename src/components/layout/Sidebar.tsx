"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/types/roles";
import { ROLE_LABELS } from "@/types/roles";
import { NAV_ITEMS } from "./nav-config";

export function Sidebar({
  role,
  fullName,
  open = false,
  onNavigate,
}: {
  role: Role;
  fullName: string;
  open?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const itemsDelRol = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // Solo se muestra el grupo (módulo) al que pertenece la página actual.
  // Se compara por el primer segmento de la ruta: /cafeteria/... → grupo Cafetería.
  const seccionActual = pathname.split("/")[1] ?? "";
  const grupoActivo =
    itemsDelRol.find((item) => item.href.split("/")[1] === seccionActual)?.group ?? null;

  const items = grupoActivo ? itemsDelRol.filter((item) => item.group === grupoActivo) : [];
  const groups = grupoActivo ? [grupoActivo] : [];
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ borderColor: "#0B6B3A", background: "#ffffff" }}
    >
      {/* Logo y nombre */}
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ background: "#0B6B3A" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{ background: "#F2C94C", color: "#0B6B3A" }}
        >
          IE
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">La Esperanza</p>
          <p className="text-xs" style={{ color: "#DFF3E4" }}>Plataforma académica</p>
        </div>
        <Link
          href="/dashboard"
          title="Menú principal"
          className="ml-auto rounded px-2 py-1 text-xs text-white hover:bg-white/20"
        >
          ⊞ Menú
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {groups.length === 0 && (
          <Link
            href="/dashboard"
            className="block rounded-lg px-3 py-2 text-sm font-medium"
            style={{ color: "#0B6B3A" }}
          >
            ⊞ Ir al menú principal
          </Link>
        )}
        {groups.map((group) => (
          <div key={group}>
            <p
              className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#0B6B3A" }}
            >
              {group}
            </p>
            <div className="space-y-0.5">
              {items
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className="relative block rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      style={{
                        background: active ? "#DFF3E4" : "transparent",
                        color:      active ? "#0B6B3A" : "#2E2E2E",
                      }}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full"
                          style={{ background: "#0B6B3A" }}
                        />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuario + cerrar sesión */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderTop: "1px solid #DFF3E4" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          style={{ background: "#F2C94C", color: "#0B6B3A" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: "#2E2E2E" }}>{fullName}</p>
          <p className="text-xs" style={{ color: "#0B6B3A" }}>{ROLE_LABELS[role]}</p>
        </div>
        <button
          onClick={handleSignOut}
          title="Cerrar sesión"
          className="rounded px-2 py-1 text-xs font-medium transition hover:opacity-80"
          style={{ background: "#0B6B3A", color: "#ffffff" }}
        >
          Salir
        </button>
      </div>
    </aside>
  );
}
