import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { Badge } from "@/components/ui/Badge";
import { DeleteDocenteButton } from "./DeleteDocenteButton";
import { getDocente } from "@/modules/academico";
import { updateDocenteAction, deleteDocenteAction, actualizarEstadoDocenteAction } from "./actions";

export default async function DocenteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docente = await getDocente(id);
  if (!docente) notFound();

  return (
    <>
      <Header title={docente.profile.full_name} />
      <main className="p-6">
        <section className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">{docente.profile.email}</p>
              <p className="text-sm text-slate-500">Documento: {docente.profile.documento_numero ?? "—"}</p>
            </div>
            <Badge color={docente.profile.is_active ? "green" : "red"}>
              {docente.profile.is_active ? "Activo" : "Inactivo"}
            </Badge>
          </div>

          <ActionForm action={updateDocenteAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="full_name">
                <TextInput id="full_name" name="full_name" defaultValue={docente.profile.full_name} required />
              </Field>
              <Field label="Tipo de documento" htmlFor="documento_tipo">
                <TextInput id="documento_tipo" name="documento_tipo" defaultValue={docente.profile.documento_tipo ?? ""} />
              </Field>
              <Field label="Número de documento" htmlFor="documento_numero">
                <TextInput
                  id="documento_numero"
                  name="documento_numero"
                  defaultValue={docente.profile.documento_numero ?? ""}
                />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
                <TextInput
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  defaultValue={docente.fecha_nacimiento ?? ""}
                />
              </Field>
              <Field label="Sexo" htmlFor="sexo">
                <Select id="sexo" name="sexo" defaultValue={docente.sexo ?? ""}>
                  <option value="">Seleccionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </Select>
              </Field>
              <Field label="Dirección" htmlFor="direccion">
                <TextInput id="direccion" name="direccion" defaultValue={docente.direccion ?? ""} />
              </Field>
              <Field label="Municipio" htmlFor="municipio">
                <TextInput id="municipio" name="municipio" defaultValue={docente.municipio ?? ""} />
              </Field>
              <Field label="Departamento" htmlFor="departamento">
                <TextInput id="departamento" name="departamento" defaultValue={docente.departamento ?? ""} />
              </Field>
              <Field label="Celular" htmlFor="phone">
                <TextInput id="phone" name="phone" defaultValue={docente.profile.phone ?? ""} />
              </Field>
              <Field label="Teléfono" htmlFor="telefono">
                <TextInput id="telefono" name="telefono" defaultValue={docente.telefono ?? ""} />
              </Field>
              <Field label="Correo personal" htmlFor="correo_personal">
                <TextInput
                  id="correo_personal"
                  name="correo_personal"
                  type="email"
                  defaultValue={docente.correo_personal ?? ""}
                />
              </Field>
              <Field label="Profesión" htmlFor="profesion">
                <TextInput id="profesion" name="profesion" defaultValue={docente.profesion ?? ""} />
              </Field>
              <Field label="Especialidad" htmlFor="especialidad">
                <TextInput id="especialidad" name="especialidad" defaultValue={docente.especialidad ?? ""} required />
              </Field>
              <Field label="Escalafón" htmlFor="escalafon">
                <TextInput id="escalafon" name="escalafon" defaultValue={docente.escalafon ?? ""} />
              </Field>
              <Field label="Tipo de contrato" htmlFor="tipo_contrato">
                <TextInput id="tipo_contrato" name="tipo_contrato" defaultValue={docente.tipo_contrato ?? ""} />
              </Field>
              <Field label="Fecha de ingreso" htmlFor="fecha_ingreso">
                <TextInput
                  id="fecha_ingreso"
                  name="fecha_ingreso"
                  type="date"
                  defaultValue={docente.fecha_ingreso ?? ""}
                />
              </Field>
            </div>
            <SubmitButton>Guardar cambios</SubmitButton>
          </ActionForm>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            <ActionForm action={actualizarEstadoDocenteAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="is_active" value={(!docente.profile.is_active).toString()} />
              <SubmitButton>{docente.profile.is_active ? "Desactivar docente" : "Activar docente"}</SubmitButton>
            </ActionForm>
            <DeleteDocenteButton id={id} action={deleteDocenteAction} />
          </div>
        </section>
      </main>
    </>
  );
}
