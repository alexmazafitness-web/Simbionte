CREATE TABLE IF NOT EXISTS personal.weekly_reviews (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                  uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  semana_inicio             date        NOT NULL,
  semana_fin                date        NOT NULL,
  datos_automaticos         jsonb       NOT NULL DEFAULT '{}',
  respuestas_usuario        jsonb       NOT NULL DEFAULT '{}',
  feedback_ia               jsonb,
  mrr_snapshot              integer     NOT NULL DEFAULT 0,
  clientes_activos_snapshot integer     NOT NULL DEFAULT 0,
  leads_activos_snapshot    integer     NOT NULL DEFAULT 0,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, semana_inicio)
);
ALTER TABLE personal.weekly_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON personal.weekly_reviews
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON personal.weekly_reviews TO authenticated;
