import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getAnioLectivo } from "@/modules/core";
import { updateAnioLectivoAction } from "../actions";

export default async function AnioLectivoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anio = await getAnioLectivo(id);
  if (!anio) notFound();

  return (
    <>
      <Header title={`Editar año lectivo: ${anio.anio}`} />
      <main className="p-6">
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <form action={updateAnioLectivoAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <Field label="Año" htmlFor="anio">
              <TextInput id="anio" name="anio" type="number" defaultValue={anio.anio} required />
            </Field>
            <Field label="Fecha de inicio" htmlFor="fecha_inicio">
              <TextInput id="fecha_inicio" name="fecha_inicio" type="date" defaultValue={anio.fecha_inicio} required />
            </Field>
            <Field label="Fecha de fin" htmlFor="fecha_fin">
              <TextInput id="fecha_fin" name="fecha_fin" type="date" defaultValue={anio.fecha_fin} required />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
