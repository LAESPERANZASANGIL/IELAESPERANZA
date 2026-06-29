import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLE_LABELS, ROLES } from "@/types/roles";
import { listProfiles } from "@/modules/core";
import { createUsuarioAction, actualizarEstadoUsuarioAction } from "./actions";

export default async function UsuariosPage() {
  const usuarios = await listProfiles();

  return (
    <>
      <Header title="Usuarios" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {usuarios.length === 0 ? (
            <EmptyState title="Aún no hay usuarios registrados" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Acción</Th>
              </Thead>
              <Tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <Td>{usuario.full_name}</Td>
                    <Td>{usuario.email}</Td>
                    <Td>{ROLE_LABELS[usuario.role]}</Td>
                    <Td>{usuario.activo ? "Activo" : "Inactivo"}</Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/administracion/usuarios/${usuario.id}`}
                          className="text-sm font-medium text-brand-700 hover:underline"
                        >
                          Editar
                        </Link>
                        <form action={actualizarEstadoUsuarioAction}>
                          <input type="hidden" name="id" value={usuario.id} />
                          <input type="hidden" name="activo" value={(!usuario.activo).toString()} />
                          <button className="text-sm font-medium text-brand-700 hover:underline" type="submit">
                            {usuario.activo ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                      </div>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo usuario</h2>
          <form action={createUsuarioAction} className="space-y-4">
            <Field label="Nombre completo" htmlFor="full_name">
              <TextInput id="full_name" name="full_name" required />
            </Field>
            <Field label="Correo" htmlFor="email">
              <TextInput id="email" name="email" type="email" required />
            </Field>
            <Field label="Rol" htmlFor="role">
              <Select id="role" name="role" required defaultValue="">
                <option value="" disabled>
                  Selecciona un rol
                </option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Documento" htmlFor="documento_numero">
              <TextInput id="documento_numero" name="documento_numero" />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <TextInput id="phone" name="phone" />
            </Field>
            <SubmitButton>Invitar usuario</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
