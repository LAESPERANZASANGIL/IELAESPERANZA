"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const groups = Array.from(new Set(items.map((item) => item.group)));
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          CE
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Campus La Esperanza</p>
          <p className="text-xs text-slate-500">Plataforma académica</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {group}
            </p>
            <div className="space-y-1">
              {items
                .filter((item) => item.group === group)
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`relative block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-brand-600" />
                      )}
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-200 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-semibold text-accent-700">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{fullName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
        </div>
      </div>
    </aside>
  );
}
