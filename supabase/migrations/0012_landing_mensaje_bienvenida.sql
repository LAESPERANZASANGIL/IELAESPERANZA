-- Campos para la landing page institucional
alter table institucion_config
  add column if not exists mensaje_bienvenida text,
  add column if not exists slogan text,
  add column if not exists info_colegio text,
  add column if not exists correos_adicionales text;

notify pgrst, 'reload schema';
