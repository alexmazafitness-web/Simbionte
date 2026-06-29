-- Migración 20: reemplaza la plantilla semanal de bloques recurrentes.
-- Elimina los bloques existentes del owner y los sustituye por la v2
-- con títulos exactos, event_type semántico y recur rules correctas.

DO $$
DECLARE
  oid_alex uuid := '0bb273d1-de9f-494e-97b1-53bf87a0094b';
  r_never  jsonb;
BEGIN

  -- ── 1. Eliminar bloques recurrentes anteriores ──────────────────────────────
  DELETE FROM personal.events
  WHERE owner_id = oid_alex
    AND start_min IS NOT NULL;

  -- ── Recur rule base ─────────────────────────────────────────────────────────
  -- días se sobreescribe en cada INSERT; start=null, endType=never

  -- ── 2. LUNES + MIÉRCOLES [1, 3] ─────────────────────────────────────────────

  INSERT INTO personal.events (owner_id, title, start_min, end_min, event_type, recur) VALUES
    (oid_alex, 'Ritual de mañana',      300,  330, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Contenido Tipo A',      330,  480, 'contenido', '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Buffer libre',          480,  630, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Clientes batch 1',      630,  675, 'coaching',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 1',    675,  720, 'formacion', '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                720,  750, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 2',    750,  900, 'formacion', '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                900,  930, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Clientes batch 2',      930,  960, 'coaching',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Transición',            960, 1050, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Gym',                  1050, 1140, 'personal',  '{"days":[1,3],"start":null,"endType":"never"}'::jsonb);

  -- ── 3. MARTES + JUEVES [2, 4] ───────────────────────────────────────────────

  INSERT INTO personal.events (owner_id, title, start_min, end_min, event_type, recur) VALUES
    (oid_alex, 'Ritual de mañana',      300,  330, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Simbionte',             330,  450, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Contenido Tipo B',      450,  495, 'contenido', '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Buffer libre',          495,  630, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Clientes batch 1',      630,  675, 'coaching',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 1',    675,  720, 'formacion', '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                720,  750, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 2',    750,  900, 'formacion', '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                900,  930, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Clientes batch 2',      930,  960, 'coaching',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Transición',            960, 1050, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Gym',                  1050, 1140, 'personal',  '{"days":[2,4],"start":null,"endType":"never"}'::jsonb);

  -- ── 4. VIERNES [5] ──────────────────────────────────────────────────────────
  -- Igual que Lun/Mié hasta las 15:30; después: Revisión semanal → Admin → Semana cerrada → Gym

  INSERT INTO personal.events (owner_id, title, start_min, end_min, event_type, recur) VALUES
    (oid_alex, 'Ritual de mañana',          300,  330, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Contenido Tipo A',          330,  480, 'contenido', '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Buffer libre',              480,  630, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Clientes batch 1',          630,  675, 'coaching',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 1',        675,  720, 'formacion', '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                    720,  750, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Formación bloque 2',        750,  900, 'formacion', '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Comida',                    900,  930, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Revisión semanal',          930,  975, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Admin — revisión de pagos', 975,  980, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Semana cerrada',            980, 1050, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Gym',                      1050, 1140, 'personal',  '{"days":[5],"start":null,"endType":"never"}'::jsonb);

  -- ── 5. SÁBADO [6] ───────────────────────────────────────────────────────────

  INSERT INTO personal.events (owner_id, title, start_min, end_min, event_type, recur) VALUES
    (oid_alex, 'Ritual de mañana',   300,  330, 'personal',  '{"days":[6],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Batch de contenido', 330,  600, 'contenido', '{"days":[6],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Métricas Instagram', 600,  630, 'contenido', '{"days":[6],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Tiempo libre',       630, 1050, 'personal',  '{"days":[6],"start":null,"endType":"never"}'::jsonb),
    (oid_alex, 'Gym',               1050, 1140, 'personal',  '{"days":[6],"start":null,"endType":"never"}'::jsonb);

  -- ── 6. DOMINGO [0] ──────────────────────────────────────────────────────────
  -- Bloque de día completo como plantilla de "apagado digital"

  INSERT INTO personal.events (owner_id, title, start_min, end_min, event_type, recur) VALUES
    (oid_alex, 'Apagado total', 0, 1439, 'personal', '{"days":[0],"start":null,"endType":"never"}'::jsonb);

END $$;
