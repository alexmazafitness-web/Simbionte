-- Contexto de preparación de llamada por lead: cuestionario pegado o datos
-- manuales + script de venta generado por IA. Una fila por lead (upsert por
-- lead_id). respuestas_cuestionario es texto libre pegado tal cual (no JSON
-- real pese a lo que sugiere el nombre); datos_manuales sí es un objeto
-- estructurado, por eso es jsonb.

create table if not exists coaching.lead_contexto (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  lead_id uuid not null references coaching.leads on delete cascade,
  respuestas_cuestionario text,
  datos_manuales jsonb,
  script_generado text,
  script_generado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id)
);

alter table coaching.lead_contexto enable row level security;

create policy "owner_all" on coaching.lead_contexto
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on coaching.lead_contexto to authenticated;

create trigger set_updated_at
  before update on coaching.lead_contexto
  for each row execute function public.set_updated_at();
