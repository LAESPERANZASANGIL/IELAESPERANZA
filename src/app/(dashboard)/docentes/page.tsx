import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { ActionForm } from "@/components/ui/ActionForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { listDocentes } from "@/modules/academico";
import { actualizarEstadoDocenteAction } from "./actions";

export default async function DocentesPage() {
  const docentes = await listDocentes();

  return (
    <>
      <Header title="Docentes" />
      <main className="p-6">
        {docentes.length === 0 ? (
          <EmptyState
            title="Aún no hay docentes registrados"
            description="Crea un usuario con rol Docente desde Administración › Usuarios."
          />
        ) : (
          <Table>
            <Thead>
              <Th>Nombre</Th>
              <Th>Correo</Th>
              <Th>Teléfono</Th>
              <Th>Especialidad</Th>
              <Th>Estado</Th>
              <Th>{""}</Th>
            </Thead>
            <Tbody>
              {docentes.map((docente) => (
                <tr key={docente.id}>
                  <Td>{docente.profile.full_name}</Td>
                  <Td>{docente.profile.email}</Td>
                  <Td>{docente.profile.phone ?? "—"}</Td>
                  <Td>{docente.especialidad ?? "—"}</Td>
                  <Td>{docente.profile.is_active ? "Activo" : "Inactivo"}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Link className="text-sm font-medium text-brand-700 hover:underline" href={`/docentes/${docente.id}`}>
                        Editar
                      </Link>
                      <ActionForm action={actualizarEstadoDocenteAction} className="inline">
                        <input type="hidden" name="id" value={docente.id} />
                        <input type="hidden" name="is_active" value={(!docente.profile.is_active).toString()} />
                        <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                          {docente.profile.is_active ? "Desactivar" : "Activar"}
                        </button>
                      </ActionForm>
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </main>
    </>
  );
}
