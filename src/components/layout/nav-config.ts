import type { Role } from "@/types/roles";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  group: string;
}

const TODOS: Role[] = ["rector", "administrador", "secretaria", "docente", "padre_familia", "estudiante"];
const STAFF: Role[] = ["rector", "administrador", "secretaria"];
const ADMIN: Role[] = ["rector", "administrador"];

export const NAV_ITEMS: NavItem[] = [
  // ─── General ───────────────────────────────────────────────────────────────
  { href: "/dashboard", label: "Panel principal", roles: TODOS, group: "General" },

  // ─── Administración ────────────────────────────────────────────────────────
  { href: "/administracion/configuracion", label: "Configuración institucional", roles: ADMIN, group: "Administración" },
  { href: "/administracion/sedes",         label: "Sedes",                       roles: ADMIN, group: "Administración" },
  { href: "/administracion/anios-lectivos",label: "Años lectivos",               roles: ADMIN, group: "Administración" },
  { href: "/administracion/usuarios",      label: "Usuarios",                    roles: ADMIN, group: "Administración" },

  // ─── Académico ─────────────────────────────────────────────────────────────
  { href: "/matricula/procesos",    label: "Procesos de matrícula",   roles: STAFF,  group: "Académico" },
  { href: "/matricula/solicitudes", label: "Solicitudes de admisión", roles: STAFF,  group: "Académico" },
  { href: "/estudiantes",           label: "Estudiantes",             roles: [...STAFF, "docente"], group: "Académico" },
  { href: "/acudientes",            label: "Acudientes",              roles: STAFF,  group: "Académico" },
  { href: "/docentes",              label: "Docentes",                roles: STAFF,  group: "Académico" },
  { href: "/grados",                label: "Grados y cursos",         roles: STAFF,  group: "Académico" },
  { href: "/asignaturas",           label: "Asignaturas",             roles: [...STAFF, "docente"], group: "Académico" },
  { href: "/periodos",              label: "Periodos académicos",     roles: STAFF,  group: "Académico" },
  { href: "/carga-academica",       label: "Carga académica",         roles: [...STAFF, "docente"], group: "Académico" },
  { href: "/asistencia",            label: "Asistencia",              roles: TODOS,  group: "Académico" },
  { href: "/notas",                 label: "Planilla de calificaciones", roles: [...STAFF, "docente"], group: "Académico" },
  { href: "/mis-calificaciones",    label: "Mis calificaciones",      roles: ["padre_familia", "estudiante"], group: "Académico" },
  { href: "/boletines",             label: "Boletines",               roles: TODOS,  group: "Académico" },
  { href: "/certificados",          label: "Certificados",            roles: [...STAFF, "padre_familia", "estudiante"], group: "Académico" },

  // ─── Cafetería ─────────────────────────────────────────────────────────────
  { href: "/cafeteria/productos",   label: "Productos",      roles: STAFF, group: "Cafetería" },
  { href: "/cafeteria/categorias",  label: "Categorías",     roles: STAFF, group: "Cafetería" },
  { href: "/cafeteria/ventas",      label: "Ventas",         roles: STAFF, group: "Cafetería" },
  { href: "/cafeteria/gastos",      label: "Gastos",         roles: STAFF, group: "Cafetería" },
  { href: "/cafeteria/balance",     label: "Balance",        roles: ADMIN, group: "Cafetería" },

  // ─── Nómina ────────────────────────────────────────────────────────────────
  { href: "/nomina/empleados",      label: "Empleados",      roles: ADMIN, group: "Nómina" },
  { href: "/nomina/cargos",         label: "Cargos",         roles: ADMIN, group: "Nómina" },
  { href: "/nomina/periodos",       label: "Períodos",       roles: ADMIN, group: "Nómina" },
  { href: "/nomina/novedades",      label: "Novedades",      roles: ADMIN, group: "Nómina" },

  // ─── Cartera ───────────────────────────────────────────────────────────────
  { href: "/cartera/clientes",      label: "Clientes",       roles: STAFF, group: "Cartera" },
  { href: "/cartera/facturas",      label: "Facturas",       roles: STAFF, group: "Cartera" },
  { href: "/cartera/cobros",        label: "Cobros",         roles: STAFF, group: "Cartera" },

  // ─── Contabilidad ──────────────────────────────────────────────────────────
  { href: "/contabilidad/ingresos",   label: "Ingresos",             roles: ADMIN, group: "Contabilidad" },
  { href: "/contabilidad/egresos",    label: "Egresos",              roles: ADMIN, group: "Contabilidad" },
  { href: "/contabilidad/resultado",  label: "Resultado del ejercicio", roles: ADMIN, group: "Contabilidad" },
  { href: "/contabilidad/cuentas",    label: "Plan de cuentas",      roles: ADMIN, group: "Contabilidad" },
  { href: "/contabilidad/periodos",   label: "Períodos contables",   roles: ADMIN, group: "Contabilidad" },

  // ─── Comunicación ──────────────────────────────────────────────────────────
  { href: "/mensajeria", label: "Mensajería", roles: TODOS, group: "Comunicación" },
];
