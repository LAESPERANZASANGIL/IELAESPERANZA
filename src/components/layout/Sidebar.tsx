"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/roles";
import { ROLE_LABELS } from "@/types/roles";
import { NAV_ITEMS } from "./nav-config";

export function Sidebar({ role, fullName }: { role: Role; fullName: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-sm font-bold text-slate-900">IE La Esperanza</p>
        <p className="text-xs text-slate-500">Sistema académico</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="truncate text-sm font-medium text-slate-800">{fullName}</p>
        <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
      </div>
    </aside>
  );
}
