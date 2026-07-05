-- Suscripciones push (Web Push API) para notificaciones automáticas del
-- cron de negocio. endpoint es único: al renovarse una suscripción del
-- mismo dispositivo, el upsert por endpoint actualiza en vez de duplicar.

create table if not exists personal.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table personal.push_subscriptions enable row level security;

create policy "owner_all" on personal.push_subscriptions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on personal.push_subscriptions to authenticated;
