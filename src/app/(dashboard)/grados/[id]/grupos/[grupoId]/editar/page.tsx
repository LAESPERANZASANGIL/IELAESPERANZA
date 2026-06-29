import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { getGrupo, listDocentes } from "@/modules/academico";
import { listAniosLectivos } from "@/modules/core";
import { updateGrupoAction } from "../../../../actions";

export default async function EditarGrupoPage({
  params,
}: {
  params: Promise<{ id: string; grupoId: string }>;
}) {
  const { id, grupoId } = await params;
  const grupo = await getGrupo(grupoId);
  if (!grupo) notFound();

  const [anios, docentes] = await Promise.all([listAniosLectivos(), listDocentes()]);

  return (
    <>
      <Header title={`Editar curso: ${grupo.nombre}`} />
      <main className="p-6">
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <ActionForm action={updateGrupoAction} className="space-y-4">
            <input type="hidden" name="id" value={grupoId} />
            <input type="hidden" name="grado_id" value={id} />
            <Field label="Año lectivo" htmlFor="anio_lectivo_id">
              <Select id="anio_lectivo_id" name="anio_lectivo_id" required defaultValue={grupo.anio_lectivo_id}>
                {anios.map((anio) => (
                  <option key={anio.id} value={anio.id}>
                    {anio.anio}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nombre del curso" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" defaultValue={grupo.nombre} required />
            </Field>
            <Field label="Capacidad" htmlFor="capacidad">
              <TextInput id="capacidad" name="capacidad" type="number" defaultValue={grupo.capacidad ?? ""} />
            </Field>
            <Field label="Jornada" htmlFor="jornada">
              <Select id="jornada" name="jornada" required defaultValue={grupo.jornada ?? ""}>
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
              </Select>
            </Field>
            <Field label="Director de grupo" htmlFor="director_grupo_id">
              <Select id="director_grupo_id" name="director_grupo_id" required defaultValue={grupo.director_grupo_id ?? ""}>
                {docentes.map((docente) => (
                  <option key={docente.id} value={docente.id}>
                    {docente.profile.full_name}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
