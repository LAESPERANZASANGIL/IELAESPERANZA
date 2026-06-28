import Link from "next/link";
import { Header } from "@/components/layout/Header";

const links = [
  { href: "/matricula/procesos", label: "Procesos de matrícula" },
  { href: "/matricula/solicitudes", label: "Solicitudes de admisión" },
];

export default function MatriculaPage() {
  return (
    <>
      <Header title="Matrícula" />
      <main className="grid gap-4 p-6 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-900 hover:border-brand-400"
          >
            {link.label}
          </Link>
        ))}
      </main>
    </>
  );
}
