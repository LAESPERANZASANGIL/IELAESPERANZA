export const ROLES = [
  "rector",
  "administrador",
  "secretaria",
  "docente",
  "padre_familia",
  "estudiante",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  rector: "Rector",
  administrador: "Administrador",
  secretaria: "Secretaría",
  docente: "Docente",
  padre_familia: "Padre de familia",
  estudiante: "Estudiante",
};

export const STAFF_ROLES: Role[] = ["rector", "administrador", "secretaria"];
