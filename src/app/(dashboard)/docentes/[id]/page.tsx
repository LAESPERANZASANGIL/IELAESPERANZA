import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getDocente } from "@/modules/academico";
import { updateDocenteAction } from "./actions";

export default async function DocenteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const docente = await getDocente(id);
  if (!docente) notFound();

  return (
    <>
      <Header title={docente.profile.full_name} />
      <main className="p-6">
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <form action={updateDocenteAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <Field label="Especialidad" htmlFor="especialidad">
              <TextInput id="especialidad" name="especialidad" defaultValue={docente.especialidad ?? ""} />
            </Field>
            <Field label="Tipo de contrato" htmlFor="tipo_contrato">
              <TextInput id="tipo_contrato" name="tipo_contrato" defaultValue={docente.tipo_contrato ?? ""} />
            </Field>
            <Field label="Fecha de ingreso" htmlFor="fecha_ingreso">
              <TextInput id="fecha_ingreso" name="fecha_ingreso" type="date" defaultValue={docente.fecha_ingreso ?? ""} />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
