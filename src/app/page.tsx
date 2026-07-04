import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { getInstitucionConfig } from "@/modules/institucion";
import { LandingLoginForm } from "@/components/auth/LandingLoginForm";

export default async function LandingPage() {
  const [profile, config] = await Promise.all([
    getCurrentProfile(),
    getInstitucionConfig(),
  ]);

  if (profile) redirect("/dashboard");

  const nombre     = config?.nombre              ?? "Institución Educativa La Esperanza";
  const slogan     = config?.slogan              ?? "Aprendiendo a educarse, ser y obrar";
  const mensaje    = config?.mensaje_bienvenida  ?? "";
  const infoColegio= config?.info_colegio        ?? "";
  const direccion  = config?.direccion           ?? "";
  const telefono   = config?.telefono            ?? "";
  const correo     = config?.correo              ?? "";
  const correosAd  = config?.correos_adicionales ?? "";
  const escudoUrl  = config?.escudo_url          ?? "";
  const logoUrl    = config?.logo_url            ?? escudoUrl;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f4f9f6" }}
    >
      {/* ── Encabezado institucional ─────────────────────────────────── */}
      <header
        className="flex items-center gap-3 px-6 py-3 text-white"
        style={{ background: "#0B6B3A" }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain" />
        ) : (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
            style={{ background: "#F2C94C", color: "#0B6B3A" }}
          >
            IE
          </div>
        )}
        <span className="text-sm font-bold uppercase tracking-wide">{nombre}</span>
        {slogan && (
          <span className="hidden text-xs text-green-200 sm:block">— {slogan}</span>
        )}
      </header>

      {/* ── Cuerpo principal ─────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">

          {/* Panel izquierdo — información institucional */}
          <div
            className="rounded-lg bg-white p-6 space-y-5"
            style={{ border: "2px solid #0B6B3A" }}
          >
            {/* Escudo / logo centrado */}
            <div className="flex justify-center pb-2">
              {escudoUrl ? (
                <img
                  src={escudoUrl}
                  alt="Escudo institucional"
                  className="h-36 w-36 object-contain"
                />
              ) : (
                <div
                  className="flex h-36 w-36 items-center justify-center rounded-full text-3xl font-extrabold text-white"
                  style={{ background: "#0B6B3A" }}
                >
                  IE
                </div>
              )}
            </div>

            {/* Secciones editables */}
            {mensaje && (
              <div>
                <SectionTitle>Mensaje</SectionTitle>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#2E2E2E" }}>
                  {mensaje}
                </p>
              </div>
            )}

            {infoColegio && (
              <div>
                <SectionTitle>Información del colegio</SectionTitle>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed" style={{ color: "#2E2E2E" }}>
                  {infoColegio}
                </p>
              </div>
            )}

            {(direccion || telefono) && (
              <div>
                <SectionTitle>Contacto</SectionTitle>
                <div className="mt-1 space-y-1 text-sm" style={{ color: "#2E2E2E" }}>
                  {direccion && <p>📍 {direccion}</p>}
                  {telefono  && <p>📞 {telefono}</p>}
                </div>
              </div>
            )}

            {(correo || correosAd) && (
              <div>
                <SectionTitle>Correos</SectionTitle>
                <div className="mt-1 space-y-1 text-sm" style={{ color: "#2E2E2E" }}>
                  {correo && (
                    <p>
                      <a href={`mailto:${correo}`} className="hover:underline" style={{ color: "#0B6B3A" }}>
                        {correo}
                      </a>
                    </p>
                  )}
                  {correosAd && correosAd.split(",").map((c) => c.trim()).filter(Boolean).map((c) => (
                    <p key={c}>
                      <a href={`mailto:${c}`} className="hover:underline" style={{ color: "#0B6B3A" }}>
                        {c}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho — formulario de ingreso */}
          <div className="flex flex-col rounded-lg overflow-hidden shadow-lg" style={{ border: "2px solid #0B6B3A" }}>
            {/* Encabezado del panel */}
            <div
              className="px-6 py-4 text-center"
              style={{ background: "#1E4E8C" }}
            >
              <p className="text-sm font-bold uppercase tracking-widest text-white">
                Ingreso a la plataforma institucional
              </p>
            </div>

            {/* Formulario */}
            <div
              className="flex flex-1 items-center justify-center p-8"
              style={{ background: "#ffffff" }}
            >
              <LandingLoginForm />
            </div>
          </div>

        </div>
      </main>

      {/* ── Pie de página ────────────────────────────────────────────── */}
      <footer
        className="py-3 text-center text-xs text-white"
        style={{ background: "#0B6B3A" }}
      >
        © {new Date().getFullYear()} {nombre} — Todos los derechos reservados
      </footer>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-wider"
      style={{ color: "#0B6B3A" }}
    >
      {children}
    </p>
  );
}
