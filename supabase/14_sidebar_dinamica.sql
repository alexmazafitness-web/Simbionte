-- Tablas para la sidebar dinámica
CREATE TABLE IF NOT EXISTS personal.sidebar_sections (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nombre     text        NOT NULL,
  icono      text,
  orden      integer     NOT NULL DEFAULT 0,
  es_core    boolean     NOT NULL DEFAULT false,
  visible    boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal.sidebar_subsections (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  section_id uuid    NOT NULL REFERENCES personal.sidebar_sections ON DELETE CASCADE,
  nombre     text    NOT NULL,
  orden      integer NOT NULL DEFAULT 0,
  es_core    boolean NOT NULL DEFAULT false,
  visible    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS personal.sidebar_items (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid    NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  section_id    uuid    NOT NULL REFERENCES personal.sidebar_sections ON DELETE CASCADE,
  subsection_id uuid    REFERENCES personal.sidebar_subsections ON DELETE SET NULL,
  nombre        text    NOT NULL,
  ruta          text    NOT NULL,
  icono         text,
  orden         integer NOT NULL DEFAULT 0,
  es_core       boolean NOT NULL DEFAULT false,
  visible       boolean NOT NULL DEFAULT true
);

ALTER TABLE personal.sidebar_sections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal.sidebar_subsections ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal.sidebar_items       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON personal.sidebar_sections
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all" ON personal.sidebar_subsections
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all" ON personal.sidebar_items
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON personal.sidebar_sections    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON personal.sidebar_subsections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON personal.sidebar_items       TO authenticated;

-- Seed inicial para alexmaza.fitness@gmail.com
DO $$
DECLARE
  uid            uuid := '0bb273d1-de9f-494e-97b1-53bf87a0094b';
  s_midia        uuid := 'a0000000-0000-0000-0000-000000000001';
  s_personal     uuid := 'a0000000-0000-0000-0000-000000000002';
  s_business     uuid := 'a0000000-0000-0000-0000-000000000003';
  sub_cerebro    uuid := 'b0000000-0000-0000-0000-000000000001';
  sub_captacion  uuid := 'b0000000-0000-0000-0000-000000000002';
  sub_onboarding uuid := 'b0000000-0000-0000-0000-000000000003';
  sub_operativa  uuid := 'b0000000-0000-0000-0000-000000000004';
BEGIN
  INSERT INTO personal.sidebar_sections (id, owner_id, nombre, icono, orden, es_core) VALUES
    (s_midia,    uid, 'Mi día',   'checkCircle', 1, true),
    (s_personal, uid, 'Personal', 'home',        2, true),
    (s_business, uid, 'Business', 'briefcase',   3, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO personal.sidebar_subsections (id, owner_id, section_id, nombre, orden, es_core) VALUES
    (sub_cerebro,    uid, s_personal, 'Cerebro',    1, true),
    (sub_captacion,  uid, s_business, 'Captación',  1, true),
    (sub_onboarding, uid, s_business, 'Onboarding', 2, true),
    (sub_operativa,  uid, s_business, 'Operativa',  3, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO personal.sidebar_items
    (id, owner_id, section_id, subsection_id, nombre, ruta, icono, orden, es_core) VALUES
    ('c0000000-0000-0000-0000-000000000001', uid, s_midia, NULL, 'Mi día', '/personal/cerebro', 'checkCircle', 1, true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO personal.sidebar_items
    (id, owner_id, section_id, subsection_id, nombre, ruta, orden, es_core) VALUES
    ('c0000000-0000-0000-0000-000000000002', uid, s_personal, sub_cerebro,   'Tareas',           '/personal/cerebro/tareas',        1, true),
    ('c0000000-0000-0000-0000-000000000003', uid, s_personal, sub_cerebro,   'Ideas',            '/personal/cerebro/ideas',         2, true),
    ('c0000000-0000-0000-0000-000000000004', uid, s_personal, sub_cerebro,   'Recordatorios',    '/personal/cerebro/recordatorios', 3, true),
    ('c0000000-0000-0000-0000-000000000005', uid, s_personal, sub_cerebro,   'Calendario',       '/personal/cerebro/calendario',    4, true),
    ('c0000000-0000-0000-0000-000000000006', uid, s_personal, sub_cerebro,   'Knowledge',        '/personal/cerebro/knowledge',     5, true),
    ('c0000000-0000-0000-0000-000000000007', uid, s_personal, sub_cerebro,   'El Norte',         '/personal/cerebro/norte',         6, true),
    ('c0000000-0000-0000-0000-000000000008', uid, s_personal, sub_cerebro,   'Revisión semanal', '/personal/cerebro/revision',      7, true),
    ('c0000000-0000-0000-0000-000000000009', uid, s_personal, sub_cerebro,   'Infra',            '/personal/cerebro/infra',         8, true),
    ('c0000000-0000-0000-0000-000000000010', uid, s_personal, NULL,          'Finanzas',         '/personal/finanzas',              2, true),
    ('c0000000-0000-0000-0000-000000000011', uid, s_business, sub_captacion, 'Leads',            '/coaching/leads',                 1, true),
    ('c0000000-0000-0000-0000-000000000012', uid, s_business, sub_captacion, 'Ventas',           '/coaching/ventas',                2, true),
    ('c0000000-0000-0000-0000-000000000013', uid, s_business, sub_captacion, 'Contenido',        '/coaching/contenido',             3, true),
    ('c0000000-0000-0000-0000-000000000014', uid, s_business, sub_captacion, 'Negocio',          '/coaching/negocio',               4, true),
    ('c0000000-0000-0000-0000-000000000015', uid, s_business, sub_operativa, 'Clientes',         '/coaching/clientes',              1, true),
    ('c0000000-0000-0000-0000-000000000016', uid, s_business, sub_operativa, 'Pagos',            '/coaching/pagos',                 2, true),
    ('c0000000-0000-0000-0000-000000000017', uid, s_business, sub_operativa, 'Revisiones',       '/coaching/revisiones',            3, true),
    ('c0000000-0000-0000-0000-000000000018', uid, s_business, sub_operativa, 'Mesociclos',       '/coaching/mesociclos',            4, true)
  ON CONFLICT (id) DO NOTHING;
END $$;
