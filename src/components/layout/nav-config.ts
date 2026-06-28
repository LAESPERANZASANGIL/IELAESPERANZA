import type { Role } from "@/types/roles";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Panel principal",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
    group: "General",
  },
  {
    href: "/administracion/sedes",
    label: "Sedes",
    roles: ["rector", "administrador"],
    group: "Administración",
  },
  {
    href: "/administracion/anios-lectivos",
    label: "Años lectivos",
    roles: ["rector", "administrador"],
    group: "Administración",
  },
  {
    href: "/administracion/usuarios",
    label: "Usuarios",
    roles: ["rector", "administrador"],
    group: "Administración",
  },
  {
    href: "/matricula/procesos",
    label: "Procesos de matrícula",
    roles: ["rector", "administrador", "secretaria"],
    group: "Matrícula",
  },
  {
    href: "/matricula/solicitudes",
    label: "Solicitudes de admisión",
    roles: ["rector", "administrador", "secretaria"],
    group: "Matrícula",
  },
  {
    href: "/estudiantes",
    label: "Estudiantes",
    roles: ["rector", "administrador", "secretaria", "docente"],
    group: "Comunidad",
  },
  {
    href: "/acudientes",
    label: "Acudientes",
    roles: ["rector", "administrador", "secretaria"],
    group: "Comunidad",
  },
  {
    href: "/grados",
    label: "Grados y cursos",
    roles: ["rector", "administrador", "secretaria"],
    group: "Académico",
  },
  {
    href: "/docentes",
    label: "Docentes",
    roles: ["rector", "administrador", "secretaria"],
    group: "Académico",
  },
  {
    href: "/asignaturas",
    label: "Asignaturas",
    roles: ["rector", "administrador", "secretaria", "docente"],
    group: "Académico",
  },
  {
    href: "/periodos",
    label: "Periodos académicos",
    roles: ["rector", "administrador", "secretaria"],
    group: "Académico",
  },
  {
    href: "/notas",
    label: "Notas",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
    group: "Académico",
  },
  {
    href: "/asistencia",
    label: "Asistencia",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
    group: "Académico",
  },
  {
    href: "/mensajeria",
    label: "Mensajería",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
    group: "Comunicación",
  },
  {
    href: "/boletines",
    label: "Boletines",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
    group: "Documentos",
  },
  {
    href: "/certificados",
    label: "Certificados",
    roles: ["rector", "administrador", "secretaria", "padre_familia", "estudiante"],
    group: "Documentos",
  },
];
