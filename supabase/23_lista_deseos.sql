-- Lista de deseos (Personal): categorías editables + items con prioridad/estado.

create table if not exists personal.deseos_categorias (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  nombre text not null,
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists personal.lista_deseos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  nombre text not null,
  categoria_id uuid references personal.deseos_categorias on delete set null,
  precio numeric(12,2),
  link text,
  prioridad text not null default 'media'
    check (prioridad in ('alta', 'media', 'baja')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'comprado')),
  notas text,
  imagen_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal.deseos_categorias enable row level security;
alter table personal.lista_deseos enable row level security;

create policy "owner_all" on personal.deseos_categorias
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_all" on personal.lista_deseos
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on personal.deseos_categorias to authenticated;
grant select, insert, update, delete on personal.lista_deseos to authenticated;

create trigger set_updated_at
  before update on personal.deseos_categorias
  for each row execute function public.set_updated_at();
create trigger set_updated_at
  before update on personal.lista_deseos
  for each row execute function public.set_updated_at();

-- Enlace en la sidebar, bajo "Personal" (como item plano, debajo de las
-- subsecciones PRODUCTIVIDAD y Finanzas ya existentes).
insert into personal.sidebar_items
  (id, owner_id, section_id, subsection_id, nombre, ruta, orden, es_core)
values
  ('c0000000-0000-0000-0000-000000000030',
   '0bb273d1-de9f-494e-97b1-53bf87a0094b',
   'a0000000-0000-0000-0000-000000000002',
   null,
   '🎁 Lista de deseos',
   '/personal/deseos',
   3,
   true)
on conflict (id) do nothing;
