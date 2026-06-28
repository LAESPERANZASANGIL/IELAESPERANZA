import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { listGrados } from "@/modules/academico";
import { createGradoAction } from "./actions";

const NIVELES = ["preescolar", "primaria", "secundaria", "media"] as const;

export default async function GradosPage() {
  const grados = await listGrados();

  return (
    <>
      <Header title="Grados y cursos" />
      <main className="grid gap-6 p-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {grados.length === 0 ? (
            <EmptyState title="Aún no hay grados registrados" />
          ) : (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Nivel</Th>
                <Th>Orden</Th>
                <Th>{""}</Th>
              </Thead>
              <Tbody>
                {grados.map((grado) => (
                  <tr key={grado.id}>
                    <Td>{grado.nombre}</Td>
                    <Td>{grado.nivel}</Td>
                    <Td>{grado.orden}</Td>
                    <Td>
                      <Link className="text-sm font-medium text-brand-700 hover:underline" href={`/grados/${grado.id}`}>
                        Ver grupos
                      </Link>
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Nuevo grado</h2>
          <form action={createGradoAction} className="space-y-4">
            <Field label="Nombre" htmlFor="nombre">
              <TextInput id="nombre" name="nombre" required />
            </Field>
            <Field label="Nivel" htmlFor="nivel">
              <Select id="nivel" name="nivel" required defaultValue="">
                <option value="" disabled>
                  Selecciona un nivel
                </option>
                {NIVELES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Orden" htmlFor="orden">
              <TextInput id="orden" name="orden" type="number" defaultValue={0} />
            </Field>
            <SubmitButton>Crear grado</SubmitButton>
          </form>
        </section>
      </main>
    </>
  );
}
