-- Campos editables del encabezado del boletín institucional
alter table institucion_config
  add column if not exists enfasis text,
  add column if not exists resolucion text,
  add column if not exists secretaria_educacion text;

notify pgrst, 'reload schema';
