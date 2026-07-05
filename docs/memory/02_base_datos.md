# Base de datos · Simbionte

## Reglas absolutas

1. **`owner_id uuid references auth.users`** en CADA tabla, con RLS activado (`owner_id = auth.uid()`).
2. **Dos esquemas** separados: `personal.*` (vida de Alex) y `coaching.*` (negocio). Nunca mezclar.
3. Toda mutación pasa por el Supabase client en `lib/supabase/`. Desde Server Actions o rutas API, nunca desde el cliente.
4. **Migraciones**: añadir siempre un nuevo fichero numerado en `supabase/`. Nunca editar los existentes.
5. Las DDL (ALTER/CREATE) van a través de `mcp__claude_ai_Supabase__apply_migration`. Las queries normales usan `execute_sql`.

---

## Proyecto Supabase

- **Project ID**: `qtkkrcehzqjkjrgssnyn`
- **Región**: `eu-west-3` (París)
- **Host DB**: `db.qtkkrcehzqjkjrgssnyn.supabase.co`
- **Owner (único usuario)**: `alexmaza.fitness@gmail.com` — UUID `0bb273d1-de9f-494e-97b1-53bf87a0094b`

---

## Esquema `personal`

### Cerebro — tareas e ideas

```sql
personal.tasks (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pendiente',
  priority text,
  due_date date,
  -- añadidos en 06_cerebro_schema.sql:
  front text NOT NULL DEFAULT 'personal',        -- 'coaching'|'formacion'|'personal'|'contenido'
  is_priority boolean NOT NULL DEFAULT false,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  recur jsonb,
  done_dates date[] NOT NULL DEFAULT '{}',
  created_at, updated_at
)

personal.ideas (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text NOT NULL,
  content text,
  status text DEFAULT 'abierta',        -- 'abierta'|'archivada'
  -- añadido en 06:
  front text NOT NULL DEFAULT 'personal',
  created_at, updated_at
)

personal.reminders (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text NOT NULL,
  remind_at timestamptz NOT NULL,
  done boolean DEFAULT false,
  -- añadido en 06:
  front text NOT NULL DEFAULT 'personal',
  created_at, updated_at
)
```

### Cerebro — El Norte y meta

```sql
personal.goal (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text NOT NULL,
  description text,
  target_date date,
  status text DEFAULT 'en_progreso',
  -- añadidos en 06:
  current_value numeric(12,2) NOT NULL DEFAULT 0,
  target_value numeric(12,2) NOT NULL DEFAULT 0,
  price_per_client numeric(12,2) NOT NULL DEFAULT 0,
  created_at, updated_at
)

personal.goal_history (
  id uuid PK,
  owner_id uuid FK auth.users,
  goal_id uuid FK personal.goal ON DELETE CASCADE,
  value numeric(12,2) NOT NULL,
  recorded_at timestamptz DEFAULT now()
)

personal.meta (
  id uuid PK,
  owner_id uuid FK auth.users,
  key text NOT NULL,
  value jsonb,
  UNIQUE (owner_id, key),
  created_at, updated_at
)
```

### Cerebro — Calendario y eventos

```sql
personal.events (
  id uuid PK,
  owner_id uuid FK auth.users,
  title text NOT NULL,
  description text,
  start_at timestamptz,                  -- nullable (añadido en 06)
  end_at timestamptz,
  location text,
  -- añadidos en 06:
  start_min integer,                     -- minuto del día (bloques recurrentes)
  end_min integer,
  event_type text,                       -- 'coaching'|'formacion'|'personal'|'contenido'
  recur jsonb,
  created_at, updated_at
)

personal.marked_dates (
  id uuid PK,
  owner_id uuid FK auth.users,
  date date NOT NULL,
  label text,
  color text,
  UNIQUE (owner_id, date),               -- una marca por fecha
  created_at, updated_at
)
```

### Cerebro — Knowledge

```sql
personal.kn_categories (
  id uuid PK,
  owner_id uuid FK auth.users,
  name text NOT NULL,
  color text,
  emoji text,                            -- añadido en 06
  created_at, updated_at
)

personal.kn_notes (
  id uuid PK,
  owner_id uuid FK auth.users,
  category_id uuid FK personal.kn_categories ON DELETE SET NULL,
  title text NOT NULL,
  content text,                          -- contenido procesado por IA
  source text,                           -- añadido en 06 (legacy: "tipo: nombre")
  -- añadidos en migración knowledge_notes_ai_fields (MCP, 2026-06-27):
  nota_bruta text,                       -- aprendizaje en bruto tal como lo escribió el usuario
  fuente_tipo text,                      -- 'libro'|'podcast'|'video'|'articulo'|'estudio'|'blog'|'experiencia'|'otro'
  fuente_nombre text NOT NULL DEFAULT '', -- nombre concreto ("Huberman Lab", "Atomic Habits"…)
  fuente_longitud text NOT NULL DEFAULT 'corta', -- 'corta'|'larga'|'sesion' (añadido en 11)
  puntos_clave jsonb NOT NULL DEFAULT '[]', -- string[]
  -- añadido en 21_knowledge_sesion_pausa.sql:
  url text,                              -- link opcional de la fuente (podcast/vídeo/artículo…)
  created_at, updated_at
)

personal.knowledge_sesion_notas (
  id uuid PK,
  owner_id uuid FK auth.users,
  sesion_id uuid NOT NULL,               -- agrupa las notas de una misma sesión (no hay tabla de sesiones aparte)
  contenido text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  -- añadidos en 21_knowledge_sesion_pausa.sql (denormalizados: se escriben
  -- en bloque sobre TODAS las filas de la sesión al pulsar "Guardar y salir"):
  estado text NOT NULL DEFAULT 'en_progreso', -- 'en_progreso'|'completada' (en la práctica 'completada' no se persiste: las filas se borran al procesar)
  fuente_tipo text,
  fuente_nombre text,
  url text,
  categoria_id uuid FK personal.kn_categories ON DELETE SET NULL,
  created_at
)

personal.kn_principles (
  id uuid PK,
  owner_id uuid FK auth.users,
  category_id uuid FK personal.kn_categories ON DELETE SET NULL,
  title text,                            -- nullable desde 06
  content text,
  source text,                           -- añadido en 06
  created_at, updated_at
)

personal.kn_systems (
  id uuid PK,
  owner_id uuid FK auth.users,
  category_id uuid FK personal.kn_categories ON DELETE SET NULL,
  title text NOT NULL,
  content text,
  created_at, updated_at
)
```

### Cerebro — Infra

```sql
personal.infra (
  id uuid PK,
  owner_id uuid FK auth.users,
  name text NOT NULL,
  description text,
  url text,
  status text DEFAULT 'activo',
  -- añadidos en 06:
  bucket text NOT NULL DEFAULT 'personal',  -- 'marca'|'servicio'|'personal'
  platform text,
  note text,
  created_at, updated_at
)

-- Bóveda de credenciales (añadida en 22_credenciales.sql). El valor real
-- nunca sale de la BD sin pasar por /api/credenciales/reveal.
personal.credenciales (
  id uuid PK,
  owner_id uuid FK auth.users ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria text NOT NULL DEFAULT 'otro',   -- 'api_key'|'password'|'credencial'|'otro'
  servicio text,
  valor_cifrado text NOT NULL,              -- pgp_sym_encrypt, base64; nunca se lee fuera del servidor
  descripcion text,
  url text,
  created_at, updated_at
)
-- Funciones (sin acceso a tablas, puro texto-entra/texto-sale):
--   personal.cifrar_valor(valor text, secreto text) returns text
--   personal.descifrar_valor(valor_cifrado text, secreto text) returns text
-- secreto = CREDENTIALS_SECRET (variable de entorno de servidor, ver 04_reglas_desarrollo.md #7)
```

### Cerebro — Lista de deseos

```sql
personal.deseos_categorias (
  id uuid PK,
  owner_id uuid FK auth.users,
  nombre text NOT NULL,
  emoji text,
  created_at, updated_at
)
-- Auto-sembrada en el primer acceso si está vacía (igual que kn_categories):
-- Tecnología, Ropa, Experiencias, Hogar, Otros (DESEOS_CATS_DEFAULT en constants.ts)

personal.lista_deseos (
  id uuid PK,
  owner_id uuid FK auth.users,
  nombre text NOT NULL,
  categoria_id uuid FK personal.deseos_categorias ON DELETE SET NULL,
  precio numeric(12,2),
  link text,
  prioridad text NOT NULL DEFAULT 'media',   -- 'alta'|'media'|'baja'
  estado text NOT NULL DEFAULT 'pendiente',  -- 'pendiente'|'comprado'
  notas text,
  imagen_url text,
  created_at, updated_at
)
```

### Finanzas

```sql
personal.fin_transactions (
  id uuid PK,
  owner_id uuid FK auth.users,
  date date NOT NULL,
  type text NOT NULL,                    -- 'ingreso'|'gasto'
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'EUR',
  category text,
  description text,
  created_at, updated_at
)

personal.fin_investments (
  id uuid PK,
  owner_id uuid FK auth.users,
  name text NOT NULL,
  type text,                             -- 'ETF'|'Acción'|'Fondo'|'Bono'|'Otro'
  amount numeric(12,2) NOT NULL,         -- coste total invertido
  date date NOT NULL,
  -- añadidos en 08:
  purchase_price numeric(14,4) NOT NULL DEFAULT 0,
  current_price numeric(14,4) NOT NULL DEFAULT 0,
  quantity numeric(14,4) NOT NULL DEFAULT 1,
  created_at, updated_at
)

personal.fin_crypto (
  id uuid PK,
  owner_id uuid FK auth.users,
  symbol text NOT NULL,
  amount numeric(20,8) NOT NULL,         -- cantidad
  purchase_price numeric(12,2),
  date date NOT NULL,
  -- añadidos en 08:
  name text,
  current_price numeric(20,8) NOT NULL DEFAULT 0,
  created_at, updated_at
)

personal.fin_debts (
  id uuid PK,
  owner_id uuid FK auth.users,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL,         -- importe original
  interest_rate numeric(5,2),
  due_date date,
  status text DEFAULT 'pendiente',
  -- añadidos en 08:
  type text,                             -- 'Hipoteca'|'Préstamo personal'|'Préstamo coche'|'Tarjeta crédito'|'Otro'
  pending_amount numeric(12,2) NOT NULL DEFAULT 0,
  monthly_payment numeric(12,2) NOT NULL DEFAULT 0,
  created_at, updated_at
)

personal.fin_savings_goal (
  id uuid PK,
  owner_id uuid FK auth.users,
  name text NOT NULL,
  target_amount numeric(12,2) NOT NULL,
  current_amount numeric(12,2) DEFAULT 0,
  target_date date,
  emoji text,                            -- añadido en 08
  created_at, updated_at
)
```

---

## Esquema `coaching`

### Clientes y suscripciones

```sql
coaching.grupos_revision (
  id uuid PK,
  owner_id uuid FK auth.users,
  codigo text NOT NULL,                  -- 'S1'|'S2'|'D1'|'D2'
  nombre text NOT NULL,
  dia_semana text,
  hora time,
  created_at, updated_at
)

coaching.clientes (
  id uuid PK,
  owner_id uuid FK auth.users,
  grupo_revision_id uuid FK coaching.grupos_revision ON DELETE SET NULL,
  nombre text NOT NULL,                  -- formato: "Apellidos, Nombre" (Title Case)
  email text,
  telefono text,
  estado text DEFAULT 'activo',          -- 'activo'|'baja'|'eliminado'
  fecha_inicio date,
  -- añadidos en 04:
  ltv_acumulado numeric(12,2) DEFAULT 0,
  fase_completada boolean DEFAULT false,
  baja_fecha date,
  baja_motivo text,
  proxima_revision date,
  created_at, updated_at
)

coaching.suscripciones (
  id uuid PK,
  owner_id uuid FK auth.users,
  cliente_id uuid FK coaching.clientes ON DELETE CASCADE,
  tarifa_id uuid FK coaching.tarifas ON DELETE SET NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date,
  estado text DEFAULT 'activa',          -- 'activa'|'cancelada'
  -- añadidos en 04:
  precio numeric(12,2) NOT NULL DEFAULT 0,
  recurrencia text DEFAULT 'Mensual',    -- 'Mensual'|'Trimestral'|'Semestral'|'Anual'
  proximo_pago date,
  created_at, updated_at
)

coaching.revisiones (
  id uuid PK,
  owner_id uuid FK auth.users,
  cliente_id uuid FK coaching.clientes ON DELETE CASCADE,
  fecha date NOT NULL,
  peso numeric(5,2),
  notas text,
  fotos_url text[],
  created_at, updated_at
)

coaching.mesociclos (
  id uuid PK,
  owner_id uuid FK auth.users,
  cliente_id uuid FK coaching.clientes ON DELETE CASCADE,
  nombre text NOT NULL,
  objetivo text,
  fecha_inicio date,
  fecha_fin date,
  -- añadidos en 04:
  numero_microciclos integer DEFAULT 1,
  dias_microciclo integer DEFAULT 7,
  estado text DEFAULT 'en_curso',        -- 'en_curso'|'cerrado'
  created_at, updated_at
)

coaching.notas_cliente (
  id uuid PK,
  owner_id uuid FK auth.users,
  cliente_id uuid FK coaching.clientes ON DELETE CASCADE,
  nota text NOT NULL,
  fecha date DEFAULT current_date,
  -- añadido en 04:
  categoria text DEFAULT 'otros',        -- 'meso'|'nutricion'|'seguimiento'|'otros'
  created_at, updated_at
)
```

### Leads y ventas

```sql
coaching.leads (
  id uuid PK,
  owner_id uuid FK auth.users,
  nombre text NOT NULL,
  email text,
  telefono text,
  origen text,
  estado text DEFAULT 'nuevo',           -- 'nuevo'|'audio'|'llamada_agendada'|'llamada_hecha'|'cliente'|'descartado'
  nota text,                             -- añadido en 04
  created_at, updated_at
)

coaching.llamadas (
  id uuid PK,
  owner_id uuid FK auth.users,
  lead_id uuid FK coaching.leads ON DELETE SET NULL,
  cliente_id uuid FK coaching.clientes ON DELETE SET NULL,
  fecha timestamptz NOT NULL,
  resultado text,
  notas text,
  -- añadido en 09:
  fase_alcanzada text,                   -- 'pre_llamada'|'apertura'|'descubrimiento'|'amplificacion'|
                                         --  'vision'|'prescripcion'|'precio'|'objeciones'|'cierre'
  created_at, updated_at
)
```

### Contenido y negocio

```sql
coaching.tarifas (
  id uuid PK,
  owner_id uuid FK auth.users,
  nombre text NOT NULL,
  precio numeric(12,2) NOT NULL,
  descripcion text,
  -- añadido en 10:
  recurrencia text DEFAULT 'Mensual',    -- 'Mensual'|'Trimestral'|'Semestral'|'Anual'
  created_at, updated_at
)
-- Tarifas reales: 115€ Mensual, 300€ Trimestral, 570€ Semestral, 1080€ Anual

coaching.contenido_ig (
  -- HUÉRFANA desde 24_contenido.sql: sustituida por contenido_ideas.
  -- No se usa en ningún código; se conserva por "migraciones solo hacia
  -- adelante" (nunca se borra una tabla ya aplicada).
  id uuid PK,
  owner_id uuid FK auth.users,
  titulo text NOT NULL,
  tipo text,                             -- 'reel'|'carrusel'|'story'|'post'
  estado text DEFAULT 'idea',            -- 'idea'|'produccion'|'programado'|'publicado'
  fecha_publicacion date,
  url text,
  created_at, updated_at
)

-- Sistema de contenido en 3 capas (añadida en 24_contenido.sql):
-- captura de ideas → banco semanal → calendario de producción con estados.
coaching.contenido_ideas (
  id uuid PK,
  owner_id uuid FK auth.users,
  titulo text NOT NULL,
  descripcion text,
  fuente text,        -- 'revision_cliente'|'podcast'|'gym'|'estudio'|'otro'
  formato text,        -- 'reel_camara'|'reel_texto_voz'|'carrusel'|'story'
  estado text NOT NULL DEFAULT 'idea',
    -- 'idea'|'seleccionada'|'en_produccion'|'grabado'|'editado'|'publicado'|'descartado'
  semana_asignada date,    -- lunes de la semana asignada
  fecha_publicacion date,  -- día objetivo mientras no está publicado; fecha real al publicar
  url_publicado text,
  notas text,
  created_at, updated_at
)

coaching.contenido_checklist (
  id uuid PK,
  owner_id uuid FK auth.users,
  key text NOT NULL,
  checked boolean DEFAULT false,
  UNIQUE (owner_id, key),
  created_at, updated_at
)

coaching.roadmap_items (
  id uuid PK,
  owner_id uuid FK auth.users,
  titulo text NOT NULL,
  descripcion text,
  estado text DEFAULT 'pendiente',       -- 'pendiente'|'curso'|'hecho'
  prioridad text,
  fecha date,
  -- añadidos en 09:
  fase_id text,                          -- 'e1'…'e7'|'o1'
  tipo text,                             -- 'existe'|'optimizar'|'crear'
  created_at, updated_at
)

coaching.roadmap_subtasks (
  id uuid PK,
  owner_id uuid FK auth.users,
  item_id uuid FK coaching.roadmap_items ON DELETE CASCADE,
  texto text NOT NULL,
  hecha boolean DEFAULT false,
  orden integer DEFAULT 0,
  created_at, updated_at
)
```

---

## Registro de migraciones

| Fichero | Fase | Contenido |
|---|---|---|
| `01_schema.sql` | 0 | Esquemas `personal` + `coaching`, todas las tablas base, trigger `set_updated_at` |
| `02_rls.sql` | 0 | RLS activado + políticas `owner_id = auth.uid()` en todas las tablas de 01 |
| `03_seed.sql` | 0 | Seed mínimo: grupos_revision S1/S2/D1/D2 + tarifas por defecto |
| `04_clientes_schema.sql` | 1 | ALTER en `clientes`, `suscripciones`, `mesociclos`, `notas_cliente`, `leads` |
| `05_grants.sql` | 1 | GRANT en `coaching.*` para PostgREST |
| `06_cerebro_schema.sql` | 2 | ALTER en `tasks`, `ideas`, `reminders`, `goal` (+ `goal_history`), `events`, `marked_dates`, `kn_*`, `infra` |
| `07_personal_grants.sql` | 2 | GRANT en `personal.*` + ALTER DEFAULT PRIVILEGES |
| `08_finanzas_schema.sql` | 3 | ALTER en `fin_investments`, `fin_crypto`, `fin_debts`, `fin_savings_goal` |
| `09_ventas_contenido_negocio_schema.sql` | 4 | ALTER en `llamadas`, `contenido_ig`, `roadmap_items` + CREATE `contenido_checklist`, `roadmap_subtasks` + seed roadmap |
| `10_tarifas_recurrencia.sql` | post-1 | ALTER `coaching.tarifas` añade `recurrencia` + UPDATE tarifas reales |
| `knowledge_notes_ai_fields` | Knowledge | ALTER `personal.kn_notes` añade `nota_bruta`, `fuente_tipo`, `fuente_nombre`, `puntos_clave` (aplicado via MCP 2026-06-27) |
| `11_knowledge_fuente_longitud.sql` | Knowledge | ALTER `personal.kn_notes` añade `fuente_longitud` |
| `12_knowledge_sesion.sql` | Knowledge | CREATE `personal.knowledge_sesion_notas` (notas temporales de sesión) |
| `13_weekly_reviews.sql` – `20_bloques_horario_v2.sql` | varios | Weekly reviews, sidebar dinámica, finanzas subsección, onboarding, Drive, asistente memoria, bloques horario v2 |
| `21_knowledge_sesion_pausa.sql` | Knowledge | ALTER `knowledge_sesion_notas` añade `estado`, `fuente_tipo`, `fuente_nombre`, `url`, `categoria_id` (pausar/retomar sesión); ALTER `kn_notes` añade `url` |
| `22_credenciales.sql` | Infra | CREATE `personal.credenciales` (bóveda cifrada) + funciones `cifrar_valor`/`descifrar_valor` (pgcrypto) |
| `23_lista_deseos.sql` | Lista de deseos | CREATE `personal.deseos_categorias` + `personal.lista_deseos`; INSERT sidebar_items ("🎁 Lista de deseos", movida después de Personal a Finanzas vía UPDATE directo) |
| `24_contenido.sql` | Contenido | CREATE `coaching.contenido_ideas` (sistema de 3 capas). Sustituye a `contenido_ig` en UI y en `/api/asistente/{chat,planificar}` — `contenido_ig` queda huérfana |
