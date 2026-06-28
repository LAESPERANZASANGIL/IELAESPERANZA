import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { listDocentes } from "@/modules/academico";

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
            </Thead>
            <Tbody>
              {docentes.map((docente) => (
                <tr key={docente.id}>
                  <Td>{docente.profile.full_name}</Td>
                  <Td>{docente.profile.email}</Td>
                  <Td>{docente.profile.phone ?? "—"}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        )}
      </main>
    </>
  );
}
