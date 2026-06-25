-- Simbionte — Fase 4: Ventas + Contenido + Negocio (módulos de Coaching)
-- Amplía coaching.llamadas / coaching.contenido_ig / coaching.roadmap_items
-- de la Fase 0, y añade 2 tablas nuevas. Solo ALTER/CREATE, nunca se edita
-- 01_schema.sql.

-- =========================================================
-- VENTAS — coaching.llamadas: falta la fase del guion alcanzada en la llamada.
-- =========================================================

alter table coaching.llamadas
  add column fase_alcanzada text;

alter table coaching.llamadas
  add constraint llamadas_fase_check check (
    fase_alcanzada is null or fase_alcanzada in (
      'pre_llamada', 'apertura', 'descubrimiento', 'amplificacion',
      'vision', 'prescripcion', 'precio', 'objeciones', 'cierre'
    )
  );

-- =========================================================
-- CONTENIDO — coaching.contenido_ig ya encajaba para el calendario de piezas
-- (titulo/tipo/estado/fecha_publicacion); se cierran los enums.
-- =========================================================

alter table coaching.contenido_ig
  add constraint contenido_ig_tipo_check check (tipo is null or tipo in ('reel', 'carrusel', 'story', 'post'));

alter table coaching.contenido_ig
  add constraint contenido_ig_estado_check check (estado in ('idea', 'produccion', 'programado', 'publicado'));

-- Checklist de cuenta (diagnóstico + perfil de auditoria_ig.html) — 7 ítems
-- fijos con estado booleano persistido. Las etiquetas/descripciones largas
-- viven en código (son texto de referencia, no cambian), aquí solo el check.
create table coaching.contenido_checklist (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  key text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, key)
);

alter table coaching.contenido_checklist enable row level security;

create policy owner_id_policy on coaching.contenido_checklist
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

insert into coaching.contenido_checklist (owner_id, key, checked)
select u.id, k.key, k.checked
from auth.users u, (
  values
    ('diag-bio', true),
    ('diag-destacados', false),
    ('diag-feed', false),
    ('perfil-bio', true),
    ('perfil-seguidos', false),
    ('perfil-pin', false),
    ('perfil-titulacion', false)
) as k(key, checked)
limit 7;

-- =========================================================
-- NEGOCIO — coaching.roadmap_items necesita fase/track (estructura fija de
-- hoja-de-ruta-asesoria.html) + tipo, y una tabla de subtareas nueva, ya que
-- el estado real de cada tarjeta se deriva de sus subtareas.
-- =========================================================

alter table coaching.roadmap_items
  add column fase_id text,
  add column tipo text;

alter table coaching.roadmap_items
  add constraint roadmap_items_fase_check check (
    fase_id in ('e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'o1')
  ),
  add constraint roadmap_items_tipo_check check (tipo in ('existe', 'optimizar', 'crear')),
  add constraint roadmap_items_estado_check check (estado in ('pendiente', 'curso', 'hecho'));

create table coaching.roadmap_subtasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users,
  item_id uuid not null references coaching.roadmap_items on delete cascade,
  texto text not null,
  hecha boolean not null default false,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coaching.roadmap_subtasks enable row level security;

create policy owner_id_policy on coaching.roadmap_subtasks
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------
-- Seed: las ~43 tarjetas reales de hoja-de-ruta-asesoria.html + subtareas.
-- NOTA: igual que 03_seed.sql, ejecutar DESPUÉS del primer login (necesita
-- una fila en auth.users para el owner_id).
-- ---------------------------------------------------------

do $$
declare
  owner uuid;
  v_item uuid;
begin
  select id into owner from auth.users limit 1;
  if owner is null then
    raise exception 'No hay ningún usuario en auth.users — inicia sesión antes de correr este seed.';
  end if;

  -- E1 · ATRACCIÓN Y CAPTACIÓN
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'existe', 'Perfil IG/TikTok · bio · highlights · «Empieza aquí»', 'Auditado y optimizado.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'existe', 'Perfil Adil — ancla de contenido + 7 stories', 'Caso de éxito estructurado.', 'hecho');

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'optimizar', 'Link in bio (alexmaza.es)', 'Pendiente CSS: unificar acento a #C9A96E.', 'curso')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Sustituir #CBB089 por #C9A96E en CSS', 0),
    (owner, v_item, 'Revisar contraste en botones', 1);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'existe', 'Formulario de aplicación · Typeform (12 preguntas)', 'Orden de compromiso psicológico.', 'hecho');

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'crear', 'Sistema de contenido sostenible', 'Prioridad 1 — ataca el cuello de botella. Output semanal fijo.', 'pendiente')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Definir 4 pilares de contenido', 0),
    (owner, v_item, 'Calendario editorial semanal (3-4 piezas)', 1),
    (owner, v_item, 'Banco de ideas / heurísticas', 2);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'crear', 'Protocolo de setting escrito', 'Guion + disparadores. Hoy es informal.', 'pendiente')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Listar disparadores (story vista, reel guardado, etc.)', 0),
    (owner, v_item, 'Escribir guion de apertura fijo', 1);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e1', 'crear', 'Lead magnet de captación pasiva', 'Guía/checklist que alimenta el formulario 24/7.', 'pendiente');

  -- E2 · LLAMADA DE VENTA
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'existe', 'Audio pre-llamada (WhatsApp)', 'Voz y estructura fijas; reduce no-shows.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'existe', 'Estructura de venta · 9 fases + objeciones', 'Replicable por cualquiera.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'existe', 'Presentación interactiva de la llamada', 'Profesionalidad + autoridad.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'existe', 'Automatización Make · Typeform→API→Gmail/Drive', 'JSON compacto para evitar timeouts.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'crear', 'Playbook de venta entregable', 'Documentar para poder delegar el cierre.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e2', 'crear', 'Seguimiento post-llamada (los «no ahora»)', 'Nutrición de leads tibios, hoy perdidos.', 'pendiente');

  -- E3 · ONBOARDING
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'existe', 'Cuestionario inicial interactivo', 'Netlify + Worker + Resend + backup Formspree.', 'hecho');

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'optimizar', 'PDF Condiciones + Protección de Datos', 'Diseñado; pendiente de optimización.', 'curso');

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'optimizar', 'Chatbot FAQ «Alex 24/7»', 'Desplegado; integrar Sheet de alimentos.', 'curso')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Conectar Google Sheet de alimentos', 0),
    (owner, v_item, 'Probar cálculo de equivalencias calóricas', 1);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'crear', 'Calendario/timing de onboarding (D0 → mes 1)', 'Definido; falta implementarlo.', 'pendiente')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Día 0 — Welcome + condiciones', 0),
    (owner, v_item, 'Día 3 — contacto de control', 1),
    (owner, v_item, 'Semana 1 — seguimiento preventivo', 2),
    (owner, v_item, 'Fin mes 1 — recap', 3);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'crear', 'Mensajería automatizada (welcome · D3 · S1)', 'Hoy es manual.', 'pendiente');

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'crear', 'Vídeos explicativos (MESO/NUTRI/SEGUIMIENTO + entrenar)', 'Mayor ROI de la etapa y requisito para delegar.', 'pendiente')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Vídeo: cómo usar hoja MESO', 0),
    (owner, v_item, 'Vídeo: cómo usar hoja NUTRI', 1),
    (owner, v_item, 'Vídeo: cómo usar SEGUIMIENTO', 2),
    (owner, v_item, 'Vídeo: cómo entrenar correctamente', 3);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e3', 'crear', 'Checklist «cliente onboardeado»', 'Trigger formal hacia la Etapa 4.', 'pendiente');

  -- E4 · EJECUCIÓN Y GESTIÓN DEL PROGRAMA
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'existe', 'Hoja MESO (entrenamiento)', 'Formato condicional rendimiento/volumen/grupos.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'existe', 'Hoja NUTRI + macro-escalado (TDEE)', 'Apps Script + base de datos de alimentos.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'existe', 'Hoja SEGUIMIENTO (progreso)', 'Ritmo de peso, adherencia.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'existe', 'NutriPlan (React)', 'Recurso de adherencia para el cliente.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'crear', 'Protocolo de revisión semanal/quincenal', 'Cadencia fija de check-in, no reactiva.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'crear', 'Protocolo de soporte y dudas', 'Qué se responde, cuándo y cómo (sin invadir tu tiempo).', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'crear', 'Sistema de checkpoints de progreso', 'Hitos claros para saber si el cliente avanza.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e4', 'crear', 'Protocolo de pivote', 'Qué hacer cuando algo no funciona — reglas, no improvisación.', 'pendiente');

  -- E5 · ANÁLISIS Y OPTIMIZACIÓN
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e5', 'crear', 'Post-mortem de cliente', 'Qué funcionó y qué no, al cierre de cada programa.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e5', 'crear', 'Panel de métricas de negocio', 'Churn, LTV, tiempo a resultado — visión agregada.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e5', 'crear', 'Sistema de detección de cuellos de botella', 'Dónde se atascan los clientes y por qué.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e5', 'crear', 'Ciclo de mejora del proceso', 'Iterar MESO/NUTRI/onboarding sobre datos, no intuición.', 'pendiente');

  -- E6 · FIDELIZACIÓN Y RETENCIÓN
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e6', 'optimizar', 'Revisiones longitudinales', 'Falta una cadencia fija (p. ej. quincenal).', 'curso');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e6', 'existe', 'Recursos / plantillas compartidos', 'Estandarizan calidad al escalar.', 'hecho');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e6', 'crear', 'Sistema de testimonios en hitos', 'Convierte clientes en captación — cierra el ciclo.', 'pendiente');

  -- E7 · EXPANSIÓN DE PRODUCTO
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e7', 'crear', 'Programa grupal', 'Mayor margen, menos tiempo por cliente.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e7', 'crear', 'Membresía / comunidad', 'Retención de clientes que aún no están listos para 1:1.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e7', 'crear', 'Productos digitales', 'NutriPlan como app de pago, guías, bootcamps.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'e7', 'crear', 'Sistema de tiers', 'Básico / Premium / VIP — distintos niveles de acceso a ti.', 'pendiente');

  -- O1 · OPERACIONES Y SISTEMAS
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'o1', 'crear', 'Documentación de procesos (playbooks)', 'Cada protocolo del ciclo, escrito y versionado.', 'pendiente')
    returning id into v_item;
  insert into coaching.roadmap_subtasks (owner_id, item_id, texto, orden) values
    (owner, v_item, 'Playbook de venta', 0),
    (owner, v_item, 'Playbook de onboarding', 1),
    (owner, v_item, 'Playbook de entrega MESO/NUTRI', 2);

  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'o1', 'crear', 'Gestión y auditoría de datos de cliente', 'Dónde se guardan, quién accede, cómo se protegen.', 'pendiente');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'o1', 'optimizar', 'Infraestructura y APIs centralizadas', 'Netlify, Cloudflare, Make, Resend, Anthropic — hoy dispersos.', 'curso');
  insert into coaching.roadmap_items (owner_id, fase_id, tipo, titulo, descripcion, estado)
    values (owner, 'o1', 'crear', 'Training de ejecutores', 'Preparar el sistema para delegar sin perder calidad.', 'pendiente');

end $$;
