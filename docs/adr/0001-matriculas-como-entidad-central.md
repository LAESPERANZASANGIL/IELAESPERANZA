# ADR 0001 — `matriculas` como entidad central del modelo académico

## Estado
Aceptado.

## Contexto

El scaffold inicial (Fase 0, PR #1) modeló a `estudiantes` con una columna `grupo_id` directa, y `notas`/`asistencia` referenciando `estudiante_id` directamente. Este modelo es simple pero no sobrevive a la realidad de una institución educativa operando durante varios años:

- Un estudiante cambia de grupo cada año lectivo (e incluso a mitad de año, por traslado interno).
- Un estudiante puede repetir un grado, quedando dos matrículas distintas en grados distintos en años distintos.
- Un estudiante puede retirarse y, en casos raros, reingresar en un año posterior.
- Los reportes históricos (boletines de hace 3 años, certificados de notas de un año específico) necesitan poder reconstruirse exactamente como eran en ese momento, sin que un cambio posterior de grupo del estudiante los corrompa.

Con `estudiantes.grupo_id` directo, mover a un estudiante de grupo destruye la noción de "en qué grupo estaba cuando se registró esta nota". Con `notas.estudiante_id` directo, no hay forma no ambigua de saber a qué año lectivo o grupo pertenece una nota sin inferirlo de la fecha de creación — y eso falla en escenarios de repitencia.

## Decisión

Se introduce `matriculas` como entidad intermedia:

```
estudiantes (atemporal) ──< matriculas >── grupos
                              │
                              ├── anio_lectivo_id
                              │
                              └─< notas, asistencia, observador_estudiante, boletines
```

- `estudiantes` deja de tener `grupo_id`. Es una entidad puramente biográfica (nombre, documento, fecha de nacimiento), válida durante toda la vida del estudiante en la institución.
- `matriculas` representa la relación concreta "este estudiante, en este año lectivo, está en este grupo". Tiene `unique(estudiante_id, anio_lectivo_id)`: un estudiante no puede tener dos matrículas activas el mismo año.
- `notas`, `asistencia` y `observador_estudiante` referencian `matricula_id`, no `estudiante_id`. Esto ata cada registro académico al contexto exacto (año + grupo) en que ocurrió, sin ambigüedad, incluso si el estudiante luego se traslada o repite.
- `boletines` también referencia `matricula_id` en vez de `estudiante_id` + `periodo`, por la misma razón.

## Consecuencias

**Positivas:**
- Historial multi-año correcto sin casos especiales en el código de reportes.
- El flujo de matrícula se modela explícitamente como proceso (`procesos_matricula`, `solicitudes_admision`, `matriculas`), no como un efecto secundario de crear un estudiante.
- Las políticas RLS pueden resolver "¿este usuario puede ver este registro?" de forma consistente vía `matricula_id` → `estudiante_id`/`grupo_id`, en un solo patrón reutilizado en notas, asistencia y disciplina.

**Negativas / costos:**
- Una consulta más (join a `matriculas`) para resolver "el grupo actual de un estudiante", comparado con leer `estudiantes.grupo_id` directo. Mitigado con índices en `matriculas(estudiante_id, anio_lectivo_id)`.
- Mayor complejidad conceptual inicial para quien lee el esquema por primera vez — se documenta explícitamente aquí y en `MASTER_PLAN.md` sección 3.4–3.6.
- Requiere que toda futura pantalla de notas/asistencia resuelva primero la `matricula_id` vigente del estudiante en el año lectivo activo, en vez de usar su id directamente.

## Alternativas consideradas

1. **Mantener `estudiantes.grupo_id` y añadir una tabla de historial aparte.** Se descartó: duplicaría la fuente de verdad (¿el grupo "actual" vive en `estudiantes` o se calcula del historial?) y generaría inconsistencias.
2. **Versionar `estudiantes` con una fila por año lectivo.** Se descartó: rompe la identidad única del estudiante (datos biográficos no deberían duplicarse cada año) y complica las relaciones con `acudientes`.

`matriculas` como tabla intermedia es el patrón estándar en sistemas de información académica (SIS) de este tipo, y es el que se adopta.
