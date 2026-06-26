-- Simbionte — añade recurrencia a coaching.tarifas
-- En el negocio real de Alex cada importe corresponde siempre a la misma
-- recurrencia (115€→Mensual, 300€→Trimestral, 570€→Semestral, 1080€→Anual),
-- así que dejan de pedirse como dos campos independientes en "Nuevo cliente".

alter table coaching.tarifas
  add column recurrencia text not null default 'Mensual';

alter table coaching.tarifas
  add constraint tarifas_recurrencia_check
    check (recurrencia in ('Mensual', 'Trimestral', 'Semestral', 'Anual'));

update coaching.tarifas set recurrencia = 'Mensual' where precio = 115;
update coaching.tarifas set recurrencia = 'Trimestral' where precio = 300;
update coaching.tarifas set recurrencia = 'Semestral' where precio = 570;
update coaching.tarifas set recurrencia = 'Anual' where precio = 1080;
