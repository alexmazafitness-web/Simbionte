-- Onboarding system: tracking new client onboarding process

CREATE TABLE coaching.onboarding (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  cliente_id    uuid        NOT NULL REFERENCES coaching.clientes ON DELETE CASCADE,
  fecha_inicio  date        NOT NULL,
  estado        text        NOT NULL DEFAULT 'en_progreso',  -- 'en_progreso' | 'completado'
  completado_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coaching.onboarding_pasos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  onboarding_id uuid        NOT NULL REFERENCES coaching.onboarding ON DELETE CASCADE,
  fase          text        NOT NULL,   -- 'D0' | 'D3' | 'S1' | 'MES1'
  dia_offset    integer     NOT NULL DEFAULT 0,
  titulo        text        NOT NULL,
  completado    boolean     NOT NULL DEFAULT false,
  completado_at timestamptz,
  orden         integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coaching.onboarding       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching.onboarding_pasos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON coaching.onboarding
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_all" ON coaching.onboarding_pasos
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON coaching.onboarding       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON coaching.onboarding_pasos TO authenticated;

-- Sidebar item: Business > Onboarding > /coaching/onboarding
-- IDs match the seed in 14_sidebar_dinamica.sql
INSERT INTO personal.sidebar_items
  (id, owner_id, section_id, subsection_id, nombre, ruta, orden, es_core)
VALUES
  (
    'c0000000-0000-0000-0000-000000000019',
    '0bb273d1-de9f-494e-97b1-53bf87a0094b',
    'a0000000-0000-0000-0000-000000000003',  -- s_business
    'b0000000-0000-0000-0000-000000000003',  -- sub_onboarding
    'Onboarding',
    '/coaching/onboarding',
    1,
    true
  )
ON CONFLICT (id) DO NOTHING;
