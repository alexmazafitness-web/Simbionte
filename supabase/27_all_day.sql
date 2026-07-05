-- Eventos/recordatorios "todo el día" (sin horario específico). Solo aplica
-- a eventos únicos (start_at) y recordatorios — los bloques recurrentes
-- semanales (start_min/end_min) no tienen este concepto, siempre ocupan un
-- slot horario concreto en la plantilla.
alter table personal.events add column if not exists all_day boolean not null default false;
alter table personal.reminders add column if not exists all_day boolean not null default false;
