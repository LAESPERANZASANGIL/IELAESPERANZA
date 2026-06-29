import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { crearDocenteAction } from "./actions";

export default function NuevoDocentePage() {
  return (
    <>
      <Header title="Crear docente" />
      <main className="p-6">
        <section className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6">
          <ActionForm action={crearDocenteAction} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de documento" htmlFor="documento_tipo">
                <TextInput id="documento_tipo" name="documento_tipo" />
              </Field>
              <Field label="Número de documento" htmlFor="documento_numero">
                <TextInput id="documento_numero" name="documento_numero" />
              </Field>
              <Field label="Nombre completo" htmlFor="full_name">
                <TextInput id="full_name" name="full_name" required />
              </Field>
              <Field label="Correo institucional" htmlFor="email">
                <TextInput id="email" name="email" type="email" required />
              </Field>
              <Field label="Contraseña temporal" htmlFor="password">
                <TextInput id="password" name="password" type="password" minLength={6} required />
              </Field>
              <Field label="Fecha de nacimiento" htmlFor="fecha_nacimiento">
                <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
              </Field>
              <Field label="Sexo" htmlFor="sexo">
                <Select id="sexo" name="sexo" defaultValue="">
                  <option value="">Seleccionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                </Select>
              </Field>
              <Field label="Dirección" htmlFor="direccion">
                <TextInput id="direccion" name="direccion" />
              </Field>
              <Field label="Municipio" htmlFor="municipio">
                <TextInput id="municipio" name="municipio" />
              </Field>
              <Field label="Departamento" htmlFor="departamento">
                <TextInput id="departamento" name="departamento" />
              </Field>
              <Field label="Celular" htmlFor="phone">
                <TextInput id="phone" name="phone" />
              </Field>
              <Field label="Teléfono" htmlFor="telefono">
                <TextInput id="telefono" name="telefono" />
              </Field>
              <Field label="Correo personal" htmlFor="correo_personal">
                <TextInput id="correo_personal" name="correo_personal" type="email" />
              </Field>
              <Field label="Profesión" htmlFor="profesion">
                <TextInput id="profesion" name="profesion" />
              </Field>
              <Field label="Especialidad" htmlFor="especialidad">
                <TextInput id="especialidad" name="especialidad" required />
              </Field>
              <Field label="Escalafón" htmlFor="escalafon">
                <TextInput id="escalafon" name="escalafon" />
              </Field>
              <Field label="Tipo de contrato" htmlFor="tipo_contrato">
                <TextInput id="tipo_contrato" name="tipo_contrato" />
              </Field>
              <Field label="Fecha de ingreso" htmlFor="fecha_ingreso">
                <TextInput id="fecha_ingreso" name="fecha_ingreso" type="date" />
              </Field>
            </div>
            <SubmitButton>Crear docente</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
