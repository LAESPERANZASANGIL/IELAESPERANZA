-- Agrega campo de mensaje principal para la landing page
alter table institucion_config
  add column if not exists mensaje_bienvenida text,
  add column if not exists slogan text;

notify pgrst, 'reload schema';
