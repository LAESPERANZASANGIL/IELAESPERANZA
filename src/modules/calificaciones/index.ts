import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type {
  Asignatura,
  Boletin,
  Estudiante,
  MallaCurricular,
  Matricula,
  Nota,
  PeriodoAcademico,
  TipoEvaluacion,
} from "@/types/database.types";

export const tipoEvaluacionSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  peso_porcentual: z.coerce.number().min(0).max(100).optional(),
});

export const notaEntrySchema = z.object({
  matricula_id: z.string().uuid(),
  tipo_evaluacion_id: z.string().uuid(),
  valor: z.coerce.number().min(0).max(5),
});

export const guardarNotasSchema = z.object({
  malla_curricular_id: z.string().uuid(),
  periodo_academico_id: z.string().uuid(),
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

export async function listTiposEvaluacion(): Promise<TipoEvaluacion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tipos_evaluacion").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return data as TipoEvaluacion[];
}

export async function createTipoEvaluacion(input: z.infer<typeof tipoEvaluacionSchema>) {
  const supabase = await createClient();
  const { error } = await supabase.from("tipos_evaluacion").insert(input);
  if (error) throw new Error(error.message);
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

type EstudianteDeLaPlanilla = {
  matricula_id: string;
  estudiante: Estudiante;
  notas: Nota[];
};

export async function listPlanilla(
  mallaCurricularId: string,
  periodoId: string,
): Promise<{ malla: MallaCurricular & { asignatura: Asignatura }; periodo: PeriodoAcademico; tiposEvaluacion: TipoEvaluacion[]; estudiantes: EstudianteDeLaPlanilla[] }> {
  const supabase = await createClient();

  const { data: malla, error: mallaError } = await supabase
    .from("malla_curricular")
    .select("*, asignatura:asignaturas(*)")
    .eq("id", mallaCurricularId)
    .single();
  if (mallaError) throw new Error(mallaError.message);

  const periodo = await getPeriodo(periodoId);
  const tiposEvaluacion = await listTiposEvaluacion();

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
    .map((m) => ({
      matricula_id: m.id,
      estudiante: m.estudiante,
      notas: notasPorMatricula.get(m.id) ?? [],
    }))
    .sort((a, b) => a.estudiante.apellidos.localeCompare(b.estudiante.apellidos));

  return {
    malla: malla as unknown as MallaCurricular & { asignatura: Asignatura },
    periodo,
    tiposEvaluacion,
    estudiantes,
  };
}

export function calcularPromedio(notas: Nota[], tiposEvaluacion: TipoEvaluacion[]): number | null {
  if (notas.length === 0) return null;

  const pesoPorTipo = new Map(tiposEvaluacion.map((t) => [t.id, t.peso_porcentual]));
  const tienePesos = notas.some((n) => n.tipo_evaluacion_id && pesoPorTipo.get(n.tipo_evaluacion_id));

  if (!tienePesos) {
    const suma = notas.reduce((acc, n) => acc + n.valor, 0);
    return Math.round((suma / notas.length) * 100) / 100;
  }

  let sumaPonderada = 0;
  let sumaPesos = 0;
  for (const nota of notas) {
    const peso = (nota.tipo_evaluacion_id && pesoPorTipo.get(nota.tipo_evaluacion_id)) || 0;
    sumaPonderada += nota.valor * peso;
    sumaPesos += peso;
  }
  if (sumaPesos === 0) return null;
  return Math.round((sumaPonderada / sumaPesos) * 100) / 100;
}

export async function guardarNotas(input: z.infer<typeof guardarNotasSchema>) {
  const periodo = await getPeriodo(input.periodo_academico_id);
  if (periodo.estado === "cerrado") {
    throw new Error("El periodo está cerrado. No se pueden modificar notas.");
  }

  const supabase = await createClient();

  for (const entrada of input.entradas) {
    const { data: existente, error: buscarError } = await supabase
      .from("notas")
      .select("id")
      .eq("matricula_id", entrada.matricula_id)
      .eq("malla_curricular_id", input.malla_curricular_id)
      .eq("periodo_academico_id", input.periodo_academico_id)
      .eq("tipo_evaluacion_id", entrada.tipo_evaluacion_id)
      .is("anulado_en", null)
      .maybeSingle();
    if (buscarError) throw new Error(buscarError.message);

    if (existente) {
      const { error } = await supabase.from("notas").update({ valor: entrada.valor }).eq("id", existente.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("notas").insert({
        matricula_id: entrada.matricula_id,
        malla_curricular_id: input.malla_curricular_id,
        periodo_academico_id: input.periodo_academico_id,
        tipo_evaluacion_id: entrada.tipo_evaluacion_id,
        valor: entrada.valor,
      });
      if (error) throw new Error(error.message);
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
): Promise<{ matricula: Matricula & { estudiante: Estudiante }; periodo: PeriodoAcademico; asignaturas: AsignaturaDelBoletin[] }> {
  const supabase = await createClient();

  const { data: matricula, error: matriculaError } = await supabase
    .from("matriculas")
    .select("*, estudiante:estudiantes(*)")
    .eq("id", matriculaId)
    .single();
  if (matriculaError) throw new Error(matriculaError.message);

  const periodo = await getPeriodo(periodoId);
  const tiposEvaluacion = await listTiposEvaluacion();

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

  const asignaturas = ((mallas ?? []) as unknown as (MallaCurricular & { asignatura: Asignatura })[]).map((malla) => {
    const promedio = calcularPromedio(notasPorMalla.get(malla.id) ?? [], tiposEvaluacion);
    return {
      asignatura: malla.asignatura,
      promedio,
      desempeno: promedio === null ? null : calcularDesempeno(promedio),
    };
  });

  return {
    matricula: matricula as unknown as Matricula & { estudiante: Estudiante },
    periodo,
    asignaturas,
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
