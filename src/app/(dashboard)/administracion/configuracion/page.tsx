import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getInstitucionConfig } from "@/modules/institucion";
import { listProfiles, listAniosLectivos } from "@/modules/core";
import { updateInstitucionConfigAction, resetInstitucionConfigAction } from "./actions";

export default async function ConfiguracionInstitucionalPage() {
  const [config, rectores, anios] = await Promise.all([
    getInstitucionConfig(),
    listProfiles("rector"),
    listAniosLectivos(),
  ]);

  return (
    <>
      <Header title="Configuración institucional" />
      <main className="p-6">
        <section className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
          <form action={updateInstitucionConfigAction} className="space-y-4">
            <Field label="Nombre de la institución" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" defaultValue={config?.nombre ?? ""} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="NIT" htmlFor="nit">
                <TextInput id="nit" name="nit" defaultValue={config?.nit ?? ""} />
              </Field>
              <Field label="Código DANE" htmlFor="codigo_dane">
                <TextInput id="codigo_dane" name="codigo_dane" defaultValue={config?.codigo_dane ?? ""} />
              </Field>
            </div>
            <Field label="Dirección" htmlFor="direccion">
              <TextInput id="direccion" name="direccion" defaultValue={config?.direccion ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teléfono" htmlFor="telefono">
                <TextInput id="telefono" name="telefono" defaultValue={config?.telefono ?? ""} />
              </Field>
              <Field label="Correo institucional" htmlFor="correo">
                <TextInput id="correo" name="correo" type="email" defaultValue={config?.correo ?? ""} />
              </Field>
            </div>
            <Field label="Rector" htmlFor="rector_id">
              <Select id="rector_id" name="rector_id" defaultValue={config?.rector_id ?? ""}>
                <option value="">Sin asignar</option>
                {rectores.map((rector) => (
                  <option key={rector.id} value={rector.id}>
                    {rector.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Año lectivo activo" htmlFor="anio_lectivo_activo_id">
              <Select id="anio_lectivo_activo_id" name="anio_lectivo_activo_id" defaultValue={config?.anio_lectivo_activo_id ?? ""}>
                <option value="">Sin asignar</option>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>
                    {anio.anio}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="URL del escudo institucional" htmlFor="escudo_url">
                <TextInput id="escudo_url" name="escudo_url" type="url" defaultValue={config?.escudo_url ?? ""} />
              </Field>
              <Field label="URL del logo" htmlFor="logo_url">
                <TextInput id="logo_url" name="logo_url" type="url" defaultValue={config?.logo_url ?? ""} />
              </Field>
            </div>
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Página de inicio pública (landing)</p>
              <p className="text-xs text-slate-500">Estos textos aparecen en la primera página que ve cualquier visitante antes de ingresar.</p>
              <Field label="Lema / slogan institucional" htmlFor="slogan">
                <TextInput id="slogan" name="slogan" placeholder="Ej. Aprendiendo a educarse, ser y obrar" defaultValue={config?.slogan ?? ""} />
              </Field>
              <Field label="Mensaje de bienvenida" htmlFor="mensaje_bienvenida">
                <textarea
                  id="mensaje_bienvenida"
                  name="mensaje_bienvenida"
                  rows={3}
                  defaultValue={config?.mensaje_bienvenida ?? ""}
                  placeholder="Mensaje principal visible en la landing..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </Field>
              <Field label="Información del colegio" htmlFor="info_colegio">
                <textarea
                  id="info_colegio"
                  name="info_colegio"
                  rows={4}
                  defaultValue={config?.info_colegio ?? ""}
                  placeholder="Historia, misión, visión, niveles que ofrece..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </Field>
              <Field label="Correos adicionales" htmlFor="correos_adicionales">
                <TextInput id="correos_adicionales" name="correos_adicionales" placeholder="secretaria@col.edu.co, rector@col.edu.co (separados por coma)" defaultValue={config?.correos_adicionales ?? ""} />
              </Field>
            </div>
            <div className="flex items-center gap-4">
              <SubmitButton>Guardar configuración</SubmitButton>
            </div>
          </form>
          {config && (
            <form action={resetInstitucionConfigAction} className="mt-4 border-t border-slate-200 pt-4">
              <button
                type="submit"
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Eliminar / restablecer configuración
              </button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
