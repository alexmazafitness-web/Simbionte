-- Simbionte — permisos de esquema para PostgREST sobre personal.* (Fase 2)
-- Mismo motivo que 05_grants.sql: RLS controla qué FILAS se ven, esto controla
-- si el rol puede tocar la TABLA. Nunca se hizo para "personal" en fases
-- anteriores porque hasta ahora no tenía ningún consumidor real.

grant usage on schema personal to anon, authenticated, service_role;
grant all on all tables in schema personal to anon, authenticated, service_role;
grant all on all sequences in schema personal to anon, authenticated, service_role;

alter default privileges in schema personal
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema personal
  grant all on sequences to anon, authenticated, service_role;
