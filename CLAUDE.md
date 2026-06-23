# Proyecto: Simbionte

Sistema operativo personal de Alex Maza. Next.js + Supabase, un único proyecto con dos mundos de datos separados: `personal` (vida) y `coaching` (negocio de fitness). PWA instalable en móvil/escritorio.

## Stack
- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + RLS) — auth por magic-link, un solo usuario por ahora
- Tailwind CSS
- IA: rutas API propias en `app/api/ai/`, llamando a la API de Claude con la key como variable de entorno (`ANTHROPIC_API_KEY`). Nunca expuesta al cliente.
- Deploy: Vercel, dominio `simbionte.alexmaza.es`
- PWA: `manifest.json` + service worker desde el inicio

## Arquitectura de datos — regla no negociable
- Dos esquemas Postgres: `personal.*` y `coaching.*`. Nunca mezclar tablas de un mundo en el otro.
- TODA tabla lleva `owner_id uuid references auth.users` + RLS (`owner_id = auth.uid()`), aunque hoy solo exista un usuario.
- `lib/personal/` y `lib/coaching/` separan las queries de cada mundo. Si un módulo necesita datos del otro, se hace por una función "puente" explícita.

## Estructura de carpetas
app/(auth)/login/        app/personal/cerebro/   app/personal/finanzas/
app/page.tsx (portada Hoy)   app/coaching/{clientes,leads,ventas,contenido,negocio}/
lib/supabase/  lib/personal/  lib/coaching/
components/ui/  components/shared/
styles/tokens.css
supabase/{01_schema,02_rls,03_seed}.sql

## Identidad visual (MARCA brand — aplicar siempre)
- Fondo `#141414`, dorado `#C9A96E` transversal a todas las paletas.
- Paletas por área: MESO (`#243B55` azul), NUTRI (`#2A4A38` verde), SEGUIMIENTO (`#1A1A1A` negro + `#EDE6D6` beige), ADMIN (`#2A2A2A` grafito + `#F5F2EC` papel).
- Tipografía: Bebas Neue (números grandes/KPI), Schibsted Grotesk (encabezados), DM Sans (cuerpo).
- Toda pantalla oscura lleva `color-scheme: dark` explícito en `:root`/`html`/`body` + `<meta name="color-scheme" content="dark">`.
- Estilo general: minimalista, ledger/extracto bancario.

## Convenciones
- Componentes UI compartidos en `components/ui/`.
- Toda mutación de datos pasa por Supabase client (`lib/supabase/`).

## Qué NO hacer
- No usar localStorage para nada persistente — todo va a Supabase.
- No crear endpoints de IA que acepten la key del cliente.
- No empezar un módulo nuevo sin decidir primero si sus tablas van en `personal` o `coaching`.
