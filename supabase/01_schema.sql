-- Simbionte — esquema de base de datos (Fase 0)
-- Dos mundos de datos separados: personal y coaching.
-- Ver CLAUDE.md: nunca mezclar tablas de un mundo en el otro.

create extension if not exists "pgcrypto";

create schema if not exists personal;
create schema if not exists coaching;

-- Trigger compartido para mantener updated_at al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- PERSONAL
-- =========================================================

create table personal.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  description text,
  status text not null default 'pendiente',
  priority text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  content text,
  status text not null default 'abierta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.reminders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  remind_at timestamptz not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.goal (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  description text,
  target_date date,
  status text not null default 'en_progreso',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.meta (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  key text not null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key)
);

create table personal.content (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  body text,
  type text,
  status text not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.marked_dates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  date date not null,
  label text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.kn_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.kn_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  category_id uuid references personal.kn_categories on delete set null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.kn_principles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  category_id uuid references personal.kn_categories on delete set null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.kn_systems (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  category_id uuid references personal.kn_categories on delete set null,
  title text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.infra (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  name text not null,
  description text,
  url text,
  status text not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.fin_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  date date not null,
  type text not null,
  amount numeric(12, 2) not null,
  currency text not null default 'EUR',
  category text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.fin_investments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  name text not null,
  type text,
  amount numeric(12, 2) not null,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.fin_crypto (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  symbol text not null,
  amount numeric(20, 8) not null,
  purchase_price numeric(12, 2),
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.fin_debts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  name text not null,
  amount numeric(12, 2) not null,
  interest_rate numeric(5, 2),
  due_date date,
  status text not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal.fin_savings_goal (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  name text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- COACHING
-- =========================================================

create table coaching.grupos_revision (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  codigo text not null,
  nombre text not null,
  dia_semana text,
  hora time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.tarifas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  nombre text not null,
  precio numeric(12, 2) not null,
  descripcion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.clientes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  grupo_revision_id uuid references coaching.grupos_revision on delete set null,
  nombre text not null,
  email text,
  telefono text,
  estado text not null default 'activo',
  fecha_inicio date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.suscripciones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  cliente_id uuid not null references coaching.clientes on delete cascade,
  tarifa_id uuid references coaching.tarifas on delete set null,
  fecha_inicio date not null,
  fecha_fin date,
  estado text not null default 'activa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.revisiones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  cliente_id uuid not null references coaching.clientes on delete cascade,
  fecha date not null,
  peso numeric(5, 2),
  notas text,
  fotos_url text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.mesociclos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  cliente_id uuid not null references coaching.clientes on delete cascade,
  nombre text not null,
  objetivo text,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.notas_cliente (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  cliente_id uuid not null references coaching.clientes on delete cascade,
  nota text not null,
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  nombre text not null,
  email text,
  telefono text,
  origen text,
  estado text not null default 'nuevo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.llamadas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  lead_id uuid references coaching.leads on delete set null,
  cliente_id uuid references coaching.clientes on delete set null,
  fecha timestamptz not null,
  resultado text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.contenido_ig (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  titulo text not null,
  tipo text,
  estado text not null default 'idea',
  fecha_publicacion date,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coaching.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  titulo text not null,
  descripcion text,
  estado text not null default 'pendiente',
  prioridad text,
  fecha date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- Triggers updated_at
-- =========================================================

do $$
declare
  t record;
begin
  for t in
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('personal', 'coaching')
  loop
    execute format(
      'create trigger set_updated_at before update on %I.%I for each row execute function public.set_updated_at();',
      t.table_schema, t.table_name
    );
  end loop;
end $$;
