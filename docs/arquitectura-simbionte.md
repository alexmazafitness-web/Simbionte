> **Nota (2026-06-27):** Este documento es el plan original de fases y sigue siendo válido como referencia histórica. La fuente de verdad del estado actual del sistema (esquema real de tablas, rutas, tokens visuales, reglas, historial de decisiones) está en **`docs/memory/`**. Consultar ese directorio primero.

---

# SIMBIONTE · Arquitectura del sistema unificado

> Sistema operativo personal de Alex Maza. Un solo proyecto, un solo login, una sola base de datos — con módulos separados por área de vida (Personal / Coaching), y preparado para extraer Control Clientes como producto vendible en el futuro sin cirugía mayor.

---

## 1. Principio rector

**Un cerebro, órganos separados.** Todo vive en el mismo Next.js + Supabase, pero los datos se separan en dos esquemas Postgres (`personal` y `coaching`) desde el día 1. Hoy eso es solo orden; mañana es la "línea de puntos" por la que se corta Control Clientes para venderlo.

Tres reglas que no se rompen:
1. **`owner_id` (= `auth.uid()`) en CADA tabla**, con RLS activado. Hoy siempre eres tú. El día que vendas, cada coach ve solo lo suyo, cero refactor.
2. **Esquemas separados** (`personal.*` vs `coaching.*`). Nada de mezclar tu diario con datos de clientes en la misma tabla.
3. **Capa de UI compartida** (auth, layout, navegación, design tokens) pero **lógica de cada módulo aislada** en su carpeta. Un módulo no importa de otro directamente; si necesitan hablar, lo hacen por un "puente" explícito (ver §6).

---

## 2. Inventario real (lo que ya existe, auditado del código subido)

| Herramienta actual | Área | Persiste hoy | Destino en Simbionte |
|---|---|---|---|
| Segundo Cerebro (`brain:*`) | Personal | localStorage | Módulo **Cerebro** |
| Finanzas (`fin_*`) | Personal | localStorage | Módulo **Finanzas** |
| Control Clientes | Coaching | storage artifact | Módulo **Clientes** |
| Closer / Script 9 fases | Coaching | no (estático) | Módulo **Ventas** (guía + tracking) |
| Hoja de Ruta (6 módulos) | Coaching | mínimo | Módulo **Negocio** (roadmap) |
| Auditoría IG | Coaching | mínimo | Módulo **Contenido** |
| Feedback clientes | Coaching | no | Se queda como form público externo |
| Landing (index) | Público | no | Fuera del simbionte (web pública aparte) |

---

## 3. Mapa de navegación

```
SIMBIONTE
│
├── 🏠 Hoy            ← portada: agenda del día + acciones de coaching + finanzas flash
│
├── PERSONAL
│   ├── 🧠 Cerebro     Tareas · Ideas · Recordatorios · El Norte · Calendario · Knowledge · Infra
│   └── 💰 Finanzas    Transacciones · Inversión · Crypto · Deuda · Objetivo ahorro
│
├── COACHING
│   ├── 👥 Clientes    (todo Control Clientes: clientes, mesociclos, pagos, notas, bajas)
│   ├── 🎯 Leads       Pipeline de captación → conversión a cliente
│   ├── 📞 Ventas      Guía closer 9 fases + registro de llamadas por lead
│   ├── 📱 Contenido   Auditoría IG · planificación · sistema de captación
│   └── 🗺️ Negocio     Hoja de ruta · métricas de negocio · objetivo independencia
│
└── ⚙️ Ajustes        Perfil · tarifas · paletas · export/backup · API keys
```

La portada **Hoy** es la única pantalla que cruza áreas: te muestra de un vistazo lo de hoy de cada mundo (tareas personales + acciones de clientes + un flash financiero), pero sin mezclar los datos por debajo — solo los agrega para mostrarlos.

---

## 4. Esquema de base de datos (Supabase / Postgres)

> Dos esquemas. `owner_id uuid references auth.users` + RLS (`owner_id = auth.uid()`) en TODAS las tablas. Se omite repetir `owner_id`, `created_at`, `updated_at` en cada línea por brevedad — van en todas.

### Esquema `personal`

```sql
-- CEREBRO ------------------------------------------------------
personal.tasks            (id, title, front, date, day, recur, pri bool, done bool, done_dates jsonb)
  -- front: coaching|formacion|personal|contenido  (los "frentes" actuales)
  -- day: día de la semana para recurrentes; recur: regla de recurrencia
personal.ideas            (id, text, front, archived bool)
personal.reminders        (id, text, date, time, done bool)
personal.goal             (id, label, cur numeric, tgt numeric, price numeric, hist jsonb) -- "El Norte"
personal.meta             (id, palanca text, review jsonb, notif bool)  -- principio maestro / revisión semanal
personal.content          (id, title, status, front, notes)  -- pipeline de contenido personal
personal.events           (id, title, date, start_min, end_min, color, front)  -- calendario
personal.marked_dates     (id, date, kind)  -- días marcados
personal.kn_categories    (id, name, color)
personal.kn_notes         (id, cat_id, title, body, ts)        -- Knowledge: notas
personal.kn_principles    (id, title, body)                    -- Knowledge: principios
personal.kn_systems       (id, title, body)                    -- Knowledge: sistemas
personal.infra            (id, bucket, name, descr, platform, url, note)
  -- bucket: marca|servicio|personal  (tu inventario de infraestructura)

-- FINANZAS -----------------------------------------------------
personal.fin_transactions (id, fecha date, concepto, categoria, tipo, importe numeric)
  -- tipo: ingreso|gasto
personal.fin_investments  (id, nombre, tipo, valor_actual numeric, invertido numeric)
personal.fin_crypto       (id, activo, cantidad numeric, precio_compra numeric)
personal.fin_debts        (id, nombre, total numeric, pendiente numeric, cuota numeric)
personal.fin_savings_goal (id, label, objetivo numeric, actual numeric)
```

### Esquema `coaching`

```sql
-- CLIENTES (núcleo, de Control Clientes) -----------------------
coaching.grupos_revision  (id, codigo, dia)   -- S1/S2/D1/D2
coaching.clientes         (id, nombre, ini, alta date, baja date, estado,
                           grupo_id, cuota numeric, recurrencia, fase bool,
                           ltv numeric, baja_motivo)
  -- estado: activo|baja|eliminado
coaching.suscripciones    (id, cliente_id, cuota numeric, recurrencia,
                           precio_mensual numeric GENERATED, fecha_pago date, activa bool)
coaching.revisiones       (id, cliente_id, fecha_realizada date, fecha_proxima date, estado)
coaching.mesociclos       (id, cliente_id, fecha_inicio date, n_micros int,
                           dias_micro int, fecha_fin date GENERATED, estado)
coaching.notas_cliente    (id, cliente_id, categoria, texto, ts)
  -- categoria: meso|nutricion|seguimiento|otros

-- LEADS / CAPTACIÓN --------------------------------------------
coaching.leads            (id, nombre, contacto, fuente, nota, etapa, fecha_creado date)
  -- etapa: nuevo|audio|llamada_agendada|llamada_hecha|cliente|descartado
coaching.llamadas         (id, lead_id, fecha date, fase_alcanzada, resultado, notas)
  -- registro de cada llamada de venta (alimenta el módulo Ventas)

-- CONTENIDO / NEGOCIO ------------------------------------------
coaching.contenido_ig     (id, fecha date, tipo, gancho, estado, metricas jsonb)
coaching.roadmap_items    (id, modulo, titulo, descripcion, estado, prioridad int)
  -- modulo: captacion|venta|onboarding|ejecucion|analisis|fidelizacion
coaching.tarifas          (id, valor numeric, activa bool)

-- VENTAS (guía closer) -----------------------------------------
-- Las 9 fases del script son CONTENIDO ESTÁTICO (van en código, no en BD).
-- Solo se persiste el registro de llamadas (coaching.llamadas, arriba).
```

### Tablas compartidas (esquema `public`)

```sql
public.profiles           (id = auth.uid(), nombre, email, objetivo_mrr numeric default 2000)
public.settings           (owner_id, key, value jsonb)  -- paletas, API keys, preferencias
public.ai_log             (owner_id, modulo, prompt, ts)  -- opcional: histórico de usos de IA
```

---

## 5. Estructura de carpetas (Next.js App Router)

```
simbionte/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── layout.tsx              ← shell: sidebar + auth guard
│   ├── page.tsx               ← portada "Hoy"
│   ├── personal/
│   │   ├── cerebro/…          ← tareas, knowledge, calendario, etc.
│   │   └── finanzas/…
│   └── coaching/
│       ├── clientes/…
│       ├── leads/…
│       ├── ventas/…
│       ├── contenido/…
│       └── negocio/…
├── lib/
│   ├── supabase/             ← cliente + helpers de auth
│   ├── personal/             ← queries del esquema personal
│   └── coaching/             ← queries del esquema coaching (la "línea de puntos")
├── components/
│   ├── ui/                   ← design system: botones, cards, modales, paletas
│   └── shared/               ← sidebar, topbar, layout
├── styles/
│   └── tokens.css            ← las 5 paletas (MESO/NUTRI/SEGUIMIENTO/ADMIN/MARCA)
└── supabase/
    ├── 01_schema.sql
    ├── 02_rls.sql
    └── 03_seed.sql
```

**Clave para la venta futura:** todo `coaching` vive bajo `app/coaching/`, `lib/coaching/` y el esquema `coaching.*`. El día que quieras extraerlo, copias esas tres ramas a un proyecto nuevo y ya tienes el 90% de Control Clientes como producto independiente.

---

## 6. Sinergia entre módulos (los "puentes")

Lo que hace que esto sea un simbionte y no 6 apps en pestañas:

- **Cerebro ⇄ Clientes**: una nota de seguimiento de un cliente puede generar una tarea en el Cerebro ("revisar dieta de Adil el jueves"). Puente: botón "crear tarea" en la nota → inserta en `personal.tasks` con `front:'coaching'`.
- **Leads → Ventas → Clientes**: un lead que avanza a "llamada agendada" puede crear un evento en el calendario del Cerebro. Al cerrarse como cliente, su historial de llamadas queda enlazado.
- **Clientes → Finanzas**: el MRR de coaching alimenta el "ingreso recurrente" del módulo Finanzas personal (los cobros de clientes SON tus ingresos).
- **Todo → Hoy**: la portada lee de los tres mundos y te arma la agenda del día.

Estos puentes se construyen **explícitamente** (una función que cruza esquemas), nunca por acoplamiento directo. Así siguen siendo opcionales y desconectables.

---

## 7. Plan de ejecución por fases (para Claude Code)

**Fase 0 — Cimientos + PWA** (1 sesión)
Crear proyecto Supabase + Next.js. Ejecutar `01_schema.sql` + `02_rls.sql` + `03_seed.sql` (mínimo: grupos S1/S2/D1/D2 + tarifas por defecto). Montar auth magic-link (un solo usuario: tú). **Configurar PWA**: `manifest.json`, service worker, iconos, `theme-color #141414`. Shell con sidebar y navegación vacía. Deploy en Vercel + dominio `simbionte.alexmaza.es`. Al acabar, ya puedes instalarla en móvil/escritorio.

**Fase 1 — Control Clientes** (1-2 sesiones)
Es lo más maduro y ya está diseñado. Portar el cockpit actual a `app/coaching/clientes/` leyendo de Supabase en vez de storage. Incluye leads. **Arranca vacío** — das de alta tus 12 clientes desde la UI con el flujo "+ Nuevo cliente" que ya existe.

**Fase 2 — Cerebro** (2 sesiones)
La pieza personal más rica (tareas con recurrencia, knowledge, calendario, El Norte). Construir en `app/personal/cerebro/`, arrancando limpio. Incluye la integración de IA (Q&A de Knowledge) vía `app/api/ai/`.

**Fase 3 — Finanzas** (1 sesión)
Transacciones, inversión, crypto, deuda, objetivo. En `app/personal/finanzas/`, desde cero.

**Fase 4 — Ventas + Contenido + Negocio** (1-2 sesiones)
Closer como guía + registro de llamadas. Auditoría IG. Hoja de ruta.

**Fase 5 — Portada "Hoy" + puentes** (1 sesión)
La pantalla que une todo y los puentes de sinergia del §6. Esta fase es la que convierte el conjunto en un simbionte de verdad.

**Fase 6 — Pulido + backup** (continuo)
Export/import de datos, refinamiento visual con tus paletas, PWA para móvil.

---

## 8. Decisiones cerradas (✓ resueltas)

1. **Dominio** → `simbionte.alexmaza.es` (subdominio dedicado, separado de la web pública).
2. **Acceso** → **PWA instalable** (móvil y escritorio): icono propio, pantalla completa, sin barra de navegador. Login por **magic-link** (sin contraseña) — la sesión queda recordada en el dispositivo, así que tras instalarla entras directo como una app nativa. `manifest.json` + service worker desde Fase 0.
3. **IA** → **integrada en Next.js** (rutas API propias, `app/api/ai/`). Se elimina el Cloudflare Worker. La API key de Claude vive como variable de entorno en Vercel, nunca en el cliente.
4. **Datos** → **todo empieza de cero**. No hay datos reales que migrar. El `03_seed.sql` queda mínimo (solo estructura base: grupos de revisión S1/S2/D1/D2, tarifas por defecto). Los 12 clientes y el resto se cargan a mano desde la propia app una vez funcione.

### Implicaciones de estas decisiones en el plan

- **Fase 0** ahora incluye montar la PWA (manifest + service worker + iconos) y el magic-link, no solo el shell.
- **Fase 1** ya no necesita `seed` de clientes — Control Clientes arranca vacío y das de alta tus 12 desde la UI (que ya tiene el flujo "+ Nuevo cliente").
- **No hay fase de migración de localStorage** — se elimina ese trabajo por completo. Cada módulo nace limpio.
- **La integración de IA** pasa a ser parte de cada módulo que la use (Cerebro: Q&A de Knowledge), construida con rutas API de Next desde el principio.

---

*Este documento es el mapa. El territorio se construye en Claude Code, fase por fase.*
