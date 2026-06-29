import { Header } from "@/components/layout/Header";
import { Table, Thead, Th, Tbody, Td } from "@/components/ui/Table";
import { PrintButton } from "@/components/ui/PrintButton";
import { calcularBoletin } from "@/modules/calificaciones";

export default async function BoletinPage({
  params,
}: {
  params: Promise<{ matriculaId: string; periodoId: string }>;
}) {
  const { matriculaId, periodoId } = await params;
  const boletin = await calcularBoletin(matriculaId, periodoId);

  const promedios = boletin.asignaturas.map((a) => a.promedio).filter((p): p is number => p !== null);
  const promedioGeneral = promedios.length > 0 ? Math.round((promedios.reduce((a, b) => a + b, 0) / promedios.length) * 100) / 100 : null;

  return (
    <>
      <Header title="Boletín de calificaciones" />
      <main className="space-y-6 p-6 print:p-0">
        <div className="rounded-xl border border-slate-200 bg-white p-6 print:border-none">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {boletin.matricula.estudiante.apellidos} {boletin.matricula.estudiante.nombres}
              </h2>
              <p className="text-sm text-slate-500">Periodo: {boletin.periodo.nombre}</p>
            </div>
            <PrintButton>Imprimir / Guardar PDF</PrintButton>
          </div>

          <Table>
            <Thead>
              <Th>Asignatura</Th>
              <Th>Promedio</Th>
              <Th>Desempeño</Th>
            </Thead>
            <Tbody>
              {boletin.asignaturas.map((fila) => (
                <tr key={fila.asignatura.id}>
                  <Td>{fila.asignatura.nombre}</Td>
                  <Td>{fila.promedio ?? "—"}</Td>
                  <Td>{fila.desempeno ?? "—"}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>

          <div className="mt-6 text-right text-sm font-semibold text-slate-900">
            Promedio general del periodo: {promedioGeneral ?? "—"}
          </div>
        </div>
      </main>
    </>
  );
}
