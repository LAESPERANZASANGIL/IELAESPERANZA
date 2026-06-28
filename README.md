# IE La Esperanza — Sistema académico

Aplicación web académica de la Institución Educativa La Esperanza. Construida con Next.js (App Router), TypeScript, Tailwind CSS y Supabase (PostgreSQL).

## Roles

`rector`, `administrador`, `secretaria`, `docente`, `padre_familia`, `estudiante`.

## Estructura

```
src/
  app/
    login/                 Página de inicio de sesión
    auth/callback/         Callback de Supabase Auth
    (dashboard)/           Rutas protegidas con sidebar según rol
      dashboard/           Panel principal por rol
      estudiantes/         Módulo de estudiantes
      grados/               Módulo de grados y cursos
      docentes/            Módulo de docentes
      asignaturas/         Módulo de asignaturas
      periodos/            Módulo de periodos académicos
      notas/               Módulo de notas
      asistencia/          Módulo de asistencia/fallas
      mensajeria/          Módulo de mensajería
      boletines/           Módulo de boletines en PDF
      certificados/        Módulo de certificados institucionales
  components/
    ui/                    Primitivas de interfaz (Card, Badge, EmptyState)
    layout/                Sidebar, Header, configuración de navegación por rol
    auth/                  Formulario de login y botón de logout
  lib/
    supabase/              Clientes de Supabase (browser, server, middleware)
    auth/                  Helpers de sesión (perfil actual, rutas protegidas)
  types/
    roles.ts               Roles del sistema
    database.types.ts      Tipos que reflejan el esquema de base de datos
  proxy.ts                 Middleware de Next.js: protege rutas y refresca sesión
supabase/
  migrations/              Esquema SQL (tablas, enums, RLS por rol)
```

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

## Próximos pasos

Esta es la arquitectura base. Los módulos (estudiantes, grados, docentes, asignaturas, periodos, notas, asistencia, mensajería, boletines en PDF y certificados) están planteados con pantallas iniciales; la funcionalidad CRUD y los reportes en PDF se implementarán de forma incremental.
