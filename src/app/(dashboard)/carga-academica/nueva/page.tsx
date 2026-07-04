import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { listGrupos, listAsignaturas, listDocentes } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { crearMallaAction } from "./actions";

export default async function NuevaMallaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio_lectivo_id?: string }>;
}) {
  const params = await searchParams;
  const anioLectivoId = params.anio_lectivo_id || undefined;

  const [anios, grupos, asignaturas, docentes] = await Promise.all([
    listAniosLectivos(),
    listGrupos({ anio_lectivo_id: anioLectivoId }),
    listAsignaturas(),
    listDocentes(true),
  ]);

  return (
    <>
      <Header title="Nueva asignación de carga académica" />
      <main className="p-6 space-y-4">
        {/* Filtro de año lectivo para cargar cursos (GET) */}
        <form method="GET" action="/carga-academica/nueva" className="flex items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <Field label="Filtrar cursos por año lectivo" htmlFor="anio_lectivo_id">
            <Select id="anio_lectivo_id" name="anio_lectivo_id" defaultValue={anioLectivoId ?? ""}>
              <option value="">Todos los años</option>
              {anios.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.anio}
                </option>
              ))}
            </Select>
          </Field>
          <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
            Cargar cursos
          </button>
        </form>

        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <ActionForm action={crearMallaAction} className="space-y-4">
            <Field label="Curso" htmlFor="grupo_id">
              <Select id="grupo_id" name="grupo_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona un curso
                </option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Asignatura" htmlFor="asignatura_id">
              <Select id="asignatura_id" name="asignatura_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona una asignatura
                </option>
                {asignaturas
                  .filter((a) => a.is_active)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Docente" htmlFor="docente_id">
              <Select id="docente_id" name="docente_id" defaultValue="">
                <option value="">Sin asignar</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Intensidad horaria (horas/semana)" htmlFor="intensidad_horaria">
              <TextInput id="intensidad_horaria" name="intensidad_horaria" type="number" min={1} max={40} />
            </Field>
            <SubmitButton>Guardar asignación</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
