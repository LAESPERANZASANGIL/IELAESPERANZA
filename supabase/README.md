# Base de datos - Campus La Esperanza

Migraciones SQL para el proyecto Supabase/PostgreSQL.

## Aplicar migraciones

Con la [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <project-id>
supabase db push
```

O ejecuta manualmente cada archivo de `migrations/` en el SQL Editor de Supabase, en orden:

1. `0001_init.sql` — tablas, enums e índices.
2. `0002_rls.sql` — funciones auxiliares y políticas de Row Level Security por rol.
3. `0003_nucleo_institucional.sql` — configuración institucional (`institucion_config`, fila única) y jornada de los grupos.

## Roles

`rector`, `administrador`, `secretaria`, `docente`, `padre_familia`, `estudiante`.

Cada usuario de `auth.users` debe tener una fila correspondiente en `profiles` con su `role`.
