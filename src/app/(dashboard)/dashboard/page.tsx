import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/types/roles";
import type { Role } from "@/types/roles";
import { getInstitucionConfig } from "@/modules/institucion";

interface ModuleTile {
  label: string;
  href: string;
  roles: Role[];
  icon: string;
}

const TODOS: Role[] = ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"];
const STAFF: Role[] = ["rector", "administrador", "secretaria"];
const ADMIN: Role[] = ["rector", "administrador"];

const MODULE_TILES: ModuleTile[] = [
  {
    label: "Académico",
    href: "/matricula/procesos",
    roles: STAFF,
    icon: "🎓",
  },
  {
    label: "Académico",
    href: "/notas",
    roles: ["docente", "padre_familia", "estudiante"],
    icon: "🎓",
  },
  {
    label: "Cafetería",
    href: "/cafeteria/ventas",
    roles: STAFF,
    icon: "🍽️",
  },
  {
    label: "Nómina",
    href: "/nomina/empleados",
    roles: ADMIN,
    icon: "💼",
  },
  {
    label: "Cartera",
    href: "/cartera/facturas",
    roles: STAFF,
    icon: "📋",
  },
  {
    label: "Contabilidad",
    href: "/contabilidad/ingresos",
    roles: ADMIN,
    icon: "📊",
  },
  {
    label: "Comunicación",
    href: "/mensajeria",
    roles: TODOS,
    icon: "💬",
  },
  {
    label: "Administración",
    href: "/administracion/configuracion",
    roles: ADMIN,
    icon: "⚙️",
  },
  {
    label: "Asistencia",
    href: "/asistencia",
    roles: TODOS,
    icon: "📅",
  },
  {
    label: "Boletines",
    href: "/boletines",
    roles: TODOS,
    icon: "📄",
  },
  {
    label: "Certificados",
    href: "/certificados",
    roles: [...STAFF, "padre_familia", "estudiante"] as Role[],
    icon: "🏅",
  },
];

export default async function DashboardPage() {
  const [profile, config] = await Promise.all([
    requireProfile(),
    getInstitucionConfig(),
  ]);

  const nombre = config?.nombre ?? "Campus La Esperanza";
  const escudoUrl = config?.escudo_url ?? config?.logo_url ?? "";

  // Deduplica por label, tomando el primero que aplica al rol
  const seen = new Set<string>();
  const tiles = MODULE_TILES.filter((t) => {
    if (!t.roles.includes(profile.role)) return false;
    if (seen.has(t.label)) return false;
    seen.add(t.label);
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: "#f4f9f6" }}>
      {/* Encabezado de bienvenida */}
      <div
        className="flex items-center gap-4 px-6 py-5"
        style={{ background: "#0B6B3A" }}
      >
        {escudoUrl ? (
          <img src={escudoUrl} alt="Escudo" className="h-12 w-12 rounded object-contain" />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-sm font-bold"
            style={{ background: "#F2C94C", color: "#0B6B3A" }}
          >
            IE
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-200">
            {ROLE_LABELS[profile.role]}
          </p>
          <h1 className="text-lg font-bold text-white">{nombre}</h1>
          <p className="text-sm text-green-100">
            Bienvenido, {profile.full_name}
          </p>
        </div>
        {/* Cerrar sesión */}
        <form action="/api/auth/signout" method="POST" className="ml-auto">
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-xs font-semibold text-white transition"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      {/* Subtítulo */}
      <div
        className="px-6 py-3"
        style={{ background: "#1E4E8C" }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-white">
          Menú principal — Módulos disponibles
        </p>
      </div>

      {/* Grid de módulos */}
      <main className="p-8">
        <div className="mx-auto max-w-4xl grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group flex flex-col items-center justify-center gap-3 rounded-lg py-10 px-6 text-center text-white transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-95"
              style={{ background: "#1E4E8C", minHeight: "160px" }}
            >
              <span className="text-4xl">{tile.icon}</span>
              <span
                className="text-lg font-extrabold uppercase tracking-widest"
              >
                {tile.label}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
