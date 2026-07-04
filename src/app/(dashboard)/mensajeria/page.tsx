import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import { listMensajesRecibidos, listMensajesEnviados } from "@/modules/mensajeria";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { enviarMensajeAction } from "./actions";

export default async function MensajeriaPage({
  searchParams,
}: {
  searchParams: Promise<{ bandeja?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const bandeja = params.bandeja || "recibidos";

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("is_active", true)
    .neq("id", profile.id)
    .order("full_name");

  const [recibidos, enviados] = await Promise.all([
    listMensajesRecibidos(profile.id),
    listMensajesEnviados(profile.id),
  ]);

  const mensajes = bandeja === "enviados" ? enviados : recibidos;

  return (
    <>
      <Header title="Mensajería" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          {/* Tabs bandeja */}
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
            {(["recibidos", "enviados"] as const).map((b) => (
              <Link
                key={b}
                href={`/mensajeria?bandeja=${b}`}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                  bandeja === b
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {b === "recibidos" ? "Recibidos" : "Enviados"}
                {b === "recibidos" && recibidos.filter((m) => !m.leido).length > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand-600 px-1.5 py-0.5 text-xs text-white">
                    {recibidos.filter((m) => !m.leido).length}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {mensajes.length === 0 ? (
            <EmptyState title={bandeja === "recibidos" ? "Sin mensajes recibidos" : "Sin mensajes enviados"} />
          ) : (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              {mensajes.map((mensaje) => (
                <Link
                  key={mensaje.id}
                  href={`/mensajeria/${mensaje.id}`}
                  className={`flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors ${
                    bandeja === "recibidos" && !mensaje.leido ? "bg-brand-50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${!mensaje.leido && bandeja === "recibidos" ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                        {bandeja === "recibidos"
                          ? mensaje.remitente.full_name
                          : mensaje.destinatario.full_name}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(mensaje.created_at).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${!mensaje.leido && bandeja === "recibidos" ? "text-slate-800" : "text-slate-500"}`}>
                      {mensaje.asunto}
                    </p>
                  </div>
                  {bandeja === "recibidos" && !mensaje.leido && (
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-600 shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo mensaje</h2>
          <form action={enviarMensajeAction} className="space-y-4">
            <Field label="Para" htmlFor="destinatario_id">
              <Select id="destinatario_id" name="destinatario_id" required defaultValue="">
                <option value="" disabled>Selecciona un usuario</option>
                {(usuarios ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Asunto" htmlFor="asunto">
              <TextInput id="asunto" name="asunto" required />
            </Field>
            <Field label="Mensaje" htmlFor="contenido">
              <textarea
                id="contenido"
                name="contenido"
                required
                rows={5}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Escribe tu mensaje..."
              />
            </Field>
            <SubmitButton>Enviar mensaje</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
