# MASTER PLAN — ERP Educativo Campus La Esperanza

> Proyecto renombrado a **Campus La Esperanza** (ver `docs/adr/0002-rebranding-campus-la-esperanza.md`). Las referencias a "IE La Esperanza" en este documento son al nombre histórico de la institución, no al producto.
>
> Estado: **aprobado**. El núcleo de Fase 1 ya está implementado; los módulos restantes se construyen de forma incremental.

## 0. Visión y restricciones de diseño

- **Escala objetivo:** > 5.000 estudiantes activos, multi-año-lectivo, con histórico de 10+ años sin degradar el rendimiento.
- **Multi-rol, multi-sede preparado:** el modelo de datos no asume una sola sede aunque la institución opere una hoy.
- **Multi-tenant a futuro (opcional):** el diseño no debe impedir que en el futuro el mismo sistema sirva a otras instituciones, aunque hoy se implemente single-tenant.
- **Auditable:** todo dato financiero, académico y de asistencia debe ser trazable (quién, cuándo, desde qué rol).
- **Evolutivo:** se construye en fases; cada fase debe ser desplegable y útil por sí sola, sin requerir que las fases siguientes existan.
- **Seguridad por defecto:** Row Level Security (RLS) en Postgres como última línea de defensa, no solo lógica de aplicación.

---

## 1. Arquitectura general del sistema

### 1.1 Visión de alto nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                    │
│  Navegador (web app responsiva) · App móvil futura (mismo backend)  │
└───────────────────────────────┬───────────────────────────────────--┘
                                 │ HTTPS
┌────────────────────────────────────────────────────────────────────┐
│                  NEXT.JS APP (App Router, TS)                       │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────────┐    │
│  │ Server         │  │ Route Handlers │  │ Server Actions       │    │
│  │ Components     │  │ /api/*         │  │ (mutaciones por      │    │
│  │ (lectura SSR)  │  │ (integraciones,│  │  módulo)             │    │
│  │               │  │  webhooks, PDF) │  │                      │    │
│  └───────────────┘  └────────────────┘  └──────────────────────┘    │
└───────────────────────────────┬────────────────────────────────────┘
                                 │ Supabase client (RLS-aware)
┌────────────────────────────────────────────────────────────────────┐
│                          SUPABASE                                    │
│  ┌────────────┐ ┌───────────┐ ┌────────────┐ ┌────────────────────┐ │
│  │ PostgreSQL │ │ Auth      │ │ Storage    │ │ Edge Functions      │ │
│  │ + RLS      │ │ (JWT)     │ │ (PDFs,     │ │ (jobs pesados:      │ │
│  │ + Realtime │ │           │ │  fotos,    │ │  boletines masivos, │ │
│  │            │ │           │ │  soportes) │ │  reportes, cron)    │ │
│  └────────────┘ └───────────┘ └────────────┘ └────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   Servicios externos     │
                    │  Pasarela de pagos       │
                    │  Email/SMS/WhatsApp      │
                    │  Generador de PDF (lib)  │
                    └──────────────────────────┘
```

### 1.2 Principios arquitectónicos

1. **Postgres es la fuente de verdad y el primer guardián de seguridad.** RLS por rol en cada tabla; la app nunca confía únicamente en checks de UI.
2. **Next.js como monolito modular**, no microservicios. A esta escala (5.000 estudiantes, una institución) los microservicios añaden complejidad operativa sin beneficio real. Se diseña en **módulos desacoplados por dominio** dentro del monolito para poder extraerlos a servicios independientes en el futuro si fuera necesario (ej. el módulo financiero, si se integra con un ERP contable externo).
3. **Server Actions para mutaciones internas**, **Route Handlers (`/api/*`)** solo para: integraciones externas (pasarela de pagos, webhooks), generación de documentos descargables, y endpoints que requieran ser llamados desde fuera de un Server Component (ej. cron jobs, Edge Functions).
4. **Trabajo pesado fuera del request-response**: generación masiva de boletines/certificados, recalculo de promedios, envío masivo de mensajes → Supabase Edge Functions o un *queue table* (`jobs`) con un worker, nunca bloqueando una petición HTTP del usuario.
5. **Separación estricta por capas dentro de cada módulo**: `schema` (validación) → `repository` (acceso a datos) → `service` (reglas de negocio) → `actions/api` (capa de transporte) → `ui`. Esto permite testear reglas de negocio sin levantar HTTP ni DB real.
6. **Versionado del esquema de base de datos** vía migraciones secuenciales (`supabase/migrations`), nunca cambios manuales en producción.
7. **Feature flags por módulo** (tabla `feature_flags` o config), para activar fases incrementalmente sin ramas de código divergentes.

### 1.3 Por qué Next.js + Supabase a esta escala

- Postgres soporta cómodamente millones de filas con índices adecuados; 5.000 estudiantes × 10 años × ~200 registros de notas/asistencia por año son del orden de 10⁷ filas en las tablas más grandes — perfectamente manejable con particionamiento e índices (sección 3.7).
- Supabase Auth + RLS evita reconstruir un sistema de permisos paralelo en la aplicación.
- Next.js Server Components reduce el JS enviado al cliente, importante para usuarios con conexiones limitadas (padres de familia en zonas rurales).
- Si en el futuro se requiere desacoplar (ej. mover el módulo financiero a un sistema contable externo), la separación por dominio (1.2.5) permite extraerlo sin reescribir todo.

---

## 2. Estructura completa de carpetas

```
ielaesperanza/
├── MASTER_PLAN.md
├── README.md
├── .env.local.example
├── next.config.ts
├── tsconfig.json
│
├── supabase/
│   ├── migrations/                     # una migración por cambio de esquema, nunca editar las ya aplicadas
│   │   ├── 0001_init_core.sql
│   │   ├── 0002_init_academico.sql
│   │   ├── 0003_init_financiero.sql
│   │   ├── 0004_init_comunicacion.sql
│   │   ├── 0005_init_documentos.sql
│   │   ├── 0006_rls_core.sql
│   │   ├── 0007_rls_academico.sql
│   │   ├── 0008_rls_financiero.sql
│   │   ├── 0009_rls_comunicacion.sql
│   │   ├── 0010_rls_documentos.sql
│   │   └── 00NN_*.sql
│   ├── functions/                      # Edge Functions
│   │   ├── generar-boletin/
│   │   ├── generar-certificado/
│   │   ├── recalcular-promedios/
│   │   ├── enviar-notificaciones-masivas/
│   │   └── cron-cierre-periodo/
│   ├── seed/
│   │   └── seed_dev.sql
│   └── README.md
│
├── src/
│   ├── app/
│   │   ├── (public)/                   # login, recuperar contraseña, landing institucional
│   │   │   ├── login/
│   │   │   ├── recuperar-password/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/                # todo lo autenticado, protegido por proxy.ts
│   │   │   ├── layout.tsx              # shell: sidebar + header + provider de sesión/rol
│   │   │   ├── dashboard/              # panel principal por rol
│   │   │   │
│   │   │   ├── matricula/              # MÓDULO: admisiones y matrícula
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nueva/
│   │   │   │   ├── [id]/
│   │   │   │   └── procesos/           # procesos de matrícula por año lectivo
│   │   │   │
│   │   │   ├── estudiantes/            # MÓDULO: estudiantes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx        # ficha integral del estudiante
│   │   │   │   │   ├── academico/
│   │   │   │   │   ├── disciplina/
│   │   │   │   │   ├── financiero/
│   │   │   │   │   └── documentos/
│   │   │   │   └── nuevo/
│   │   │   │
│   │   │   ├── acudientes/             # MÓDULO: padres/acudientes
│   │   │   │
│   │   │   ├── grados/                 # MÓDULO: grados y grupos/cursos
│   │   │   ├── docentes/               # MÓDULO: docentes y carga académica
│   │   │   ├── asignaturas/            # MÓDULO: plan de estudios
│   │   │   ├── periodos/               # MÓDULO: periodos académicos y años lectivos
│   │   │   │
│   │   │   ├── notas/                  # MÓDULO: calificaciones
│   │   │   │   ├── page.tsx
│   │   │   │   ├── ingresar/
│   │   │   │   └── consolidado/
│   │   │   │
│   │   │   ├── asistencia/             # MÓDULO: asistencia/fallas
│   │   │   ├── disciplina/             # MÓDULO: observador / convivencia
│   │   │   │
│   │   │   ├── finanzas/               # MÓDULO: financiero
│   │   │   │   ├── pensiones/
│   │   │   │   ├── facturacion/
│   │   │   │   ├── pagos/
│   │   │   │   ├── conceptos/          # conceptos de cobro configurables
│   │   │   │   └── reportes/
│   │   │   │
│   │   │   ├── inventario/             # MÓDULO: inventario y recursos (fase posterior)
│   │   │   ├── biblioteca/             # MÓDULO: biblioteca (fase posterior)
│   │   │   │
│   │   │   ├── mensajeria/             # MÓDULO: comunicación interna
│   │   │   ├── circulares/             # MÓDULO: comunicados masivos
│   │   │   │
│   │   │   ├── boletines/              # MÓDULO: boletines PDF
│   │   │   ├── certificados/           # MÓDULO: certificados institucionales
│   │   │   │
│   │   │   ├── reportes/               # MÓDULO: reportes y BI institucional
│   │   │   │
│   │   │   └── administracion/         # MÓDULO: configuración del sistema
│   │   │       ├── usuarios/
│   │   │       ├── roles-permisos/
│   │   │       ├── sedes/
│   │   │       ├── anios-lectivos/
│   │   │       └── auditoria/
│   │   │
│   │   ├── api/                        # Route Handlers
│   │   │   ├── auth/callback/route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── pagos/route.ts
│   │   │   ├── documentos/
│   │   │   │   ├── boletin/[id]/route.ts        # genera/descarga PDF
│   │   │   │   └── certificado/[id]/route.ts
│   │   │   ├── cron/
│   │   │   │   └── cierre-periodo/route.ts      # invocado por Supabase cron / Vercel cron
│   │   │   └── export/
│   │   │       └── [modulo]/route.ts             # exportación CSV/Excel
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── modules/                        # NÚCLEO DE NEGOCIO, organizado por dominio (no por capa técnica)
│   │   ├── core/                       # entidades transversales: profiles, sedes, años lectivos
│   │   │   ├── schemas/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── types.ts
│   │   ├── matricula/
│   │   │   ├── schemas/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── types.ts
│   │   ├── estudiantes/
│   │   ├── academico/                  # grados, grupos, asignaturas, periodos, malla curricular
│   │   ├── calificaciones/
│   │   ├── asistencia/
│   │   ├── disciplina/
│   │   ├── financiero/
│   │   ├── comunicacion/
│   │   ├── documentos/                 # generación de boletines/certificados
│   │   └── reportes/
│   │
│   ├── components/
│   │   ├── ui/                         # primitivas de diseño (Button, Card, Table, Modal, Badge...)
│   │   ├── layout/                     # Sidebar, Header, nav-config por rol
│   │   ├── forms/                      # inputs compuestos reutilizables (DatePicker, Combobox, etc.)
│   │   ├── tables/                     # DataTable genérica con paginación/filtros server-side
│   │   └── charts/                     # componentes de visualización para reportes
│   │
│   ├── lib/
│   │   ├── supabase/                   # client.ts, server.ts, middleware.ts, admin.ts (service role)
│   │   ├── auth/                       # session.ts, permissions.ts (matriz de permisos)
│   │   ├── pdf/                        # motor de generación de PDF (boletines, certificados)
│   │   ├── notificaciones/             # adaptadores email/SMS/WhatsApp
│   │   ├── jobs/                       # cliente para encolar trabajos pesados
│   │   ├── validation/                 # esquemas zod compartidos
│   │   └── utils/
│   │
│   ├── types/
│   │   ├── database.types.ts           # generado desde Supabase
│   │   ├── roles.ts
│   │   └── permissions.ts
│   │
│   ├── proxy.ts                        # middleware: sesión + enrutamiento por rol
│   └── config/
│       └── nav-config.ts               # navegación por rol, fuente única de verdad
│
├── tests/
│   ├── unit/                           # tests de services/ (lógica de negocio pura)
│   ├── integration/                    # tests contra Supabase local (RLS, repositories)
│   └── e2e/                            # flujos críticos: login, matrícula, boletín
│
└── docs/
    ├── adr/                            # Architecture Decision Records
    └── runbooks/                       # procedimientos operativos (cierre de periodo, backup, etc.)
```

**Regla de dependencia:** `app/` (rutas) depende de `modules/`; `modules/` nunca depende de `app/`. Esto permite mover lógica de negocio fuera del framework web si algún día se necesita (ej. un worker standalone).

---

## 3. Arquitectura de base de datos (PostgreSQL / Supabase)

### 3.1 Convenciones

- Nombres de tablas y columnas en `snake_case`, español, singular para tipos/enums y plural para tablas.
- Toda tabla transaccional tiene `id uuid default gen_random_uuid()`, `created_at`, `updated_at`, y cuando aplica `created_by`/`updated_by` (auditoría mínima).
- Claves foráneas explícitas con `on delete` pensado caso por caso (`restrict` para datos históricos como notas/pagos, `cascade` solo donde la relación es de composición real, `set null` para relaciones opcionales).
- Ningún borrado físico de datos académicos o financieros: se usa **soft delete** (`anulado_en`, `anulado_por`, `motivo_anulacion`) o tablas de auditoría, nunca `DELETE` en producción para estos dominios.

### 3.2 Dominios de datos (agrupación lógica)

1. **Core / Identidad**: `profiles`, `sedes`, `anios_lectivos`, `roles_permisos`, `auditoria`
2. **Matrícula**: `procesos_matricula`, `solicitudes_admision`, `matriculas`
3. **Académico**: `grados`, `grupos`, `asignaturas`, `periodos_academicos`, `malla_curricular` (asignaturas_grupo), `docentes`, `docente_asignaciones`
4. **Estudiantes**: `estudiantes`, `acudientes`, `estudiante_acudientes`
5. **Calificaciones**: `notas`, `tipos_evaluacion`, `escalas_valoracion`, `recuperaciones`
6. **Asistencia**: `asistencia`, `justificaciones`
7. **Disciplina**: `observador_estudiante`, `tipos_falta`, `seguimiento_disciplinario`
8. **Financiero**: `conceptos_cobro`, `tarifas`, `facturas`, `detalle_factura`, `pagos`, `metodos_pago`, `becas_descuentos`
9. **Comunicación**: `mensajes`, `circulares`, `circular_destinatarios`, `notificaciones`
10. **Documentos**: `boletines`, `certificados`, `plantillas_documento`
11. **Sistema**: `jobs` (cola de trabajos), `feature_flags`, `logs_auditoria`

### 3.3 Tablas y relaciones — Core

```
sedes
  id, nombre, codigo_dane, direccion, telefono, activa

anios_lectivos
  id, anio (int, unique), fecha_inicio, fecha_fin, estado(planeado|activo|cerrado)

profiles  (1:1 con auth.users)
  id (= auth.users.id), role, full_name, email, documento_tipo, documento_numero,
  phone, avatar_url, sede_id -> sedes, activo, created_at, updated_at

roles_permisos                          -- permisos finos opcionales sobre el rol base
  id, role, modulo, accion, permitido

logs_auditoria
  id, profile_id -> profiles, tabla, registro_id, accion, datos_antes (jsonb),
  datos_despues (jsonb), created_at
```

### 3.4 Tablas y relaciones — Matrícula

```
procesos_matricula
  id, anio_lectivo_id -> anios_lectivos, nombre, fecha_apertura, fecha_cierre, estado

solicitudes_admision
  id, proceso_matricula_id -> procesos_matricula, aspirante_nombre, aspirante_documento,
  grado_solicitado_id -> grados, acudiente_id -> profiles, estado(pendiente|en_revision|admitido|rechazado),
  documentos_adjuntos (jsonb), created_at

matriculas
  id, estudiante_id -> estudiantes, anio_lectivo_id -> anios_lectivos, grupo_id -> grupos,
  proceso_matricula_id -> procesos_matricula, estado(activa|retirada|trasladada|graduada),
  fecha_matricula, fecha_retiro, motivo_retiro
  unique(estudiante_id, anio_lectivo_id)   -- un estudiante, una matrícula por año
```

`matriculas` es la pieza clave que **desacopla al estudiante del grupo por año lectivo**: el estudiante existe una sola vez en el sistema; su historial de grados/grupos vive en `matriculas`, no en una columna `grupo_id` directa sobre `estudiantes` (corrección de diseño respecto al esquema inicial de la fase 1, ver sección 17).

### 3.5 Tablas y relaciones — Académico y Estudiantes

```
grados
  id, nombre, nivel(preescolar|primaria|secundaria|media), orden

grupos
  id, grado_id -> grados, anio_lectivo_id -> anios_lectivos, nombre, sede_id -> sedes,
  director_grupo_id -> docentes, capacidad
  unique(grado_id, anio_lectivo_id, nombre)

docentes
  id (= profiles.id), especialidad, fecha_ingreso, tipo_contrato

asignaturas
  id, nombre, area, descripcion

periodos_academicos
  id, anio_lectivo_id -> anios_lectivos, nombre, orden, fecha_inicio, fecha_fin, estado(planeado|activo|cerrado)

malla_curricular  (antes "asignaturas_grupo")
  id, grupo_id -> grupos, asignatura_id -> asignaturas, docente_id -> docentes,
  intensidad_horaria
  unique(grupo_id, asignatura_id)

estudiantes
  id (= profiles.id si tiene cuenta propia, o id independiente si el estudiante no inicia sesión),
  fecha_nacimiento, genero, estado_general(activo|inactivo|graduado), created_at
  -- NOTA: ya NO tiene grupo_id directo; el grupo vigente se resuelve vía matriculas + anio_lectivo activo

acudientes
  id (= profiles.id), ocupacion, lugar_trabajo

estudiante_acudientes
  estudiante_id -> estudiantes, acudiente_id -> acudientes, parentesco, es_acudiente_principal
  primary key(estudiante_id, acudiente_id)
```

### 3.6 Tablas y relaciones — Calificaciones, Asistencia, Disciplina

```
tipos_evaluacion
  id, nombre (ej. "Quiz", "Examen final", "Trabajo"), peso_porcentual

escalas_valoracion
  id, nombre, valor_minimo, valor_maximo, equivalencia_cualitativa (ej. "Superior", "Alto"...)

notas
  id, matricula_id -> matriculas,        -- ¡ya no estudiante_id suelto! amarra la nota al año/grupo correcto
  malla_curricular_id -> malla_curricular, periodo_academico_id -> periodos_academicos,
  tipo_evaluacion_id -> tipos_evaluacion, valor numeric(4,2), descripcion,
  docente_id -> docentes, anulado_en, anulado_por, created_at, updated_at

recuperaciones
  id, nota_id -> notas, valor_recuperado, fecha, autorizado_por -> profiles

asistencia
  id, matricula_id -> matriculas, fecha, estado(presente|ausente|tarde|excusa),
  observacion, registrado_por -> profiles
  unique(matricula_id, fecha)

justificaciones
  id, asistencia_id -> asistencia, motivo, soporte_url, aprobado_por -> profiles

tipos_falta
  id, nombre, categoria(leve|grave|gravisima), descripcion

observador_estudiante
  id, matricula_id -> matriculas, tipo_falta_id -> tipos_falta, descripcion,
  fecha, reportado_por -> profiles, seguimiento_requerido boolean

seguimiento_disciplinario
  id, observador_id -> observador_estudiante, accion_tomada, fecha, responsable -> profiles
```

**Por qué `notas` y `asistencia` cuelgan de `matricula_id` y no de `estudiante_id`:** garantiza que un registro académico siempre esté contextualizado al año lectivo y grupo correctos, incluso si el estudiante repite grado, se traslada de grupo a mitad de año, o se gradúa y vuelve a matricularse (caso raro pero posible). Evita ambigüedad histórica y permite reportes por año sin joins frágiles.

### 3.7 Tablas y relaciones — Financiero

```
conceptos_cobro
  id, nombre (ej. "Pensión", "Matrícula", "Uniformes"), tipo(recurrente|unico), activo

tarifas
  id, concepto_cobro_id -> conceptos_cobro, grado_id -> grados, anio_lectivo_id -> anios_lectivos,
  valor

becas_descuentos
  id, matricula_id -> matriculas, tipo(beca|descuento), porcentaje, valor_fijo,
  motivo, aprobado_por -> profiles

facturas
  id, matricula_id -> matriculas, periodo_facturado, fecha_emision, fecha_vencimiento,
  estado(pendiente|pagada|parcial|anulada), total

detalle_factura
  id, factura_id -> facturas, concepto_cobro_id -> conceptos_cobro, descripcion,
  valor_unitario, cantidad, subtotal

metodos_pago
  id, nombre (efectivo, transferencia, pasarela, etc.)

pagos
  id, factura_id -> facturas, metodo_pago_id -> metodos_pago, valor, fecha_pago,
  referencia_externa (id de transacción de la pasarela), registrado_por -> profiles,
  estado(confirmado|pendiente|rechazado)
```

`facturas` y `pagos` se separan porque un pago parcial o un abono no debe forzar a recrear la factura; `detalle_factura` permite que una factura agrupe varios conceptos (pensión + transporte, por ejemplo) sin perder el desglose para reportes contables.

### 3.8 Tablas y relaciones — Comunicación y Documentos

```
mensajes
  id, remitente_id -> profiles, destinatario_id -> profiles, asunto, contenido,
  leido, parent_id -> mensajes (hilos), created_at

circulares
  id, titulo, contenido, creado_por -> profiles, alcance(institucional|sede|grado|grupo),
  alcance_referencia_id (uuid nullable, apunta a sede/grado/grupo según alcance), publicado_en

circular_destinatarios
  id, circular_id -> circulares, profile_id -> profiles, leido_en

notificaciones
  id, profile_id -> profiles, tipo, titulo, cuerpo, canal(in_app|email|sms|whatsapp),
  enviado_en, leido_en, metadata (jsonb)

plantillas_documento
  id, tipo(boletin|certificado_estudio|certificado_conducta|paz_y_salvo), contenido_html, version, activa

boletines
  id, matricula_id -> matriculas, periodo_academico_id -> periodos_academicos,
  url_pdf, generado_en, generado_por -> profiles
  unique(matricula_id, periodo_academico_id)

certificados
  id, estudiante_id -> estudiantes, tipo, estado(solicitado|en_proceso|generado|entregado|rechazado),
  url_pdf, solicitado_por -> profiles, generado_por -> profiles, generado_en, anio_lectivo_id -> anios_lectivos
```

### 3.9 Tabla de sistema: cola de trabajos

```
jobs
  id, tipo (ej. "generar_boletines_masivo", "enviar_circular"), payload (jsonb),
  estado(pendiente|procesando|completado|fallido), intentos, error, created_at, procesado_en
```

Usada por Edge Functions / un worker para procesar tareas pesadas de forma asíncrona sin bloquear al usuario que las solicita (ver sección 16).

### 3.10 Particionamiento e índices (preparación para 5.000+ estudiantes / multi-año)

- **Particionamiento por `anio_lectivo_id`** (range o list partitioning) en las tablas de mayor crecimiento: `notas`, `asistencia`, `observador_estudiante`. A 5.000 estudiantes × ~10 asignaturas × 4 periodos × ~3 notas, son ~600.000 filas/año solo en `notas`; particionar por año mantiene cada partición manejable y permite archivar años antiguos a almacenamiento más barato sin downtime.
- **Índices obligatorios:** toda FK usada en filtros frecuentes (`matricula_id`, `periodo_academico_id`, `grupo_id`, `fecha`), e índices compuestos para las consultas más comunes (ej. `(matricula_id, periodo_academico_id)` en `notas`).
- **Vistas materializadas** para reportes pesados (promedios por grupo, indicadores de asistencia institucional) refrescadas por cron, en vez de calcular en caliente sobre millones de filas.

### 3.11 Row Level Security — estrategia

- Funciones helper `security definer`: `auth_role()`, `is_staff()`, `is_docente_de(matricula_id)`, `is_acudiente_de(estudiante_id)`, `anio_lectivo_activo_id()`.
- Política general: **rector/administrador/secretaria** ven y escriben según su alcance administrativo; **docente** solo lee/escribe lo relacionado a sus grupos/asignaturas asignadas en `malla_curricular`; **padre_familia** solo lee lo de sus acudidos (vía `estudiante_acudientes`); **estudiante** solo lee lo propio.
- El módulo financiero tiene políticas más estrictas: ningún rol distinto a rector/administrador/secretaria puede **escribir** pagos o facturas; padres/estudiantes solo **leen** sus propias facturas.

---

## 4. Roles y permisos

| Rol | Descripción | Alcance típico |
|---|---|---|
| **rector** | Máxima autoridad institucional | Acceso total de lectura; escritura en configuración institucional, aprobación de procesos críticos (cierre de periodo/año, becas) |
| **administrador** | Gestión operativa del sistema | Acceso total operativo: usuarios, matrícula, finanzas, académico, documentos |
| **secretaria** | Gestión documental y de matrícula | Matrícula, certificados, estudiantes, comunicación; lectura de notas/asistencia; sin acceso a configuración del sistema |
| **docente** | Gestión académica de sus grupos | Notas, asistencia, observador disciplinario y mensajería **solo de sus grupos/asignaturas asignadas** (vía `malla_curricular`) |
| **padre_familia** | Seguimiento de sus acudidos | Lectura de notas, asistencia, boletines, facturas/pagos y mensajería de **sus estudiantes**; solicitud de certificados |
| **estudiante** | Autogestión académica | Lectura de sus propias notas, asistencia, boletines; mensajería; solicitud de certificados |

### 4.1 Matriz de permisos por módulo (resumen)

| Módulo | rector | administrador | secretaria | docente | padre_familia | estudiante |
|---|---|---|---|---|---|---|
| Matrícula | RW (aprobar) | RW | RW | - | R (su proceso) | - |
| Estudiantes | RW | RW | RW | R (sus grupos) | R (suyo) | R (propio) |
| Académico (grados/grupos/asignaturas/periodos) | RW | RW | R | R | R | R |
| Notas | R | R | R | RW (sus asignaturas) | R (sus acudidos) | R (propias) |
| Asistencia | R | R | R | RW (sus grupos) | R (sus acudidos) | R (propia) |
| Disciplina | RW | RW | R | RW (sus grupos, crear) | R (sus acudidos) | R (propia) |
| Finanzas | RW | RW | RW | - | R (suyo) | R (propio, si aplica) |
| Comunicación | RW | RW | RW | RW (limitado) | RW (limitado) | RW (limitado) |
| Documentos (boletines/certificados) | RW | RW | RW (generar) | R | R + solicitar | R + solicitar |
| Administración del sistema | RW | RW | - | - | - | - |
| Reportes/BI | RW | RW | R (operativos) | R (sus grupos) | - | - |

La matriz fina vive en código (`src/lib/auth/permissions.ts`) y se refleja en RLS — **nunca solo en el frontend**.

---

## 5. Navegación completa de la aplicación

```
Sidebar (filtrado por rol vía nav-config.ts)
│
├── Panel principal                         [todos]
│
├── Admisiones y Matrícula                   [rector, admin, secretaria]
│   ├── Procesos de matrícula
│   ├── Solicitudes de admisión
│   └── Matrículas activas
│
├── Estudiantes                              [rector, admin, secretaria, docente*]
│   └── Ficha integral (académico, disciplina, financiero, documentos)
│
├── Acudientes                               [rector, admin, secretaria]
│
├── Académico
│   ├── Grados y grupos                      [rector, admin, secretaria]
│   ├── Docentes y carga académica           [rector, admin, secretaria]
│   ├── Asignaturas / plan de estudios       [rector, admin, secretaria, docente*]
│   └── Periodos académicos                  [rector, admin, secretaria]
│
├── Gestión académica diaria
│   ├── Notas                                [todos, con alcance distinto]
│   ├── Asistencia                           [todos, con alcance distinto]
│   └── Disciplina / observador              [todos, con alcance distinto]
│
├── Finanzas                                 [rector, admin, secretaria; lectura: padre/estudiante]
│   ├── Conceptos y tarifas
│   ├── Facturación
│   ├── Pagos
│   └── Becas y descuentos
│
├── Comunicación
│   ├── Mensajería directa                   [todos]
│   └── Circulares institucionales           [todos, con alcance distinto]
│
├── Documentos
│   ├── Boletines                            [todos, con alcance distinto]
│   └── Certificados                         [todos, con alcance distinto]
│
├── Reportes e indicadores                   [rector, admin, secretaria*, docente*]
│
└── Administración del sistema                [rector, admin]
    ├── Usuarios y roles
    ├── Sedes
    ├── Años lectivos
    └── Auditoría
```

`*` indica acceso limitado al propio alcance (sus grupos, su sede).

---

## 6. Módulos del sistema (catálogo completo)

1. Autenticación y gestión de sesión
2. Administración del sistema (usuarios, roles, sedes, años lectivos, auditoría)
3. Admisiones y matrícula
4. Estudiantes (ficha integral)
5. Acudientes
6. Académico (grados, grupos, docentes, asignaturas, periodos, malla curricular)
7. Calificaciones
8. Asistencia
9. Disciplina / observador del estudiante
10. Finanzas (facturación, pagos, becas)
11. Comunicación (mensajería, circulares, notificaciones)
12. Documentos institucionales (boletines, certificados)
13. Reportes e indicadores (BI institucional)
14. Inventario y recursos *(fase posterior, opcional)*
15. Biblioteca *(fase posterior, opcional)*

---

## 7. Estructura del backend

El "backend" es Next.js (Server Components, Server Actions, Route Handlers) + Supabase. No hay un servidor Node separado.

- **`src/modules/<dominio>/repositories/`**: única capa que ejecuta queries a Supabase. Nada fuera de aquí llama `supabase.from(...)` directamente.
- **`src/modules/<dominio>/services/`**: reglas de negocio puras (ej. "no se puede cerrar un periodo si hay notas sin registrar"; "no se puede matricular sin proceso de matrícula activo"). Reciben repositorios inyectados → testeables sin DB real.
- **`src/modules/<dominio>/schemas/`**: validación con `zod` de entradas (formularios, API).
- **Server Actions** (`actions.ts` por módulo, colocadas junto a las rutas que las usan) son la capa de transporte para mutaciones desde la UI: validan con `schemas/`, llaman a `services/`, revalidan rutas.
- **Route Handlers (`app/api/*`)** solo para: webhooks de pasarela de pagos, generación/descarga de PDFs, exportaciones, endpoints invocados por cron/Edge Functions.
- **Edge Functions de Supabase**: trabajos asíncronos y programados (cierre de periodo, generación masiva de boletines, envío masivo de circulares, recordatorios de pago).
- **`lib/auth/permissions.ts`**: matriz de permisos en código, espejo de las políticas RLS, usada para mostrar/ocultar UI y validar antes de llamar al backend (defensa en profundidad, no sustituto de RLS).

---

## 8. Estructura del frontend

- **Server Components por defecto** para todo lo que es lectura (listados, fichas, reportes) — se renderiza en servidor con acceso directo (vía RLS) a Supabase, sin exponer lógica de queries al cliente.
- **Client Components** solo donde hay interactividad real: formularios, tablas con filtros dinámicos, mensajería en tiempo real (Supabase Realtime), gráficos.
- **`components/ui/`**: sistema de diseño propio mínimo (Button, Card, Badge, Modal, Tabs, DataTable) — sin dependencia de una librería de componentes pesada, para mantener control total y rendimiento a escala.
- **`components/tables/DataTable`**: componente genérico con paginación, filtros y ordenamiento **server-side** (crítico a 5.000+ estudiantes: nunca traer todo el listado al cliente).
- **`config/nav-config.ts`**: fuente única de verdad para la navegación, filtrada por rol — ya existente en el scaffold actual, se extiende con los nuevos módulos.
- **Estado de servidor vs cliente:** se evita un store global (Redux/Zustand) salvo para UI efímera (modales, filtros de tabla); el estado real vive en la base de datos y se re-obtiene vía Server Components + revalidation.

---

## 9. API por módulo (contratos a nivel de capacidad, no de código)

| Módulo | Server Actions (mutaciones) | Route Handlers (transporte especial) |
|---|---|---|
| Matrícula | crearSolicitud, admitirSolicitud, registrarMatricula, retirarEstudiante | exportar listado (CSV) |
| Estudiantes | crearEstudiante, actualizarEstudiante, vincularAcudiente | — |
| Académico | crearGrado, crearGrupo, asignarDocente, crearPeriodo, cerrarPeriodo | — |
| Calificaciones | registrarNota, editarNota, registrarRecuperacion | recalcular-promedios (invocado por cron/edge function) |
| Asistencia | registrarAsistencia, justificarFalla | importación masiva (CSV) |
| Disciplina | registrarObservacion, registrarSeguimiento | — |
| Finanzas | generarFactura, registrarPago, aplicarBeca | webhook pasarela de pagos, exportar reporte contable |
| Comunicación | enviarMensaje, publicarCircular | — |
| Documentos | solicitarCertificado | GET boletin/[id] (genera/descarga PDF), GET certificado/[id] |
| Administración | crearUsuario, asignarRol, crearSede, crearAnioLectivo | — |

Todas las Server Actions siguen el patrón: `schema.parse(input)` → `service.ejecutar(...)` → `revalidatePath(...)`. Los Route Handlers que generan documentos son `async` y, si la generación es pesada (boletines masivos), solo **encolan** el trabajo en `jobs` y responden con un identificador de seguimiento, en vez de bloquear la petición.

---

## 10. Flujo de autenticación

1. Usuario ingresa a `/login` → Supabase Auth (`signInWithPassword`, con opción futura de SSO/Magic Link).
2. `proxy.ts` (middleware) refresca la sesión en cada navegación y redirige a `/login` si no hay sesión, o a `/dashboard` si ya autenticado y visita `/login`.
3. Tras login, se resuelve el `profile` (rol, sede) en el Server Component raíz del grupo `(dashboard)`; el rol determina la navegación (`nav-config.ts`) y las vistas disponibles.
4. **Creación de usuarios:** no hay auto-registro abierto. Los usuarios (docentes, secretaría, padres, estudiantes) se crean desde `administracion/usuarios` por rector/administrador, o se generan automáticamente al completar un proceso de matrícula (estudiante + acudiente). Se envía invitación por correo para definir contraseña.
5. **Recuperación de contraseña:** flujo estándar de Supabase Auth (`resetPasswordForEmail`) en `(public)/recuperar-password`.
6. Autorización en cada request: RLS en Postgres + verificación de permisos en `lib/auth/permissions.ts` antes de renderizar acciones sensibles en la UI.

---

## 11. Flujo de matrícula

```
1. Administración abre un proceso de matrícula (procesos_matricula) para el año lectivo N+1.
2. Acudientes (o secretaría en su nombre) registran solicitudes_admision para aspirantes
   nuevos, o secretaría confirma la continuidad de estudiantes ya existentes.
3. Secretaría/Rectoría revisa solicitudes → admite o rechaza.
4. Al admitir:
     - Si el aspirante no existe como estudiante → se crea `estudiantes` (+ profile si aplica)
       y se vinculan acudientes (`estudiante_acudientes`).
     - Se crea el registro `matriculas` (estudiante + año lectivo + grupo asignado).
     - Se genera automáticamente la primera factura si el concepto "matrícula" tiene tarifa
       para ese grado/año (integración con módulo financiero).
5. El estudiante queda con estado "activa" en su matrícula del año correspondiente;
   todo registro académico posterior (notas, asistencia, disciplina) se ata a esta matrícula.
6. Retiro o traslado: se actualiza `matriculas.estado` y `fecha_retiro`, nunca se elimina
   el registro (se preserva el historial).
```

---

## 12. Flujo académico

```
1. Administración define el año lectivo activo y sus periodos_academicos.
2. Administración configura grados → grupos del año → malla_curricular
   (qué asignatura, en qué grupo, con qué docente).
3. Durante el periodo activo:
     - Docente registra `notas` por matrícula + malla_curricular + tipo_evaluacion.
     - Docente registra `asistencia` diaria por grupo.
     - Docente o coordinación registra `observador_estudiante` cuando aplica.
4. Al cierre de un periodo (`periodos_academicos.estado = cerrado`):
     - Se bloquea la edición de notas/asistencia de ese periodo (excepto con
       autorización explícita de rector/administrador vía `recuperaciones`).
     - Se dispara (Edge Function / job) el cálculo de promedios y la generación
       de boletines pendientes.
5. Al cierre del año lectivo:
     - Se evalúa promoción/reprobación por estudiante (regla configurable).
     - Se generan las matrículas del año siguiente en bloque (con posibilidad
       de ajuste manual de grupo).
```

---

## 13. Flujo financiero

```
1. Administración define `conceptos_cobro` y `tarifas` por grado/año lectivo.
2. Al matricular (o periódicamente, vía job mensual) se generan `facturas` con su
   `detalle_factura` según los conceptos aplicables (matrícula, pensión, etc.),
   aplicando `becas_descuentos` si existen para esa matrícula.
3. El acudiente/estudiante visualiza sus facturas pendientes (solo lectura).
4. Registro de pago:
     - Manual por secretaría/administración (efectivo, transferencia), o
     - Automático vía webhook de pasarela de pagos (Route Handler
       `api/webhooks/pagos`) que crea el registro en `pagos` y actualiza
       `facturas.estado`.
5. Reportes financieros (cartera vencida, ingresos por periodo, becas otorgadas)
   se sirven desde vistas materializadas, refrescadas por cron, no en tiempo real
   sobre la tabla transaccional.
```

---

## 14. Flujo de comunicación

```
1. Mensajería directa: cualquier usuario envía `mensajes` a otro usuario con el
   que tiene una relación válida (ej. padre ↔ docente de su hijo, estudiante ↔
   docente de su grupo) — restringido por RLS, no solo por UI.
2. Circulares institucionales: rector/administrador/secretaria/docente (según
   alcance permitido) publican una `circular` con un `alcance` (institucional,
   sede, grado, grupo). Al publicar, un job genera `circular_destinatarios`
   resolviendo la audiencia real (ej. todos los acudientes de un grupo) y
   `notificaciones` por el canal configurado (in-app, email; SMS/WhatsApp en
   fases posteriores).
3. Las notificaciones in-app aparecen en tiempo real vía Supabase Realtime;
   email/SMS se procesan de forma asíncrona vía la cola `jobs`.
```

---

## 15. Flujo de generación de documentos (boletines y certificados)

```
Boletín individual:
  1. Usuario autorizado solicita el boletín de un estudiante/periodo.
  2. Route Handler verifica si ya existe en `boletines` y está vigente → lo
     devuelve desde Storage.
  3. Si no existe: arma el payload (notas + asistencia + datos institucionales)
     usando datos ya consolidados (no recalcula promedios on-the-fly si ya
     fueron calculados al cierre del periodo), renderiza el PDF
     (motor en `lib/pdf/`, basado en una `plantilla_documento` activa), lo sube
     a Supabase Storage, registra la fila en `boletines` con su `url_pdf`.

Boletines masivos (todo un grupo/grado):
  1. Se encola un `job` tipo "generar_boletines_masivo" con los parámetros
     (grupo, periodo).
  2. Una Edge Function procesa el job, genera cada boletín, y notifica al
     solicitante cuando termina (no bloquea su sesión).

Certificados institucionales:
  1. Estudiante/acudiente o secretaría crea una solicitud en `certificados`
     (estado "solicitado").
  2. Secretaría/administración revisa requisitos (ej. paz y salvo financiero,
     si aplica) y aprueba → genera el PDF con la plantilla correspondiente,
     pasa a estado "generado".
  3. Se marca "entregado" cuando corresponde, dejando trazabilidad completa
     de quién solicitó, aprobó y generó cada certificado.
```

---

## 16. Consideraciones de escalabilidad y operación

- **Paginación y filtrado server-side obligatorios** en todo listado (estudiantes, notas, facturas) desde el día uno — no es una optimización futura, es un requisito de diseño dado el volumen objetivo.
- **Cola de trabajos (`jobs`) + Edge Functions** para todo proceso que pueda tardar más de ~2 segundos o afectar a muchos registros (boletines masivos, circulares masivas, recalculo de promedios, cierre de año).
- **Vistas materializadas** para reportes e indicadores institucionales, refrescadas por cron (no en cada request).
- **Particionamiento por año lectivo** en tablas de alto volumen (sección 3.10), con posibilidad de archivar particiones de años muy antiguos.
- **Backups automáticos** (los de Supabase) + *runbook* documentado en `docs/runbooks/` para restauración y para el cierre de año lectivo (operación crítica e infrecuente, debe estar guionizada).
- **Auditoría (`logs_auditoria`)** en todas las mutaciones de los módulos financiero, académico y de matrícula, para trazabilidad ante reclamos o auditorías externas (ej. Secretaría de Educación).
- **Multi-sede ya modelado** (`sedes` desde el inicio) aunque hoy se opere una sola, evitando una migración dolorosa si la institución abre una segunda sede en el futuro.

---

## 17. Diferencias respecto al scaffold ya existente en el repositorio

El PR #1 ya implementó una primera versión simplificada del esquema (`profiles`, `estudiantes` con `grupo_id` directo, `notas`/`asistencia` atadas a `estudiante_id`). Este Master Plan **introduce el concepto de `matriculas`** como entidad intermedia entre estudiante y año lectivo/grupo, lo cual es un cambio de diseño necesario para:

- Soportar correctamente el historial multi-año (repitencia, traslados, graduación y posible reingreso).
- Evitar que `notas`/`asistencia` queden ambiguas respecto a en qué año lectivo ocurrieron.
- Habilitar el flujo de matrícula como proceso explícito, no como un efecto secundario de crear un estudiante.

Esto implica una migración de esquema (no solo una adición) cuando se apruebe este plan: las tablas `estudiantes`, `notas` y `asistencia` del esquema actual deberán ajustarse para introducir `matriculas`. Se documentará como ADR (`docs/adr/0001-matriculas-como-entidad-central.md`) antes de tocar código.

---

## 18. Plan de desarrollo por fases

> Cada fase es desplegable y útil de forma independiente. No se avanza a la siguiente fase sin aprobación.

### Fase 0 — Fundación (ya entregada parcialmente en PR #1, se ajustará)
- Autenticación, layout por rol, navegación base.
- Esquema núcleo: `profiles`, `sedes`, `anios_lectivos`.
- Migración del esquema académico actual hacia el modelo con `matriculas`.

### Fase 1 — Núcleo académico y matrícula
- Módulos: Administración del sistema (usuarios/roles/sedes/años lectivos), Matrícula, Estudiantes, Acudientes, Académico (grados/grupos/docentes/asignaturas/periodos).
- Sin este núcleo, ningún otro módulo tiene datos reales sobre los que operar.

### Fase 2 — Gestión académica diaria
- Módulos: Calificaciones, Asistencia, Disciplina/Observador.
- Reportes básicos por grupo/estudiante.

### Fase 3 — Documentos institucionales
- Módulos: Boletines (individual y masivo), Certificados.
- Motor de PDF y plantillas configurables.
- Cola de jobs y primera Edge Function (generación masiva).

### Fase 4 — Financiero
- Módulos: Conceptos/tarifas, Facturación, Pagos (manual), Becas/descuentos.
- Reportes financieros básicos (cartera, ingresos).

### Fase 5 — Comunicación
- Módulos: Mensajería directa, Circulares, Notificaciones in-app/email.
- Integración de canales adicionales (SMS/WhatsApp) si se aprueba.

### Fase 6 — Integraciones y automatización financiera
- Webhook de pasarela de pagos, conciliación automática.
- Generación automática de facturas periódicas (job mensual).

### Fase 7 — Reportes e indicadores institucionales (BI)
- Vistas materializadas, dashboards por rol, exportaciones.

### Fase 8 — Escalado y endurecimiento
- Particionamiento de tablas de alto volumen, auditoría completa, runbooks operativos, pruebas de carga simuladas a 5.000+ estudiantes.

### Fase 9+ — Módulos opcionales (a demanda)
- Inventario y recursos, Biblioteca, app móvil, multi-tenant si se requiere ofrecer el sistema a otras instituciones.

---

## 19. Próximos pasos

1. **Aprobación de este documento** por parte de la institución/usuario.
2. Redacción del ADR sobre `matriculas` (sección 17) y migración del esquema actual.
3. Inicio de **Fase 1** únicamente tras la aprobación explícita — no se crea ningún archivo de código de aplicación antes de eso.
