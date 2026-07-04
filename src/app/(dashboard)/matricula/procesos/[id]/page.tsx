import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getProcesoMatricula } from "@/modules/matricula";
import { listAniosLectivos } from "@/modules/core";
import { updateProcesoMatriculaAction } from "../actions";

export default async function EditarProcesoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [proceso, anios] = await Promise.all([getProcesoMatricula(id), listAniosLectivos()]);
  if (!proceso) notFound();

  return (
    <>
      <Header title={`Editar proceso: ${proceso.nombre}`} />
      <main className="p-6 max-w-lg">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <form action={updateProcesoMatriculaAction} className="space-y-4">
            <input type="hidden" name="id" value={proceso.id} />
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" required defaultValue={proceso.anio_lectivo_id}>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>{anio.anio}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required defaultValue={proceso.nombre} />
            </Field>
            <Field label="Fecha de apertura" htmlFor="fecha_apertura">
              <TextInput id="fecha_apertura" name="fecha_apertura" type="date" required defaultValue={proceso.fecha_apertura} />
            </Field>
            <Field label="Fecha de cierre" htmlFor="fecha_cierre">
              <TextInput id="fecha_cierre" name="fecha_cierre" type="date" required defaultValue={proceso.fecha_cierre} />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
        </div>
      </main>
    </>
  );
}
