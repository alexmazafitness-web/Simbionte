-- Simbionte — Row Level Security (Fase 0)
-- Activa RLS en todas las tablas de personal.* y coaching.*
-- y crea una policy unica owner_id = auth.uid() para select/insert/update/delete.

do $$
declare
  t record;
begin
  for t in
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('personal', 'coaching')
  loop
    execute format('alter table %I.%I enable row level security;', t.table_schema, t.table_name);

    execute format(
      'create policy owner_id_policy on %I.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());',
      t.table_schema, t.table_name
    );
  end loop;
end $$;
