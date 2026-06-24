-- Simbionte — permisos de esquema para PostgREST (Fase 1)
-- RLS controla qué FILAS se ven; esto controla si el rol puede tocar la TABLA.
-- Necesario antes de exponer "coaching" en Project Settings → Data API → Exposed schemas.

grant usage on schema coaching to anon, authenticated, service_role;
grant all on all tables in schema coaching to anon, authenticated, service_role;
grant all on all sequences in schema coaching to anon, authenticated, service_role;

alter default privileges in schema coaching
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema coaching
  grant all on sequences to anon, authenticated, service_role;
