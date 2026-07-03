import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getInstitucionConfig } from "@/modules/institucion";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LandingPage() {
  const [profile, config] = await Promise.all([
    getCurrentProfile(),
    getInstitucionConfig(),
  ]);

  if (profile) redirect("/dashboard");

  const nombre = config?.nombre ?? "Campus La Esperanza";
  const slogan = config?.slogan ?? "Plataforma de gestión académica";
  const mensaje = config?.mensaje_bienvenida ?? "Bienvenido al sistema de gestión institucional. Ingresa con tus credenciales para acceder a los módulos disponibles según tu rol.";
  const direccion = config?.direccion;
  const telefono = config?.telefono;
  const correo = config?.correo;
  const logoUrl = config?.logo_url;

  const initials = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-lg object-contain" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-sm font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-white">{nombre}</p>
            {slogan && <p className="text-xs text-white/60">{slogan}</p>}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left: info institucional */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold leading-tight text-white lg:text-5xl">
                {nombre}
              </h1>
              {slogan && (
                <p className="mt-2 text-lg font-medium text-brand-200">{slogan}</p>
              )}
            </div>
            <p className="text-base leading-relaxed text-white/75">{mensaje}</p>

            {/* Datos de contacto */}
            {(direccion || telefono || correo) && (
              <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Contacto</p>
                {direccion && (
                  <div className="flex items-start gap-2 text-sm text-white/75">
                    <span className="mt-0.5 shrink-0">📍</span>
                    <span>{direccion}</span>
                  </div>
                )}
                {telefono && (
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <span>📞</span>
                    <span>{telefono}</span>
                  </div>
                )}
                {correo && (
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <span>✉️</span>
                    <a href={`mailto:${correo}`} className="hover:text-white hover:underline">{correo}</a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: formulario de login */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
                  {initials || "CE"}
                </div>
                <h2 className="text-xl font-bold text-slate-900">Iniciar sesión</h2>
                <p className="mt-1 text-sm text-slate-500">Ingresa con tus credenciales institucionales</p>
              </div>
              <LoginForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {nombre}. Todos los derechos reservados.
      </footer>
    </div>
  );
}
