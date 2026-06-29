import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { getSede } from "@/modules/core";
import { updateSedeAction } from "../actions";

export default async function SedeDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sede = await getSede(id);
  if (!sede) notFound();

  return (
    <>
      <Header title={`Editar sede: ${sede.nombre}`} />
      <main className="p-6">
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <form action={updateSedeAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" defaultValue={sede.nombre} required />
            </Field>
            <Field label="Código DANE" htmlFor="codigo_dane">
              <TextInput id="codigo_dane" name="codigo_dane" defaultValue={sede.codigo_dane ?? ""} />
            </Field>
            <Field label="Dirección" htmlFor="direccion">
              <TextInput id="direccion" name="direccion" defaultValue={sede.direccion ?? ""} />
            </Field>
            <Field label="Teléfono" htmlFor="telefono">
              <TextInput id="telefono" name="telefono" defaultValue={sede.telefono ?? ""} />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
