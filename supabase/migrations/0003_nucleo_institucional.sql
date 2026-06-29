-- ============================================================================
-- Campus La Esperanza - Fase 2: Nucleo institucional
-- Agrega configuracion institucional (fila unica) y jornada de los grupos.
-- ============================================================================

create type jornada as enum ('mañana', 'tarde', 'noche');

alter table grupos add column jornada jornada;

-- Fila unica: id fijo para que la app siempre haga upsert sobre el mismo registro.
create table institucion_config (
  id uuid primary key default '00000000-0000-0000-0000-000000000001'::uuid,
  nombre text not null,
  nit text,
  codigo_dane text,
  direccion text,
  telefono text,
  correo text,
  rector_id uuid references profiles (id) on delete set null,
  escudo_url text,
  logo_url text,
  anio_lectivo_activo_id uuid references anios_lectivos (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_institucion_config_updated_at before update on institucion_config
  for each row execute function set_updated_at();

alter table institucion_config enable row level security;

create policy "institucion_config_select_all" on institucion_config for select using (true);
create policy "institucion_config_write_staff" on institucion_config for all
  using (is_staff()) with check (is_staff());
