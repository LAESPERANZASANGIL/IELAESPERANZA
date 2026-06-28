// Tipos manuales que reflejan el esquema en supabase/migrations.
// Cuando el proyecto Supabase exista, reemplazar con:
//   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts

export type UserRole =
  | "rector"
  | "administrador"
  | "secretaria"
  | "docente"
  | "padre_familia"
  | "estudiante";

export type EstadoMatricula = "activo" | "retirado" | "graduado" | "trasladado";
export type EstadoPeriodo = "planeado" | "activo" | "cerrado";
export type EstadoAsistencia = "presente" | "ausente" | "tarde" | "excusa";
export type EstadoCertificado =
  | "solicitado"
  | "en_proceso"
  | "generado"
  | "entregado"
  | "rechazado";
export type TipoCertificado = "estudio" | "conducta" | "notas" | "paz_y_salvo";
export type NivelEducativo = "preescolar" | "primaria" | "secundaria" | "media";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  documento: string | null;
  avatar_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grado {
  id: string;
  nombre: string;
  nivel: NivelEducativo;
  orden: number;
  created_at: string;
}

export interface Grupo {
  id: string;
  grado_id: string;
  nombre: string;
  anio_lectivo: number;
  director_grupo_id: string | null;
  capacidad: number | null;
  created_at: string;
}

export interface Docente {
  id: string;
  especialidad: string | null;
  fecha_ingreso: string | null;
  created_at: string;
}

export interface Estudiante {
  id: string;
  fecha_nacimiento: string | null;
  grupo_id: string | null;
  estado: EstadoMatricula;
  fecha_matricula: string;
  created_at: string;
}

export interface EstudianteAcudiente {
  estudiante_id: string;
  acudiente_id: string;
  parentesco: string | null;
}

export interface Asignatura {
  id: string;
  nombre: string;
  area: string | null;
  descripcion: string | null;
  created_at: string;
}

export interface PeriodoAcademico {
  id: string;
  nombre: string;
  anio_lectivo: number;
  fecha_inicio: string;
  fecha_fin: string;
  orden: number;
  estado: EstadoPeriodo;
  created_at: string;
}

export interface AsignaturaGrupo {
  id: string;
  grupo_id: string;
  asignatura_id: string;
  docente_id: string | null;
  intensidad_horaria: number | null;
  created_at: string;
}

export interface Nota {
  id: string;
  estudiante_id: string;
  asignatura_grupo_id: string;
  periodo_id: string;
  valor: number;
  descripcion: string | null;
  docente_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asistencia {
  id: string;
  estudiante_id: string;
  grupo_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  registrado_por: string | null;
  created_at: string;
}

export interface Mensaje {
  id: string;
  remitente_id: string;
  destinatario_id: string;
  asunto: string;
  contenido: string;
  leido: boolean;
  parent_id: string | null;
  created_at: string;
}

export interface Boletin {
  id: string;
  estudiante_id: string;
  periodo_id: string;
  url_pdf: string | null;
  generado_en: string | null;
  generado_por: string | null;
  created_at: string;
}

export interface Certificado {
  id: string;
  estudiante_id: string;
  tipo: TipoCertificado;
  estado: EstadoCertificado;
  url_pdf: string | null;
  solicitado_por: string | null;
  generado_por: string | null;
  generado_en: string | null;
  created_at: string;
}
