import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type {
  ActividadEvaluacion,
  Asignatura,
  Boletin,
  Estudiante,
  MallaCurricular,
  Matricula,
  Nota,
  PeriodoAcademico,
} from "@/types/database.types";

export const actividadEvaluacionSchema = z.object({
  malla_curricular_id: z.string().uuid(),
  periodo_academico_id: z.string().uuid(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  peso_porcentual: z.coerce.number().min(0).max(100),
  tipo: z.enum(["normal", "recuperacion", "nivelacion"]).default("normal"),
  orden: z.coerce.number().int().default(0),
});

export const notaEntrySchema = z.object({
  matricula_id: z.string().uuid(),
  actividad_id: z.string().uuid(),
  valor: z.coerce.number().min(0, "La nota debe estar entre 0.0 y 5.0").max(5, "La nota debe estar entre 0.0 y 5.0"),
  observacion: z.string().optional(),
});

export const guardarNotasSchema = z.object({
  malla_curricular_id: z.string().uuid(),
  periodo_academico_id: z.string().uuid(),
  motivo: z.string().optional(),
  entradas: z.array(notaEntrySchema),
});

const DESEMPENO_RANGOS = [
  { hasta: 2.99, nombre: "Bajo" },
  { hasta: 3.99, nombre: "Básico" },
  { hasta: 4.59, nombre: "Alto" },
  { hasta: 5.0, nombre: "Superior" },
] as const;

export function calcularDesempeno(promedio: number): string {
  return DESEMPENO_RANGOS.find((rango) => promedio <= rango.hasta)?.nombre ?? "Superior";
}

export function calcularEstadoAcademico(promedio: number): "aprobado" | "reprobado" {
  return promedio >= 3.0 ? "aprobado" : "reprobado";
}

export async function listActividades(
  mallaCurricularId: string,
  periodoId: string,
): Promise<ActividadEvaluacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actividades_evaluacion")
    .select("*")
    .eq("malla_curricular_id", mallaCurricularId)
    .eq("periodo_academico_id", periodoId)
    .order("orden");
  if (error) throw new Error(error.message);
  return data as ActividadEvaluacion[];
}

export async function crearActividad(input: z.infer<typeof actividadEvaluacionSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("actividades_evaluacion").insert(input);
  if (error) throw new Error(error.message);
}

export async function eliminarActividad(id: string) {
  const supabase = await createClient();
  const { count } = await supabase.from("notas").select("id", { count: "exact", head: true }).eq("actividad_id", id);
  if (count && count > 0) {
    throw new Error("No se puede eliminar: la actividad ya tiene notas registradas.");
  }
  const { error } = await supabase.from("actividades_evaluacion").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

function sumaPesos(actividades: ActividadEvaluacion[]): number {
  return actividades.reduce((acc, a) => acc + Number(a.peso_porcentual), 0);
}

async function getPeriodo(periodoId: string): Promise<PeriodoAcademico> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periodos_academicos")
    .select("*")
    .eq("id", periodoId)
    .single();
  if (error) throw new Error(error.message);
  return data as PeriodoAcademico;
}

async function getMatricula(matriculaId: string): Promise<Matricula> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("matriculas").select("*").eq("id", matriculaId).single();
  if (error) throw new Error(error.message);
  return data as Matricula;
}

type EstudianteDeLaPlanilla = {
  matricula_id: string;
  estudiante: Estudiante;
  notas: Nota[];
  promedio: number | null;
  desempeno: string | null;
};

export async function listPlanilla(
  mallaCurricularId: string,
  periodoId: string,
): Promise<{
  malla: MallaCurricular & { asignatura: Asignatura };
  periodo: PeriodoAcademico;
  actividades: ActividadEvaluacion[];
  estudiantes: EstudianteDeLaPlanilla[];
}> {
  const supabase = await createClient();

  const { data: malla, error: mallaError } = await supabase
    .from("malla_curricular")
    .select("*, asignatura:asignaturas(*)")
    .eq("id", mallaCurricularId)
    .single();
  if (mallaError) throw new Error(mallaError.message);

  const periodo = await getPeriodo(periodoId);
  const actividades = await listActividades(mallaCurricularId, periodoId);

  const { data: matriculas, error: matriculasError } = await supabase
    .from("matriculas")
    .select("id, estudiante:estudiantes(*)")
    .eq("grupo_id", malla.grupo_id)
    .eq("anio_lectivo_id", periodo.anio_lectivo_id)
    .eq("estado", "activa");
  if (matriculasError) throw new Error(matriculasError.message);

  const matriculaIds = (matriculas ?? []).map((m) => m.id as string);

  const { data: notas, error: notasError } = await supabase
    .from("notas")
    .select("*")
    .eq("malla_curricular_id", mallaCurricularId)
    .eq("periodo_academico_id", periodoId)
    .in("matricula_id", matriculaIds.length > 0 ? matriculaIds : [""])
    .is("anulado_en", null);
  if (notasError) throw new Error(notasError.message);

  const notasPorMatricula = new Map<string, Nota[]>();
  for (const nota of (notas ?? []) as Nota[]) {
    const lista = notasPorMatricula.get(nota.matricula_id) ?? [];
    lista.push(nota);
    notasPorMatricula.set(nota.matricula_id, lista);
  }

  const estudiantes = ((matriculas ?? []) as unknown as { id: string; estudiante: Estudiante }[])
    .map((m) => {
      const notasEstudiante = notasPorMatricula.get(m.id) ?? [];
      const promedio = calcularPromedio(notasEstudiante, actividades);
      return {
        matricula_id: m.id,
        estudiante: m.estudiante,
        notas: notasEstudiante,
        promedio,
        desempeno: promedio === null ? null : calcularDesempeno(promedio),
      };
    })
    .sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));

  return { malla: malla as unknown as MallaCurricular & { asignatura: Asignatura }, periodo, actividades, estudiantes };
}

export function calcularPromedio(notas: Nota[], actividades: ActividadEvaluacion[]): number | null {
  if (notas.length === 0) return null;

  const pesoPorActividad = new Map(actividades.map((a) => [a.id, Number(a.peso_porcentual)]));
  const totalPesos = sumaPesos(actividades);

  if (totalPesos <= 0) {
    const suma = notas.reduce((acc, n) => acc + n.valor, 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  let sumaPonderada = 0;
  let sumaPesosUsados = 0;
  for (const nota of notas) {
    const peso = (nota.actividad_id && pesoPorActividad.get(nota.actividad_id)) || 0;
    sumaPonderada += nota.valor * peso;
    sumaPesosUsados += peso;
  }
  if (sumaPesosUsados === 0) return null;
  return Math.round((sumaPonderada / sumaPesosUsados) * 100) / 100;
}

async function registrarAuditoria(params: {
  profileId: string;
  registroId: string;
  accion: string;
  datosAntes: unknown;
  datosDespues: unknown;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("logs_auditoria").insert({
    profile_id: params.profileId,
    tabla: "notas",
    registro_id: params.registroId,
    accion: params.accion,
    datos_antes: params.datosAntes,
    datos_despues: params.datosDespues,
  });
  if (error) throw new Error(error.message);
}

export async function guardarNotas(input: z.infer<typeof guardarNotasSchema>, docenteId: string) {
  const periodo = await getPeriodo(input.periodo_academico_id);
  if (periodo.estado === "cerrado") {
    throw new Error("El periodo está cerrado. No se pueden modificar notas.");
  }

  const supabase = await createClient();

  for (const entrada of input.entradas) {
    const matricula = await getMatricula(entrada.matricula_id);
    if (matricula.estado !== "activa") {
      throw new Error("El estudiante no tiene una matrícula activa. No se pueden registrar notas.");
    }

    const { data: existente, error: buscarError } = await supabase
      .from("notas")
      .select("*")
      .eq("matricula_id", entrada.matricula_id)
      .eq("malla_curricular_id", input.malla_curricular_id)
      .eq("periodo_academico_id", input.periodo_academico_id)
      .eq("actividad_id", entrada.actividad_id)
      .is("anulado_en", null)
      .maybeSingle();
    if (buscarError) throw new Error(buscarError.message);

    if (existente) {
      if (existente.valor === entrada.valor) continue;
      const { data: actualizado, error } = await supabase
        .from("notas")
        .update({ valor: entrada.valor, observacion: entrada.observacion ?? existente.observacion })
        .eq("id", existente.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await registrarAuditoria({
        profileId: docenteId,
        registroId: existente.id,
        accion: "actualizar_nota",
        datosAntes: { valor: existente.valor, motivo: input.motivo ?? null },
        datosDespues: { valor: actualizado.valor, motivo: input.motivo ?? null },
      });
    } else {
      const { data: creado, error } = await supabase
        .from("notas")
        .insert({
          matricula_id: entrada.matricula_id,
          malla_curricular_id: input.malla_curricular_id,
          periodo_academico_id: input.periodo_academico_id,
          actividad_id: entrada.actividad_id,
          valor: entrada.valor,
          observacion: entrada.observacion ?? null,
          docente_id: docenteId,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await registrarAuditoria({
        profileId: docenteId,
        registroId: creado.id,
        accion: "crear_nota",
        datosAntes: null,
        datosDespues: { valor: creado.valor, motivo: input.motivo ?? null },
      });
    }
  }
}

type AsignaturaDelBoletin = {
  asignatura: Asignatura;
  promedio: number | null;
  desempeno: string | null;
};

export async function calcularBoletin(
  matriculaId: string,
  periodoId: string,
): Promise<{
  matricula: Matricula & { estudiante: Estudiante };
  periodo: PeriodoAcademico;
  asignaturas: AsignaturaDelBoletin[];
  promedioGeneral: number | null;
}> {
  const supabase = await createClient();

  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .select("*, estudiante:estudiantes(*)")
    .eq("id", matriculaId)
    .single();
  if (matriculaError) throw new Error(matriculaError.message);

  const periodo = await getPeriodo(periodoId);

  const { data: mallas, error: mallasError } = await supabase
    .from("malla_curricular")
    .select("*, asignatura:asignaturas(*)")
    .eq("grupo_id", matricula.grupo_id);
  if (mallasError) throw new Error(mallasError.message);

  const { data: notas, error: notasError } = await supabase
    .from("notas")
    .select("*")
    .eq("matricula_id", matriculaId)
    .eq("periodo_academico_id", periodoId)
    .is("anulado_en", null);
  if (notasError) throw new Error(notasError.message);

  const notasPorMalla = new Map<string, Nota[]>();
  for (const nota of (notas ?? []) as Nota[]) {
    const lista = notasPorMalla.get(nota.malla_curricular_id) ?? [];
    lista.push(nota);
    notasPorMalla.set(nota.malla_curricular_id, lista);
  }

  const asignaturas: AsignaturaDelBoletin[] = [];
  for (const malla of (mallas ?? []) as unknown as (MallaCurricular & { asignatura: Asignatura })[]) {
    const actividades = await listActividades(malla.id, periodoId);
    const promedio = calcularPromedio(notasPorMalla.get(malla.id) ?? [], actividades);
    asignaturas.push({
      asignatura: malla.asignatura,
      promedio,
      desempeno: promedio === null ? null : calcularDesempeno(promedio),
    });
  }

  const promediosValidos = asignaturas.map((a) => a.promedio).filter((p): p is number => p !== null);
  const promedioGeneral =
    promediosValidos.length === 0
      ? null
      : Math.round((promediosValidos.reduce((acc, p) => acc + p, 0) / promediosValidos.length) * 100) / 100;

  return {
    matricula: matricula as unknown as Matricula & { estudiante: Estudiante },
    periodo,
    asignaturas,
    promedioGeneral,
  };
}

export async function generarBoletin(matriculaId: string, periodoId: string, generadoPor: string): Promise<Boletin> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boletines")
    .upsert(
      {
        matricula_id: matriculaId,
        periodo_academico_id: periodoId,
        generado_en: new Date().toISOString(),
        generado_por: generadoPor,
      },
      { onConflict: "matricula_id,periodo_academico_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as Boletin;
}

export async function listBoletinesDeGrupo(grupoId: string, anioLectivoId: string): Promise<{ matricula_id: string; estudiante: Estudiante; boletin: Boletin | null }[]> {
  const supabase = await createClient();
  const { data: matriculas, error } = await supabase
    .from("matriculas")
    .select("id, estudiante:estudiantes(*)")
    .eq("grupo_id", grupoId)
    .eq("anio_lectivo_id", anioLectivoId)
    .eq("estado", "activa");
  if (error) throw new Error(error.message);

  const matriculaIds = (matriculas ?? []).map((m) => m.id as string);
  const { data: boletines, error: boletinesError } = await supabase
    .from("boletines")
    .select("*")
    .in("matricula_id", matriculaIds.length > 0 ? matriculaIds : [""]);
  if (boletinesError) throw new Error(boletinesError.message);

  const boletinPorMatricula = new Map((boletines as Boletin[] | null ?? []).map((b) => [b.matricula_id, b]));

  return ((matriculas ?? []) as unknown as { id: string; estudiante: Estudiante }[])
    .map((m) => ({
      matricula_id: m.id,
      estudiante: m.estudiante,
      boletin: boletinPorMatricula.get(m.id) ?? null,
    }))
    .sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));
}

export async function listPromedioAnual(
  matriculaId: string,
  asignaturaId: string,
  anioLectivoId: string,
): Promise<{ promedioAnual: number | null; estadoAcademico: "aprobado" | "reprobado" | null }> {
  const supabase = await createClient();

  const { data: periodos, error: periodosError } = await supabase
    .from("periodos_academicos")
    .select("id")
    .eq("anio_lectivo_id", anioLectivoId);
  if (periodosError) throw new Error(periodosError.message);

  const { data: malla, error: mallaError } = await supabase
    .from("malla_curricular")
    .select("id, grupo_id")
    .eq("asignatura_id", asignaturaId)
    .eq("grupo_id", (await getMatricula(matriculaId)).grupo_id)
    .maybeSingle();
  if (mallaError) throw new Error(mallaError.message);
  if (!malla) return { promedioAnual: null, estadoAcademico: null };

  const promedios: number[] = [];
  for (const periodo of periodos ?? []) {
    const actividades = await listActividades(malla.id, periodo.id);
    const { data: notas, error: notasError } = await supabase
      .from("notas")
      .select("*")
      .eq("matricula_id", matriculaId)
      .eq("malla_curricular_id", malla.id)
      .eq("periodo_academico_id", periodo.id)
      .is("anulado_en", null);
    if (notasError) throw new Error(notasError.message);
    const promedio = calcularPromedio((notas ?? []) as Nota[], actividades);
    if (promedio !== null) promedios.push(promedio);
  }

  if (promedios.length === 0) return { promedioAnual: null, estadoAcademico: null };
  const promedioAnual = Math.round((promedios.reduce((acc, p) => acc + p, 0) / promedios.length) * 100) / 100;
  return { promedioAnual, estadoAcademico: calcularEstadoAcademico(promedioAnual) };
}
