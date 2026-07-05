-- Sistema de contenido en 3 capas: captura de ideas → banco semanal →
-- calendario de producción con estados. Sustituye funcionalmente a
-- coaching.contenido_ig (que queda huérfana, no se borra — migraciones solo
-- hacia adelante).

create table if not exists coaching.contenido_ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  titulo text not null,
  descripcion text,
  fuente text
    check (fuente in ('revision_cliente', 'podcast', 'gym', 'estudio', 'otro')),
  formato text
    check (formato in ('reel_camara', 'reel_texto_voz', 'carrusel', 'story')),
  estado text not null default 'idea'
    check (estado in ('idea', 'seleccionada', 'en_produccion', 'grabado', 'editado', 'publicado', 'descartado')),
  semana_asignada date,   -- lunes de la semana asignada
  fecha_publicacion date, -- día objetivo mientras no está publicado; fecha real al publicar
  url_publicado text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coaching.contenido_ideas enable row level security;

create policy "owner_all" on coaching.contenido_ideas
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on coaching.contenido_ideas to authenticated;

create trigger set_updated_at
  before update on coaching.contenido_ideas
  for each row execute function public.set_updated_at();
