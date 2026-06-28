import Link from "next/link";
import { Header } from "@/components/layout/Header";

const links = [
  { href: "/administracion/sedes", label: "Sedes" },
  { href: "/administracion/anios-lectivos", label: "Años lectivos" },
  { href: "/administracion/usuarios", label: "Usuarios" },
];

export default function AdministracionPage() {
  return (
    <>
      <Header title="Administración" />
      <main className="grid gap-4 p-6 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-900 hover:border-emerald-400"
          >
            {link.label}
          </Link>
        ))}
      </main>
    </>
  );
}
