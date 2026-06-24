-- Simbionte — Fase 1: Control Clientes
-- Amplía el esquema coaching.* de la Fase 0 con las columnas necesarias
-- para portar la lógica de negocio de reference/minando-datos-cockpit.html.
-- No sustituye nada de 01_schema.sql/02_rls.sql, solo añade.

-- clientes: estado de baja/reactivación, LTV acumulado (sobrevive a bajas),
-- 1ª fase y fecha real de próxima revisión (sustituye al contador "revD").
alter table coaching.clientes
  add column ltv_acumulado numeric(12, 2) not null default 0,
  add column fase_completada boolean not null default false,
  add column baja_fecha date,
  add column baja_motivo text,
  add column proxima_revision date;

alter table coaching.clientes
  add constraint clientes_estado_check check (estado in ('activo', 'baja', 'eliminado'));

-- suscripciones: precio y recurrencia son una "foto" en el momento del alta
-- (si cambian las tarifas después, el cliente conserva el precio acordado),
-- más la fecha real de próximo cobro (sustituye al contador "pagoD").
alter table coaching.suscripciones
  add column precio numeric(12, 2) not null default 0,
  add column recurrencia text not null default 'Mensual',
  add column proximo_pago date;

alter table coaching.suscripciones
  add constraint suscripciones_recurrencia_check
    check (recurrencia in ('Mensual', 'Trimestral', 'Semestral', 'Anual')),
  add constraint suscripciones_estado_check check (estado in ('activa', 'cancelada'));

-- mesociclos: estructura en microciclos (p. ej. "6 × 7d") y si el ciclo
-- sigue abierto o se cerró al abrir uno nuevo (conserva histórico real,
-- a diferencia de la referencia que sobrescribía el único mesociclo).
alter table coaching.mesociclos
  add column numero_microciclos integer not null default 1,
  add column dias_microciclo integer not null default 7,
  add column estado text not null default 'en_curso';

alter table coaching.mesociclos
  add constraint mesociclos_estado_check check (estado in ('en_curso', 'cerrado'));

-- notas_cliente: las 4 categorías de la referencia (meso/nutricion/seguimiento/otros).
-- Varias notas por categoría = varias filas con la misma categoria.
alter table coaching.notas_cliente
  add column categoria text not null default 'otros';

alter table coaching.notas_cliente
  add constraint notas_cliente_categoria_check
    check (categoria in ('meso', 'nutricion', 'seguimiento', 'otros'));

-- leads: nota libre del lead, migrada a notas_cliente al convertir a cliente.
alter table coaching.leads
  add column nota text;
