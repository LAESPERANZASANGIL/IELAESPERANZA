# ADR 0002 — Rebranding del producto a "Campus La Esperanza"

## Contexto

El producto se identificaba en el código, la documentación y la interfaz como "IE La Esperanza" / "Sistema académico", calcando el nombre corto de la institución. A partir de esta decisión, el producto adopta una identidad propia, "Campus La Esperanza", distinta del nombre legal de la institución, para reflejar que se trata de una plataforma (con su propia marca, paleta de color y eventualmente logotipo) y no solo un sistema interno sin identidad.

## Decisión

- **Nombre del proyecto**: `package.json#name` pasa de `ielaesperanza` a `campus-la-esperanza`. El repositorio Git y la carpeta de trabajo conservan su nombre histórico por ahora (cambiarlos está fuera del alcance de este ADR).
- **Título de la aplicación**: el `<title>` (`src/app/layout.tsx`) y los textos visibles en login/sidebar usan "Campus La Esperanza".
- **Identidad visual inicial**: se definen tokens de color institucionales en `src/app/globals.css` bajo `--color-brand-*` (verde institucional, escala 50–900) y `--color-accent-*` (dorado, escala 50–700), expuestos como colores de Tailwind v4 vía `@theme`. Todas las clases `emerald-*` usadas previamente en componentes y páginas se migraron a `brand-*` para que el cambio de paleta sea consistente en toda la app desde un solo lugar (las variables CSS).
- **Sin logotipo definitivo**: se usa un monograma de texto ("CE") como placeholder en el sidebar y la pantalla de login, fácil de sustituir por un logotipo real más adelante sin tocar la estructura.
- **Dashboard modernizado**: se introduce `DashboardShell` (`src/components/layout/DashboardShell.tsx`), un componente cliente que envuelve `Sidebar` y el contenido, añadiendo un drawer lateral para móvil (con overlay) y una barra superior compacta en pantallas pequeñas. El `Sidebar` ahora agrupa los ítems de navegación por sección (`group` en `nav-config.ts`), inspirado en la navegación por secciones de plataformas como Google Classroom, Notion y Phidias. El panel principal (`(dashboard)/dashboard/page.tsx`) usa un banner de bienvenida con gradiente de marca y tarjetas con acento de color superior en lugar del listado plano de tarjetas anterior.

## Consecuencias

- La paleta de color vive en un solo archivo (`globals.css`); ajustar la identidad de marca en el futuro (p. ej. al definir el logotipo final) no requiere tocar componentes individuales.
- `DashboardShell` centraliza el estado de apertura/cierre del menú móvil; cualquier ruta dentro de `(dashboard)` hereda automáticamente el comportamiento responsivo.
- El nombre del repositorio (`IELAESPERANZA`) y la URL del proyecto en GitHub no cambian en este ADR; solo cambia la identidad de producto expuesta a usuarios finales y en metadatos de build (`package.json`, `<title>`).

## Alternativas consideradas

- **Mantener "IE La Esperanza" como nombre de producto**: descartado porque el usuario pidió explícitamente una identidad de producto distinta ("Campus La Esperanza") a partir de esta fecha.
- **Diseñar un logotipo ahora**: descartado porque el usuario indicó explícitamente que el logotipo definitivo se definirá más adelante; este ADR solo cubre la paleta de color y la tipografía de marca.
