# Historial de decisiones · Simbionte

Resumen fase a fase de qué se construyó, decisiones clave y bugs resueltos.

---

## Fase 0 — Cimientos + PWA

**Qué se construyó:**
- Proyecto Supabase + Next.js App Router
- Esquemas `personal.*` y `coaching.*` con todas las tablas base (`01_schema.sql`)
- RLS activado en todas las tablas (`02_rls.sql`)
- Seed mínimo: grupos de revisión S1/S2/D1/D2 + tarifas por defecto (`03_seed.sql`)
- Auth por magic-link (Supabase), un solo usuario
- Shell con Sidebar y navegación
- Deploy en Vercel (`simbionte.alexmaza.es`)
- PWA: `manifest.json` + service worker + iconos + `theme-color #141414`

**Decisiones clave:**
- Dominio `simbionte.alexmaza.es` (subdominio separado de la web pública)
- Single user por ahora, pero la arquitectura `owner_id + RLS` escala a multi-tenant sin refactor
- **No hay migración de localStorage** — todo nace limpio, se carga desde la UI

---

## Fase 1 — Control Clientes

**Qué se construyó:**
- Módulo completo `app/coaching/clientes/` con tabla de clientes, suscripciones, mesociclos, revisiones y notas
- Leads pipeline en `app/coaching/leads/`
- Gestión de tarifas en `app/coaching/clientes/tarifas/`
- Migración `04_clientes_schema.sql`: ALTER en `clientes` (ltv_acumulado, fase_completada, baja_fecha), `suscripciones` (precio, recurrencia, proximo_pago), `mesociclos` (numero_microciclos, dias_microciclo, estado), `notas_cliente` (categoria), `leads` (nota)
- Migración `05_grants.sql`: permisos PostgREST en `coaching.*`
- 15 clientes reales insertados en la BD via Supabase MCP
- Migración `10_tarifas_recurrencia.sql`: añade `recurrencia` a `coaching.tarifas` y combina importe + periodicidad en un único selector en la UI

**Decisiones clave:**
- **Formato de nombres de clientes**: "Apellidos, Nombre" en Title Case (ej: "Allende Nicosia, Juan Pablo"). Esto facilita ordenación por apellido.
- **proximo_pago** vive en `coaching.suscripciones`, no en una tabla separada `coaching.pagos`
- Sort toggle en tabla de clientes: Antigüedad (por `fecha_inicio` asc, default) / Alfabético (por apellido)

---

## Fase 2 — Cerebro

**Qué se construyó:**
- Todos los módulos bajo `app/personal/cerebro/`:
  - `tareas/` — tareas con recurrencia (`recur` jsonb), fronts (coaching/formacion/personal/contenido), prioridad, done_dates
  - `ideas/` — ideas con fronts y estado
  - `recordatorios/` — con fecha, hora y estado done
  - `norte/` — "El Norte" singleton: MRR actual, objetivo MRR, precio por cliente; histórico en `goal_history`
  - `calendario/` — eventos recurrentes (start_min/end_min) + fechas marcadas
  - `knowledge/` — base de conocimiento (versión inicial simple)
  - `infra/` — inventario de infraestructura por bucket (marca/servicio/personal)
  - `revision/` — revisión semanal
- Migración `06_cerebro_schema.sql`: ALTER extenso en tasks, ideas, reminders, goal (+ goal_history), events, marked_dates, kn_*, infra
- Migración `07_personal_grants.sql`: permisos PostgREST en `personal.*`

---

## Fase 3 — Finanzas

**Qué se construyó:**
- Módulo completo `app/personal/finanzas/` con subroutes:
  - `transacciones/` — ingresos y gastos con categorías
  - `inversiones/` — ETFs/acciones con purchase_price, current_price, quantity
  - `crypto/` — con cantidad, precio compra y precio actual
  - `deudas/` — con tipo, pendiente y cuota mensual
  - `ahorro/` — objetivo de ahorro con emoji
- Migración `08_finanzas_schema.sql`: ALTER en fin_investments (purchase/current price), fin_crypto (name, current_price), fin_debts (type, pending_amount, monthly_payment), fin_savings_goal (emoji)

---

## Fase 4 — Ventas + Contenido + Negocio

**Qué se construyó:**
- `app/coaching/ventas/` — guía closer 9 fases + registro de llamadas
- `app/coaching/contenido/` — auditoría IG + calendario de piezas
- `app/coaching/negocio/` — hoja de ruta con 43 tarjetas reales
- Migración `09_ventas_contenido_negocio_schema.sql`: ALTER en llamadas (fase_alcanzada), contenido_ig (tipo/estado checks), roadmap_items (fase_id, tipo); CREATE contenido_checklist, roadmap_subtasks; seed completo de 43 roadmap items + subtareas

---

## Fase 5 — Portada "Hoy" + puentes

**Qué se construyó:**
- `app/page.tsx` — portada Hoy que agrega datos de personal + coaching
- **Puente MRR → Finanzas**: el MRR calculado desde `coaching.clientes` se muestra en el dashboard financiero
- **Puente Cerebro ↔ Clientes**: desde notas de cliente se puede crear una tarea en `personal.tasks` (con `front:'coaching'`) via Server Action compartida
- **Puente Leads → Calendario**: un lead que avanza a "llamada agendada" puede crear un evento en el calendario

**Decisiones clave:**
- Los puentes son funciones explícitas que cruzan esquemas, no acoplamiento directo
- La portada lee de los dos mundos pero no mezcla las tablas

---

## Fase 6 — Pulido + Sidebar + Export

**Qué se construyó:**
- **Reorganización completa de Sidebar**: 3 secciones fijas:
  - MI DÍA (acceso rápido a portada)
  - PERSONAL (grupo Cerebro colapsable + Finanzas directo)
  - BUSINESS (grupo con 3 etiquetas: CAPTACIÓN, ONBOARDING, OPERATIVA)
- **Export de datos** (`/api/ajustes/export`) — backup JSON de toda la BD del usuario
- Modal de Ajustes con edición de nombre de perfil y botón de backup
- Sort toggle en tabla de clientes (Antigüedad/Alfabético)

---

## Knowledge avanzado — IA + Chat (2026-06-27)

**Qué se construyó:**
- Reescritura completa del módulo Knowledge con layout 3 columnas (categorías | notas | chat)
- Migración `knowledge_notes_ai_fields` (via MCP): añade `nota_bruta`, `fuente_tipo`, `fuente_nombre`, `puntos_clave` a `personal.kn_notes`
- Instalación de `@anthropic-ai/sdk`
- **`/api/knowledge/procesar`**: Claude recibe nota bruta + fuente + categorías disponibles → devuelve JSON estructurado (título, contenido, puntos clave, categoría sugerida). Modal multi-step: formulario → procesando → revisar/editar → guardar.
- **`/api/knowledge/chat`**: inyecta todas las notas del usuario en el system prompt. Claude SOLO responde con la base de conocimiento, cita la nota de origen, y si no tiene información dice "No tengo notas sobre esto en tu base de conocimiento."
- Cards de notas con badge de fuente, título, puntos clave visibles, búsqueda por texto
- Panel de categorías con rename inline (lápiz en hover) y eliminación

**Decisiones clave:**
- El chat inyecta las notas en el system prompt en cada petición (sin vector DB por ahora). Funciona bien con volúmenes pequeños-medianos de notas.
- El campo `source` (legacy) se mantiene para backward compat; los nuevos campos `fuente_tipo` + `fuente_nombre` son los canónicos.
- Los puntos clave se editan como texto plano (un punto por línea), no como una lista de inputs individuales.

---

## Bugs relevantes resueltos

### Calendar timezone bug (Vista Mes — navegación rota)
`toISO(d)` usaba `d.toISOString()` que devuelve UTC. En Spain (UTC+2 verano), `new Date("2026-06-01T00:00:00")` en UTC es `2026-05-31T22:00:00Z`, por lo que `toISO` devolvía `"2026-05-31"`. Al navegar hacia adelante desde ese cursor, `addMonths` calculaba el mismo mes → bucle infinito. **Fix**: helper `isoDate(y, m, d)` que usa `getFullYear()`/`getMonth()`/`getDate()` locales.

### Calendar day view — horas cortadas
`H_START=7, H_END=22, totalPx = (H_END-H_START)*HOUR_H` — solo mostraba 07:00-22:00 y la hora 22 quedaba cortada porque el div interior tenía exactamente la misma altura que el contenedor. **Fix**: `H_START=0`, `H_END=23`, `totalPx=(H_END-H_START+1)*HOUR_H`, scroll con `h-[calc(100vh-280px)] overflow-y-auto`, posición inicial en 07:00 con `useRef` + `useEffect`.
