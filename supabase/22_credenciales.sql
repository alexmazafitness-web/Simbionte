-- Bóveda de credenciales (Infra): API keys, contraseñas, credenciales de
-- acceso. Cifrado con pgcrypto (pgp_sym_encrypt/decrypt); la clave
-- (CREDENTIALS_SECRET) nunca se guarda en la base de datos, solo en las
-- variables de entorno del servidor Next.js.

create extension if not exists pgcrypto with schema extensions;

create table if not exists personal.credenciales (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  nombre text not null,
  categoria text not null default 'otro'
    check (categoria in ('api_key', 'password', 'credencial', 'otro')),
  servicio text,
  valor_cifrado text not null,
  descripcion text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table personal.credenciales enable row level security;

create policy "owner_all" on personal.credenciales
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

grant select, insert, update, delete on personal.credenciales to authenticated;

create trigger set_updated_at
  before update on personal.credenciales
  for each row execute function public.set_updated_at();

-- Funciones de cifrado/descifrado: puro texto-entra/texto-sale, sin acceso a
-- ninguna tabla. La RLS de personal.credenciales sigue siendo la única vía
-- de acceso a los datos; estas funciones no son un vector de bypass.
create or replace function personal.cifrar_valor(valor text, secreto text)
returns text
language sql
as $$
  select encode(extensions.pgp_sym_encrypt(valor, secreto), 'base64');
$$;

create or replace function personal.descifrar_valor(valor_cifrado text, secreto text)
returns text
language sql
as $$
  select extensions.pgp_sym_decrypt(decode(valor_cifrado, 'base64'), secreto);
$$;

revoke execute on function personal.cifrar_valor(text, text) from public;
revoke execute on function personal.descifrar_valor(text, text) from public;
grant execute on function personal.cifrar_valor(text, text) to authenticated;
grant execute on function personal.descifrar_valor(text, text) to authenticated;
