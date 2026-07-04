-- Fase 2 fix: permitir activar/desactivar grados y grupos (cursos).
alter table grados add column if not exists activo boolean not null default true;
alter table grupos add column if not exists activo boolean not null default true;
