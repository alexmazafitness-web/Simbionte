-- Asistente conversacional: memoria persistente + historial de conversaciones

CREATE TABLE IF NOT EXISTS personal.asistente_memoria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  contenido   text NOT NULL,
  categoria   text NOT NULL CHECK (categoria IN ('prioridad','decision','preferencia','contexto_cliente','objetivo')),
  relevancia  integer NOT NULL DEFAULT 5 CHECK (relevancia BETWEEN 1 AND 10),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal.asistente_conversaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rol         text NOT NULL CHECK (rol IN ('user','assistant')),
  mensaje     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_asistente_memoria_owner ON personal.asistente_memoria (owner_id, relevancia DESC);
CREATE INDEX IF NOT EXISTS idx_asistente_conv_owner_date ON personal.asistente_conversaciones (owner_id, created_at DESC);

-- RLS
ALTER TABLE personal.asistente_memoria         ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal.asistente_conversaciones  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON personal.asistente_memoria        FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner" ON personal.asistente_conversaciones FOR ALL USING (owner_id = auth.uid());

-- updated_at trigger for memoria
CREATE TRIGGER set_updated_at_asistente_memoria
  BEFORE UPDATE ON personal.asistente_memoria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grants
GRANT ALL ON personal.asistente_memoria        TO authenticated;
GRANT ALL ON personal.asistente_conversaciones TO authenticated;
