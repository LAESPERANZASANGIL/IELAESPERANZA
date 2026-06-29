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

### Módulo de docentes (completo)

El módulo de docentes (`/docentes`) quedó completo con ver `supabase/migrations/0008_docentes_modulo_completo.sql`:

- **Ficha extendida**: además de `especialidad`, `tipo_contrato` y `fecha_ingreso`, los docentes ahora registran `fecha_nacimiento`, `sexo`, `direccion`, `municipio`, `departamento`, `telefono` (fijo, distinto de `profiles.phone`/celular), `correo_personal`, `profesion` y `escalafon`.
- **Creación sin invitación por correo**: `createDocente` crea el usuario de Supabase Auth directamente con `email_confirm: true` y una contraseña temporal definida por quien lo registra (no se envía correo de invitación), marcando `profiles.must_change_password = true`.
- **Cambio de contraseña forzado**: si `profiles.must_change_password` es `true`, el middleware redirige cualquier ruta protegida a `/reset-password` hasta que el usuario defina su nueva contraseña; al guardarla se limpia el flag automáticamente.
- **Un director de grupo único por año lectivo**: índice único parcial `ux_grupos_director_unico_por_anio` sobre `grupos(anio_lectivo_id, director_grupo_id)` impide asignar el mismo docente como director de más de un grupo en el mismo año lectivo. Los selectores de director de grupo solo listan docentes activos.
- **Eliminación protegida**: `deleteDocente` rechaza el borrado si el docente tiene asignaciones en `malla_curricular` o dirige algún grupo; en ese caso se debe desactivar en lugar de eliminar.
- **Listado con búsqueda y paginación**: `/docentes` permite filtrar por documento, nombre, especialidad, correo y estado (activo/inactivo/todos), con paginación de 20 registros por página (`listDocentesPaginado`).
