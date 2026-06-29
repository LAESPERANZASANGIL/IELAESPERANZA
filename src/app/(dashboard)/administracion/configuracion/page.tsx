import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getInstitucionConfig } from "@/modules/institucion";
import { listProfiles, listAniosLectivos } from "@/modules/core";
import { updateInstitucionConfigAction } from "./actions";

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
            <SubmitButton>Guardar configuración</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
