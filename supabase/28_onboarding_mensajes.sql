-- Mensajes predefinidos y editables por etapa de onboarding (D0/D3/S1/MES1).
-- Distinta de coaching.onboarding/onboarding_pasos (seguimiento real por
-- cliente, ya existente desde 16_onboarding.sql) — esta tabla es la
-- plantilla de texto que se copia/personaliza al contactar a un cliente.

create table if not exists coaching.onboarding_mensajes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  etapa text not null check (etapa in ('D0', 'D3', 'S1', 'MES1')),
  contenido text not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, etapa)
);

alter table coaching.onboarding_mensajes enable row level security;

create policy "owner_all" on coaching.onboarding_mensajes
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on coaching.onboarding_mensajes to authenticated;

create trigger set_updated_at
  before update on coaching.onboarding_mensajes
  for each row execute function public.set_updated_at();

insert into coaching.onboarding_mensajes (owner_id, etapa, contenido) values
  ('0bb273d1-de9f-494e-97b1-53bf87a0094b', 'D0',
$$Bienvenido [nombre] 💪🏼

Te acabo de dar acceso a tu carpeta en Drive. Antes de nada, mira el vídeo que te adjunto — te explica exactamente qué necesito de ti y cómo funciona todo a partir de ahora.

Una vez lo hayas visto, completa los pasos que te indico y en cuanto los tenga listos empiezo a preparar tu plan.

Cualquier duda, aquí estoy. Vamos a por ello.$$),
  ('0bb273d1-de9f-494e-97b1-53bf87a0094b', 'D3',
$$Hola [nombre] 👋🏼

¿Cómo va todo? Quería hacer un check rápido — ¿has podido ver el vídeo y completar los pasos de la carpeta?

Si tienes alguna duda o algo no te queda claro, dímelo y lo resolvemos ahora.$$),
  ('0bb273d1-de9f-494e-97b1-53bf87a0094b', 'S1',
$$Hola [nombre] 💪🏼

Ya llevas una semana, ¿cómo te está yendo? ¿Has podido empezar con el plan sin problemas?

Cuéntame cómo te has sentido estos primeros días — entrenamientos, alimentación, cualquier cosa que quieras comentar.$$),
  ('0bb273d1-de9f-494e-97b1-53bf87a0094b', 'MES1',
$$Hola [nombre] 💪🏼

Ya llevamos un mes juntos — momento de hacer balance.

¿Cómo te has sentido en general? ¿Notando cambios? ¿Algo que te haya costado más de lo esperado?

Cuéntame con sinceridad, esto me ayuda a ajustar lo que necesites para el siguiente mes.$$)
on conflict (owner_id, etapa) do nothing;
