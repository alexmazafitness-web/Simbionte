-- Sesión Knowledge: guardar y salir sin finalizar + link opcional de fuente

-- Estado de la sesión (para "Guardar y salir" / "Continuar sesión") y
-- metadatos de fuente, denormalizados en cada fila de la sesión (se
-- escriben en bloque al guardar y salir; se leen de cualquier fila al
-- listar sesiones en pausa).
alter table personal.knowledge_sesion_notas
  add column if not exists estado text not null default 'en_progreso'
    check (estado in ('en_progreso', 'completada')),
  add column if not exists fuente_tipo text,
  add column if not exists fuente_nombre text,
  add column if not exists url text,
  add column if not exists categoria_id uuid references personal.kn_categories on delete set null;

-- Link opcional de la fuente en la nota final procesada
alter table personal.kn_notes
  add column if not exists url text;
