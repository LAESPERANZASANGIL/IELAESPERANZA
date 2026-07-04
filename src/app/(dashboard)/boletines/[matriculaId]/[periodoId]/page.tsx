import { Header } from "@/components/layout/Header";
import { PrintButton } from "@/components/ui/PrintButton";
import { calcularBoletin } from "@/modules/calificaciones";
import { getInstitucionConfig } from "@/modules/institucion";
import { listProfiles } from "@/modules/core";

const DES_COLOR: Record<string, string> = {
  Bajo: "text-red-700",
  Básico: "text-amber-700",
  Alto: "text-green-700",
  Superior: "text-blue-700",
};

export default async function BoletinPage({
  params,
}: {
  params: Promise<{ matriculaId: string; periodoId: string }>;
}) {
  const { matriculaId, periodoId } = await params;
  const [boletin, config] = await Promise.all([
    calcularBoletin(matriculaId, periodoId),
    getInstitucionConfig(),
  ]);
  const { promedioGeneral } = boletin;

  const rector = config?.rector_id
    ? (await listProfiles("rector")).find((p) => p.id === config.rector_id)
    : null;

  const nombreInst = config?.nombre ?? "Institución Educativa La Esperanza";
  const escudoUrl = config?.escudo_url ?? config?.logo_url ?? "";
  const directorGrupo = boletin.matricula.grupo?.director?.full_name ?? "";

  return (
    <>
      <div className="print:hidden">
        <Header title="Boletín de calificaciones" />
      </div>
      <main className="p-6 print:p-0">
        <div className="mb-4 flex justify-end print:hidden">
          <PrintButton>Imprimir / Guardar PDF</PrintButton>
        </div>

        {/* Hoja del boletín */}
        <div className="mx-auto max-w-4xl border-2 border-slate-800 bg-white p-6 text-[13px] leading-snug text-slate-900 print:border-0 print:p-2">

          {/* ── Encabezado institucional ── */}
          <div className="flex items-start gap-4">
            <div className="w-24 shrink-0">
              {escudoUrl ? (
                <img src={escudoUrl} alt="Escudo" className="h-24 w-24 object-contain" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full text-xl font-extrabold text-white" style={{ background: "#0B6B3A" }}>
                  IE
                </div>
              )}
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-extrabold uppercase tracking-wide">{nombreInst}</h1>
              {config?.enfasis && <p className="text-sm font-bold uppercase">{config.enfasis}</p>}
              {config?.resolucion && <p className="text-xs">{config.resolucion}</p>}
              {config?.secretaria_educacion && <p className="text-xs">{config.secretaria_educacion}</p>}
              {config?.slogan && <p className="mt-1 text-xs italic">&ldquo;{config.slogan}&rdquo;</p>}
              <p className="mt-2 text-sm font-bold uppercase tracking-widest">Informe valorativo</p>
            </div>
            <div className="w-24 shrink-0" />
          </div>

          {/* ── Datos del estudiante ── */}
          <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2">
            <p><span className="font-bold">Estudiante:</span> {boletin.matricula.estudiante.apellidos} {boletin.matricula.estudiante.nombres}</p>
            <p><span className="font-bold">Director de Grupo:</span> {directorGrupo || "—"}</p>
            <p><span className="font-bold">Grupo:</span> {boletin.matricula.grupo?.grado?.nombre ?? ""} {boletin.matricula.grupo?.nombre ?? ""}</p>
            <p><span className="font-bold">Periodo:</span> {boletin.periodo.nombre}</p>
            <p><span className="font-bold">Año lectivo:</span> {boletin.matricula.anio?.anio ?? ""}</p>
          </div>

          {/* ── Tabla de asignaturas ── */}
          <table className="mt-4 w-full border-collapse text-[12px]">
            <thead>
              <tr className="text-white" style={{ background: "#1E4E8C" }}>
                <th className="border border-slate-400 px-2 py-1.5 text-left uppercase">Área / Asignatura</th>
                <th className="border border-slate-400 px-2 py-1.5 uppercase">Cal</th>
                <th className="border border-slate-400 px-2 py-1.5 uppercase">Desempeño</th>
              </tr>
            </thead>
            <tbody>
              {boletin.asignaturas.map((fila, idx) => (
                <tr key={fila.asignatura.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="border border-slate-300 px-2 py-1 font-semibold uppercase">{fila.asignatura.nombre}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">{fila.promedio?.toFixed(1) ?? "—"}</td>
                  <td className={`border border-slate-300 px-2 py-1 text-center font-bold uppercase ${fila.desempeno ? DES_COLOR[fila.desempeno] ?? "" : ""}`}>
                    {fila.desempeno ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#DFF3E4" }}>
                <td className="border border-slate-400 px-2 py-1.5 font-bold">Promedio Académico</td>
                <td className="border border-slate-400 px-2 py-1.5 text-center font-bold">{promedioGeneral?.toFixed(1) ?? "—"}</td>
                <td className="border border-slate-400 px-2 py-1.5 text-center font-bold uppercase">
                  {promedioGeneral !== null ? (
                    <span className={DES_COLOR[desempenoDe(promedioGeneral)] ?? ""}>{desempenoDe(promedioGeneral)}</span>
                  ) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── Escala de valoración + observaciones ── */}
          <div className="mt-4 grid gap-4 sm:grid-cols-[240px_1fr]">
            <div className="border border-slate-400 p-2">
              <p className="text-xs font-bold underline">Escala de Valoración:</p>
              <ul className="mt-1 space-y-0.5 text-[11px]">
                <li>· BJ: BAJO: 1.0 - 2.9</li>
                <li>· BS: BÁSICO: 3.0 - 3.9</li>
                <li>· AL: ALTO: 4.0 - 4.5</li>
                <li>· SUP: SUPERIOR: 4.6 - 5.0</li>
              </ul>
            </div>
            <div className="border border-slate-400 p-2">
              <p className="text-xs font-bold">Observaciones:</p>
              <div className="h-16" />
            </div>
          </div>

          {/* ── Firmas ── */}
          <div className="mt-14 grid grid-cols-2 gap-12 px-6 text-center">
            <div>
              <div className="border-t border-slate-800 pt-1">
                {rector && <p className="text-xs font-semibold uppercase">{rector.full_name}</p>}
                <p className="text-xs">Rector(a)</p>
              </div>
            </div>
            <div>
              <div className="border-t border-slate-800 pt-1">
                {directorGrupo && <p className="text-xs font-semibold uppercase">{directorGrupo}</p>}
                <p className="text-xs">Director(a) de Grupo</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function desempenoDe(promedio: number): string {
  if (promedio <= 2.99) return "Bajo";
  if (promedio <= 3.99) return "Básico";
  if (promedio <= 4.59) return "Alto";
  return "Superior";
}
