-- Simbionte — Fase 2: Cerebro (módulo personal)
-- Amplía el esquema personal.* de la Fase 0 con las columnas/tablas necesarias
-- para portar la lógica de reference/segundo-cerebro.html. Solo ALTER/CREATE,
-- nunca se edita 01_schema.sql.

-- =========================================================
-- TAREAS — motor de recurrencia (recur) + completado por ocurrencia (done_dates)
-- =========================================================

alter table personal.tasks
  add column front text not null default 'personal',
  add column is_priority boolean not null default false,
  add column done boolean not null default false,
  add column done_at timestamptz,
  add column recur jsonb,
  add column done_dates date[] not null default '{}';

alter table personal.tasks
  add constraint tasks_front_check check (front in ('coaching', 'formacion', 'personal', 'contenido'));

-- =========================================================
-- IDEAS
-- =========================================================

alter table personal.ideas
  add column front text not null default 'personal';

alter table personal.ideas
  add constraint ideas_front_check check (front in ('coaching', 'formacion', 'personal', 'contenido')),
  add constraint ideas_status_check check (status in ('abierta', 'archivada'));

-- =========================================================
-- RECORDATORIOS
-- =========================================================

alter table personal.reminders
  add column front text not null default 'personal';

alter table personal.reminders
  add constraint reminders_front_check check (front in ('coaching', 'formacion', 'personal', 'contenido'));

-- =========================================================
-- EL NORTE — singleton (cur/tgt/price) + histórico real en tabla aparte
-- =========================================================

alter table personal.goal
  add column current_value numeric(12, 2) not null default 0,
  add column target_value numeric(12, 2) not null default 0,
  add column price_per_client numeric(12, 2) not null default 0;

create table personal.goal_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  goal_id uuid not null references personal.goal on delete cascade,
  value numeric(12, 2) not null,
  recorded_at timestamptz not null default now()
);

-- goal_history es una tabla nueva: 02_rls.sql ya se ejecutó sobre las tablas
-- de la Fase 0 y volver a correrlo duplicaría políticas en las que ya existen.
-- Se activa RLS aquí mismo, solo para esta tabla.
alter table personal.goal_history enable row level security;

create policy owner_id_policy on personal.goal_history
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- =========================================================
-- CALENDARIO — los bloques son siempre recurrentes semanales (start_min/end_min + recur),
-- nunca tienen una fecha fija, así que start_at deja de ser obligatorio.
-- =========================================================

alter table personal.events
  alter column start_at drop not null,
  add column start_min integer,
  add column end_min integer,
  add column event_type text,
  add column recur jsonb;

alter table personal.events
  add constraint events_type_check check (event_type is null or event_type in ('coaching', 'formacion', 'personal', 'contenido'));

-- Como mucho una marca por fecha (isDateMarked/getMark del HTML asumen una sola).
alter table personal.marked_dates
  add constraint marked_dates_owner_date_unique unique (owner_id, date);

-- =========================================================
-- KNOWLEDGE
-- =========================================================

alter table personal.kn_categories
  add column emoji text;

alter table personal.kn_notes
  add column source text;

alter table personal.kn_principles
  alter column title drop not null,
  add column source text;

-- personal.kn_systems ya cubre el modelo (title=nombre del sistema, content=proceso).

-- =========================================================
-- INFRA — 3 cajones fijos (marca/servicio/personal) + plataforma/nota
-- =========================================================

alter table personal.infra
  add column bucket text not null default 'personal',
  add column platform text,
  add column note text;

alter table personal.infra
  add constraint infra_bucket_check check (bucket in ('marca', 'servicio', 'personal'));
