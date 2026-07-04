import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { getMallaCurricular, listDocentes } from "@/modules/academico";
import { editarMallaAction } from "./actions";

export default async function EditarMallaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entrada, docentes] = await Promise.all([getMallaCurricular(id), listDocentes(true)]);
  if (!entrada) notFound();

  return (
    <>
      <Header title="Editar asignación de carga académica" />
      <main className="p-6">
        <section className="max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="grid gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium">Curso:</span> {entrada.grupo.nombre} — {entrada.grupo.grado.nombre}
            </p>
            <p>
              <span className="font-medium">Asignatura:</span> {entrada.asignatura.nombre}
            </p>
          </div>
          <ActionForm action={editarMallaAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <Field label="Docente" htmlFor="docente_id">
              <Select id="docente_id" name="docente_id" defaultValue={entrada.docente_id ?? ""}>
                <option value="">Sin asignar</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Intensidad horaria (horas/semana)" htmlFor="intensidad_horaria">
              <TextInput
                id="intensidad_horaria"
                name="intensidad_horaria"
                type="number"
                min={1}
                max={40}
                defaultValue={entrada.intensidad_horaria ?? ""}
              />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
