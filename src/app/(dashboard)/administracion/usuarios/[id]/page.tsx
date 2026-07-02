import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { ROLE_LABELS, ROLES } from "@/types/roles";
import { getUsuario } from "@/modules/core";
import { updateUsuarioAction } from "../actions";

export default async function UsuarioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getUsuario(id);
  if (!usuario) notFound();

  return (
    <>
      <Header title={`Editar usuario: ${usuario.full_name}`} />
      <main className="p-6">
        <section className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
          <ActionForm action={updateUsuarioAction} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <Field label="Nombre completo" htmlFor="full_name">
              <TextInput id="full_name" name="full_name" defaultValue={usuario.full_name} required />
            </Field>
            <Field label="Correo" htmlFor="email">
              <TextInput id="email" name="email" defaultValue={usuario.email} disabled />
            </Field>
            <Field label="Rol" htmlFor="role">
              <Select id="role" name="role" required defaultValue={usuario.role}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Documento" htmlFor="documento_numero">
              <TextInput id="documento_numero" name="documento_numero" defaultValue={usuario.documento_numero ?? ""} />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <TextInput id="phone" name="phone" defaultValue={usuario.phone ?? ""} />
            </Field>
            <SubmitButton>Guardar cambios</SubmitButton>
          </ActionForm>
        </section>
      </main>
    </>
  );
}
