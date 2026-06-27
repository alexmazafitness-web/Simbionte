-- Extender CHECK de fuente_longitud para incluir 'sesion'
ALTER TABLE personal.kn_notes
  DROP CONSTRAINT IF EXISTS kn_notes_fuente_longitud_check;
ALTER TABLE personal.kn_notes
  ADD CONSTRAINT kn_notes_fuente_longitud_check
  CHECK (fuente_longitud IN ('corta', 'larga', 'sesion'));

-- Tabla de notas temporales de sesión
CREATE TABLE IF NOT EXISTS personal.knowledge_sesion_notas (
  id          uuid        PRIMARY KEY,
  owner_id    uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  sesion_id   uuid        NOT NULL,
  contenido   text        NOT NULL,
  orden       integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE personal.knowledge_sesion_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON personal.knowledge_sesion_notas
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON personal.knowledge_sesion_notas TO authenticated;
