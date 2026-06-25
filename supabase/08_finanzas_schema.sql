-- Simbionte — Fase 3: Finanzas (módulo personal)
-- Amplía el esquema personal.fin_* de la Fase 0 con las columnas necesarias
-- para portar la lógica de reference/finanzas_personales.html. Solo ALTER,
-- nunca se edita 01_schema.sql.

-- =========================================================
-- TRANSACCIONES — ya encajaba casi 1:1, solo se cierra el enum de tipo.
-- =========================================================

alter table personal.fin_transactions
  add constraint fin_transactions_type_check check (type in ('ingreso', 'gasto'));

-- =========================================================
-- INVERSIONES — el HTML necesita precio de compra, precio actual y cantidad
-- por separado para calcular rentabilidad; "amount" no los distinguía.
-- =========================================================

alter table personal.fin_investments
  add column purchase_price numeric(14, 4) not null default 0,
  add column current_price numeric(14, 4) not null default 0,
  add column quantity numeric(14, 4) not null default 1;

alter table personal.fin_investments
  add constraint fin_investments_type_check check (type in ('ETF', 'Acción', 'Fondo', 'Bono', 'Otro'));

-- "amount" (NOT NULL desde la Fase 0) se mantiene como coste total invertido
-- (purchase_price × quantity) — ya no es la columna que pilota la lógica,
-- pero se conserva en vez de tocar la definición original.

-- =========================================================
-- CRYPTO — "amount" (numeric 20,8) ya servía como cantidad; faltaba
-- nombre y precio actual para calcular P&L.
-- =========================================================

alter table personal.fin_crypto
  add column name text,
  add column current_price numeric(20, 8) not null default 0;

-- =========================================================
-- DEUDAS — "amount" ya es el importe original; faltaba tipo, pendiente
-- y cuota mensual.
-- =========================================================

alter table personal.fin_debts
  add column type text,
  add column pending_amount numeric(12, 2) not null default 0,
  add column monthly_payment numeric(12, 2) not null default 0;

alter table personal.fin_debts
  add constraint fin_debts_type_check
    check (type is null or type in ('Hipoteca', 'Préstamo personal', 'Préstamo coche', 'Tarjeta crédito', 'Otro'));

-- =========================================================
-- OBJETIVO DE AHORRO — encajaba perfectamente, solo falta el icono.
-- =========================================================

alter table personal.fin_savings_goal
  add column emoji text;
