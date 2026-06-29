# Campus La Esperanza

Plataforma de gestión académica de la Institución Educativa La Esperanza. Construida con Next.js (App Router), TypeScript, Tailwind CSS y Supabase (PostgreSQL).

> Nombre del proyecto: **Campus La Esperanza** (antes "IE La Esperanza — Sistema académico"). Ver `docs/adr/0002-rebranding-campus-la-esperanza.md` para el detalle del cambio.

## Roles

`rector`, `administrador`, `secretaria`, `docente`, `padre_familia`, `estudiante`.

## Identidad visual

La identidad institucional se define como tokens de color en `src/app/globals.css` (`--color-brand-*`, `--color-accent-*`) y se consume vía clases de Tailwind (`bg-brand-600`, `text-accent-700`, etc.). No hay logotipo definitivo todavía: la marca actual usa un monograma de texto ("CE") como placeholder.

- **Brand** (verde institucional): identidad principal, navegación activa, botones primarios.
- **Accent** (dorado): acentos secundarios, indicadores y avatares.

## Estructura

```
src/
  app/
    login/                 Página de inicio de sesión
    auth/callback/         Callback de Supabase Auth
    (dashboard)/           Rutas protegidas con shell de navegación según rol
      dashboard/           Panel principal por rol
      administracion/      Configuración institucional, sedes, años lectivos, usuarios
      matricula/           Procesos de matrícula y solicitudes de admisión
      estudiantes/         Módulo de estudiantes
      acudientes/          Módulo de acudientes
      grados/               Módulo de grados, grupos y malla curricular
      docentes/            Módulo de docentes
      asignaturas/         Módulo de asignaturas
      periodos/            Módulo de periodos académicos
      notas/               Módulo de notas
      asistencia/          Módulo de asistencia/fallas
      mensajeria/          Módulo de mensajería
      boletines/           Módulo de boletines en PDF
      certificados/        Módulo de certificados institucionales
  components/
    ui/                    Primitivas de interfaz (Card, Badge, EmptyState, Table, Field)
    layout/                DashboardShell, Sidebar, Header, configuración de navegación por rol
    auth/                  Formulario de login y botón de logout
  modules/                 Lógica de dominio (esquemas zod + acceso a datos) por módulo
  lib/
    supabase/              Clientes de Supabase (browser, server, admin, middleware)
    auth/                  Helpers de sesión (perfil actual, rutas protegidas)
  types/
    roles.ts               Roles del sistema
    database.types.ts      Tipos que reflejan el esquema de base de datos
  proxy.ts                 Middleware de Next.js: protege rutas y refresca sesión
supabase/
  migrations/              Esquema SQL (tablas, enums, RLS por rol)
docs/
  adr/                     Decisiones de arquitectura
```

La UI (`src/app/`) depende de la lógica de dominio (`src/modules/`); nunca al revés.

## Configuración

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia `.env.local.example` a `.env.local` y completa las claves del proyecto.
3. Aplica las migraciones de `supabase/migrations/` (ver `supabase/README.md`).
4. Crea usuarios en Supabase Auth y su fila correspondiente en `profiles` con el `role` adecuado.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Convención de estado y auditoría

Todas las tablas principales (`sedes`, `profiles`, `grados`, `grupos`, `asignaturas`, `docentes`, `estudiantes`, `acudientes`, `matriculas`, `periodos_academicos`, `anios_lectivos`, `malla_curricular`, `actividades_evaluacion`, `notas`, `institucion_config`, `procesos_matricula`, `solicitudes_admision`) tienen `created_at`, `updated_at`, `created_by` y `updated_by`, completados automáticamente por el trigger `set_audit_fields()` (ver `supabase/migrations/0006_estandarizacion_estado_auditoria.sql`).

Para estado activo/inactivo binario se usa exclusivamente la columna `is_active` (booleano) en las entidades de activación simple: `sedes`, `profiles`, `grados`, `grupos`, `asignaturas` y `estudiantes` (ver `supabase/migrations/0007_is_active_asignaturas_estudiantes.sql`). Los docentes no tienen columna propia: su estado se hereda de `profiles.is_active` (`docentes.id` referencia `profiles.id` 1:1). No usar `activo`, `activa`, `estado_general`, `enabled` ni `status` para este fin.

Las entidades con ciclo de vida de más de dos estados (`anios_lectivos`, `periodos_academicos`, `matriculas`, `procesos_matricula`, `solicitudes_admision`, `asistencia`, `certificados`) conservan su columna `estado` con su propio enum — no son binarias y no deben forzarse a `is_active`.

## Próximos pasos

El núcleo de Fase 1 (administración, matrícula, estudiantes/acudientes y académico) ya tiene pantallas funcionales. La Fase 2 (núcleo institucional) agregó configuración institucional (`administracion/configuracion`), jornada y director de grupo en `grupos`, y edición de estudiantes/docentes — ver `supabase/migrations/0003_nucleo_institucional.sql`. Los módulos restantes (notas, asistencia, mensajería, boletines en PDF y certificados) están planteados con pantallas iniciales; su funcionalidad CRUD y los reportes en PDF se implementarán de forma incremental, módulo por módulo, según `MASTER_PLAN.md`.
