import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getMensaje, getRespuestas } from "@/modules/mensajeria";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { enviarMensajeAction, marcarLeidoAction } from "../actions";
import { ActionForm } from "@/components/ui/ActionForm";

export default async function MensajeDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mensaje, profile] = await Promise.all([getMensaje(id), requireProfile()]);
  if (!mensaje) notFound();

  const respuestas = await getRespuestas(id);

  // Mark as read if I'm the recipient and it's unread
  const esDestinatario = mensaje.destinatario_id === profile.id;

  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("is_active", true)
    .neq("id", profile.id)
    .order("full_name");

  return (
    <>
      <Header title={mensaje.asunto} />
      <main className="p-6 max-w-3xl space-y-6">
        {/* Mensaje original */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                De: <span className="font-medium text-slate-900">{mensaje.remitente.full_name}</span>
              </p>
              <p className="text-sm text-slate-500">
                Para: <span className="font-medium text-slate-900">{mensaje.destinatario.full_name}</span>
              </p>
              <p className="text-sm text-slate-500">
                {new Date(mensaje.created_at).toLocaleString("es-CO")}
              </p>
            </div>
            {esDestinatario && !mensaje.leido && (
              <ActionForm action={marcarLeidoAction} className="inline">
                <input type="hidden" name="id" value={mensaje.id} />
                <button type="submit" className="text-xs text-brand-700 hover:underline">
                  Marcar como leído
                </button>
              </ActionForm>
            )}
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{mensaje.contenido}</p>
        </div>

        {/* Respuestas */}
        {respuestas.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">Respuestas ({respuestas.length})</h2>
            {respuestas.map((r) => (
              <div key={r.id} className={`rounded-xl border p-5 ${r.remitente_id === profile.id ? "border-brand-200 bg-brand-50 ml-8" : "border-slate-200 bg-white"}`}>
                <p className="mb-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{r.remitente.full_name}</span> ·{" "}
                  {new Date(r.created_at).toLocaleString("es-CO")}
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.contenido}</p>
              </div>
            ))}
          </div>
        )}

        {/* Responder */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Responder</h2>
          <form action={enviarMensajeAction} className="space-y-4">
            <input type="hidden" name="parent_id" value={id} />
            <Field label="Para" htmlFor="destinatario_id">
              <Select id="destinatario_id" name="destinatario_id" required defaultValue={esDestinatario ? mensaje.remitente_id : mensaje.destinatario_id}>
                {(usuarios ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Asunto" htmlFor="asunto">
              <TextInput id="asunto" name="asunto" defaultValue={`Re: ${mensaje.asunto}`} required />
            </Field>
            <Field label="Mensaje" htmlFor="contenido">
              <textarea
                id="contenido"
                name="contenido"
                required
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </Field>
            <SubmitButton>Enviar respuesta</SubmitButton>
          </form>
        </div>
      </main>
    </>
  );
}
