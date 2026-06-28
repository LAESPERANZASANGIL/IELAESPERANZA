import type { Role } from "@/types/roles";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Panel principal",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
  },
  {
    href: "/estudiantes",
    label: "Estudiantes",
    roles: ["rector", "administrador", "secretaria", "docente"],
  },
  {
    href: "/grados",
    label: "Grados y cursos",
    roles: ["rector", "administrador", "secretaria"],
  },
  {
    href: "/docentes",
    label: "Docentes",
    roles: ["rector", "administrador", "secretaria"],
  },
  {
    href: "/asignaturas",
    label: "Asignaturas",
    roles: ["rector", "administrador", "secretaria", "docente"],
  },
  {
    href: "/periodos",
    label: "Periodos académicos",
    roles: ["rector", "administrador", "secretaria"],
  },
  {
    href: "/notas",
    label: "Notas",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
  },
  {
    href: "/asistencia",
    label: "Asistencia",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
  },
  {
    href: "/mensajeria",
    label: "Mensajería",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
  },
  {
    href: "/boletines",
    label: "Boletines",
    roles: ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"],
  },
  {
    href: "/certificados",
    label: "Certificados",
    roles: ["rector", "administrador", "secretaria", "padre_familia", "estudiante"],
  },
];
