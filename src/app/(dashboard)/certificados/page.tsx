import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActionForm } from "@/components/ui/ActionForm";
import { listAniosLectivos } from "@/modules/core";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { solicitarCertificadoAction, actualizarEstadoCertificadoAction } from "./actions";
import type { Certificado, Estudiante, AnioLectivo } from "@/types/database.types";

const TIPO_LABEL: Record<string, string> = {
  estudio: "Certificado de estudio",
  conducta: "Certificado de conducta",
  notas: "Certificado de notas",
  paz_y_salvo: "Paz y salvo",
};

const ESTADO_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  en_proceso: "En proceso",
  generado: "Generado",
  entregado: "Entregado",
  rechazado: "Rechazado",
};

const ESTADO_SIGUIENTE: Record<string, string> = {
  solicitado: "en_proceso",
  en_proceso: "generado",
  generado: "entregado",
};

export default async function CertificadosPage() {
  const profile = await requireProfile();
  const esStaff = ["rector", "administrador", "secretaria"].includes(profile.role);

  const supabase = await createClient();
  const anios = await listAniosLectivos();

  // Staff: see all certificates; others: see their own (via estudiante linked to profile)
  let query = supabase
    .from("certificados")
    .select("*, estudiante:estudiantes(id,nombres,apellidos), anio_lectivo:anios_lectivos(id,anio)")
    .order("created_at", { ascending: false });

  if (!esStaff) {
    // Find the estudiante linked to this profile
    const { data: est } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (est) {
      query = query.eq("estudiante_id", est.id);
    } else {
      // Not a student — show empty
      return (
        <>
          <Header title="Certificados institucionales" />
          <main className="p-6">
            <EmptyState title="No tienes certificados disponibles" />
          </main>
        </>
      );
    }
  }

  const { data: certificados } = await query;
  const rows = (certificados ?? []) as unknown as (Certificado & {
    estudiante: Estudiante;
    anio_lectivo: AnioLectivo | null;
  })[];

  // For the solicitud form: list active students
  const { data: estudiantes } = esStaff
    ? await supabase.from("estudiantes").select("id,nombres,apellidos").eq("is_active", true).order("apellidos")
    : { data: [] };

  return (
    <>
      <Header title="Certificados institucionales" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {rows.length === 0 ? (
            <EmptyState title="Aún no hay certificados solicitados" description="Solicita un certificado usando el formulario." />
          ) : (
            <Table>
              <Thead>
                <Th>Estudiante</Th>
                <Th>Tipo</Th>
                <Th>Año lectivo</Th>
                <Th>Estado</Th>
                {esStaff && <Th>Acciones</Th>}
              </Thead>
              <Tbody>
                {rows.map((cert) => (
                  <tr key={cert.id}>
                    <Td>
                      {cert.estudiante.apellidos} {cert.estudiante.nombres}
                    </Td>
                    <Td>{TIPO_LABEL[cert.tipo] ?? cert.tipo}</Td>
                    <Td>{cert.anio_lectivo?.anio ?? "—"}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        cert.estado === "entregado" ? "bg-green-100 text-green-800" :
                        cert.estado === "rechazado" ? "bg-red-100 text-red-700" :
                        cert.estado === "generado" ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {ESTADO_LABEL[cert.estado] ?? cert.estado}
                      </span>
                    </Td>
                    {esStaff && (
                      <Td>
                        {ESTADO_SIGUIENTE[cert.estado] && (
                          <ActionForm action={actualizarEstadoCertificadoAction} className="inline">
                            <input type="hidden" name="id" value={cert.id} />
                            <input type="hidden" name="estado" value={ESTADO_SIGUIENTE[cert.estado]} />
                            <button type="submit" className="text-sm font-medium text-brand-700 hover:underline">
                              Marcar como {ESTADO_LABEL[ESTADO_SIGUIENTE[cert.estado]]}
                            </button>
                          </ActionForm>
                        )}
                      </Td>
                    )}
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Solicitar certificado</h2>
          <form action={solicitarCertificadoAction} className="space-y-4">
            {esStaff && (
              <Field label="Estudiante" htmlFor="estudiante_id">
                <Select id="estudiante_id" name="estudiante_id" required defaultValue="">
                  <option value="" disabled>Selecciona un estudiante</option>
                  {(estudiantes ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.apellidos} {e.nombres}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Tipo de certificado" htmlFor="tipo">
              <Select id="tipo" name="tipo" required defaultValue="">
                <option value="" disabled>Selecciona un tipo</option>
                {Object.entries(TIPO_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" defaultValue="">
                <option value="">Sin especificar</option>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>{anio.anio}</option>
                ))}
              </Select>
            </Field>
            <SubmitButton>Solicitar</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
