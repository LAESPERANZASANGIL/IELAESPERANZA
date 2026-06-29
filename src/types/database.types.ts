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

export type EstadoAnioLectivo = "planeado" | "activo" | "cerrado";
export type EstadoProcesoMatricula = "planeado" | "abierto" | "cerrado";
export type EstadoSolicitudAdmision = "pendiente" | "en_revision" | "admitido" | "rechazado";
export type EstadoMatricula = "activa" | "retirada" | "trasladada" | "graduada";
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
export type Jornada = "mañana" | "tarde" | "noche";

export interface Sede {
  id: string;
  nombre: string;
  codigo_dane: string | null;
  direccion: string | null;
  telefono: string | null;
  activa: boolean;
  created_at: string;
}

export interface AnioLectivo {
  id: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoAnioLectivo;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  documento_tipo: string | null;
  documento_numero: string | null;
  avatar_url: string | null;
  sede_id: string | null;
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
  anio_lectivo_id: string;
  sede_id: string | null;
  nombre: string;
  director_grupo_id: string | null;
  capacidad: number | null;
  jornada: Jornada | null;
  created_at: string;
}

export interface Docente {
  id: string;
  especialidad: string | null;
  tipo_contrato: string | null;
  fecha_ingreso: string | null;
  created_at: string;
}

export interface InstitucionConfig {
  id: string;
  nombre: string;
  nit: string | null;
  codigo_dane: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  rector_id: string | null;
  escudo_url: string | null;
  logo_url: string | null;
  anio_lectivo_activo_id: string | null;
  created_at: string;
  updated_at: string;
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
  anio_lectivo_id: string;
  nombre: string;
  orden: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPeriodo;
  created_at: string;
}

export interface MallaCurricular {
  id: string;
  grupo_id: string;
  asignatura_id: string;
  docente_id: string | null;
  intensidad_horaria: number | null;
  created_at: string;
}

export interface Estudiante {
  id: string;
  profile_id: string | null;
  documento_tipo: string | null;
  documento_numero: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  genero: string | null;
  estado_general: string;
  created_at: string;
}

export interface Acudiente {
  id: string;
  ocupacion: string | null;
  lugar_trabajo: string | null;
  created_at: string;
}

export interface EstudianteAcudiente {
  estudiante_id: string;
  acudiente_id: string;
  parentesco: string | null;
  es_acudiente_principal: boolean;
}

export interface ProcesoMatricula {
  id: string;
  anio_lectivo_id: string;
  nombre: string;
  fecha_apertura: string;
  fecha_cierre: string;
  estado: EstadoProcesoMatricula;
  created_at: string;
}

export interface SolicitudAdmision {
  id: string;
  proceso_matricula_id: string;
  aspirante_nombres: string;
  aspirante_apellidos: string;
  aspirante_documento: string | null;
  fecha_nacimiento: string | null;
  grado_solicitado_id: string | null;
  acudiente_id: string | null;
  estado: EstadoSolicitudAdmision;
  documentos_adjuntos: unknown[];
  observaciones: string | null;
  revisado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Matricula {
  id: string;
  estudiante_id: string;
  anio_lectivo_id: string;
  grupo_id: string;
  proceso_matricula_id: string | null;
  solicitud_admision_id: string | null;
  estado: EstadoMatricula;
  fecha_matricula: string;
  fecha_retiro: string | null;
  motivo_retiro: string | null;
  created_at: string;
  updated_at: string;
}

export interface TipoEvaluacion {
  id: string;
  nombre: string;
  peso_porcentual: number | null;
}

export interface Nota {
  id: string;
  matricula_id: string;
  malla_curricular_id: string;
  periodo_academico_id: string;
  tipo_evaluacion_id: string | null;
  valor: number;
  descripcion: string | null;
  docente_id: string | null;
  anulado_en: string | null;
  anulado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asistencia {
  id: string;
  matricula_id: string;
  grupo_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string | null;
  registrado_por: string | null;
  created_at: string;
}

export interface TipoFalta {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
}

export interface ObservadorEstudiante {
  id: string;
  matricula_id: string;
  tipo_falta_id: string | null;
  descripcion: string;
  fecha: string;
  reportado_por: string | null;
  seguimiento_requerido: boolean;
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
  matricula_id: string;
  periodo_academico_id: string;
  url_pdf: string | null;
  generado_en: string | null;
  generado_por: string | null;
  created_at: string;
}

export interface Certificado {
  id: string;
  estudiante_id: string;
  anio_lectivo_id: string | null;
  tipo: TipoCertificado;
  estado: EstadoCertificado;
  url_pdf: string | null;
  solicitado_por: string | null;
  generado_por: string | null;
  generado_en: string | null;
  created_at: string;
}

export interface LogAuditoria {
  id: string;
  profile_id: string | null;
  tabla: string;
  registro_id: string | null;
  accion: string;
  datos_antes: unknown;
  datos_despues: unknown;
  created_at: string;
}
