# Arquitectura · Simbionte

## Stack

| Capa | Tecnología | Detalle |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | `app/` directory, Server Components por defecto |
| Base de datos | Supabase (Postgres 17 + Auth + RLS) | Dos esquemas: `personal.*` y `coaching.*` |
| Auth | Magic-link via Supabase | Sesión en cookies, nunca en localStorage |
| CSS | Tailwind CSS v4 | Tokens en `app/globals.css` via `@theme inline` |
| IA | `@anthropic-ai/sdk` | Solo desde rutas API Next.js — nunca desde el cliente |
| Deploy | Vercel | Dominio `simbionte.alexmaza.es` |
| PWA | `manifest.json` + service worker | Instalable en móvil y escritorio |

---

## Mapa de rutas completo (estado real)

```
app/
├── (auth)/login/             ← Magic-link login
├── layout.tsx                ← Shell: Sidebar + AuthProvider + fuentes
├── page.tsx                  ← Portada "Hoy" (cruza personal + coaching)
│
├── personal/
│   ├── cerebro/
│   │   ├── page.tsx          ← Índice del Cerebro
│   │   ├── tareas/           ← Tareas con recurrencia + fronts
│   │   ├── ideas/            ← Ideas con fronts
│   │   ├── recordatorios/    ← Recordatorios con fecha
│   │   ├── norte/            ← "El Norte" — objetivo MRR único
│   │   ├── calendario/       ← 4 vistas: Día, Semana, Mes, Año
│   │   ├── knowledge/        ← Knowledge base con IA + chat
│   │   ├── infra/            ← Inventario de infraestructura
│   │   └── revision/         ← Revisión semanal
│   └── finanzas/
│       ├── page.tsx          ← Dashboard finanzas
│       ├── transacciones/
│       ├── inversiones/
│       ├── crypto/
│       ├── deudas/
│       └── ahorro/
│
├── coaching/
│   ├── dashboard/            ← Dashboard coaching
│   ├── clientes/
│   │   └── tarifas/          ← Gestión de tarifas
│   ├── leads/                ← Pipeline de captación
│   ├── ventas/               ← Guía closer 9 fases
│   ├── contenido/            ← Auditoría IG + calendario
│   ├── negocio/              ← Hoja de ruta
│   ├── mesociclos/           ← Vista global de mesociclos
│   ├── pagos/                ← Vista global de pagos
│   └── revisiones/           ← Vista global de revisiones
│
└── api/
    ├── ajustes/export/       ← GET: backup JSON de todos los datos
    └── knowledge/
        ├── procesar/         ← POST: Claude procesa nota bruta → JSON estructurado
        └── chat/             ← POST: Chat con las notas del usuario como contexto
```

---

## Estructura de carpetas

```
simbionte/
├── app/                      ← Rutas Next.js App Router
├── components/
│   ├── ui/                   ← Design system compartido (Modal, Drawer, Chip, Pill, SearchInput…)
│   └── shared/               ← Componentes por dominio
│       ├── Sidebar.tsx       ← Navegación principal
│       ├── cerebro/          ← Componentes del Cerebro (incluye knowledge/)
│       ├── clientes/         ← Componentes de Clientes
│       └── …
├── lib/
│   ├── supabase/             ← client.ts, server.ts, auth.ts, middleware.ts
│   ├── personal/             ← *-queries.ts, *-actions.ts, *.ts (tipos/helpers) por módulo
│   └── coaching/             ← ídem para coaching
├── styles/                   ← (vacío, tokens en app/globals.css)
├── supabase/                 ← Migraciones SQL numeradas
│   ├── 01_schema.sql … 10_tarifas_recurrencia.sql
└── docs/
    ├── arquitectura-simbionte.md   ← Doc original de planificación (referencia histórica)
    └── memory/               ← Fuente de verdad modular (este directorio)
```

---

## Patrones de componente

### Patrón estándar de página
```
app/.../page.tsx                 ← Server Component async
  → obtiene datos con lib/*/queries.ts
  → devuelve <XPageClient .../>

components/shared/.../XPageClient.tsx   ← "use client"
  → useState, useTransition
  → llama a Server Actions de lib/*/actions.ts
  → renderiza UI con componentes de components/ui/
```

### Server Actions
Todos los archivos `lib/*/knowledge-actions.ts` llevan `"use server"` al inicio. Nunca se llaman directamente desde `fetch` — solo se importan en Client Components.

### Rutas API para IA
`app/api/knowledge/procesar/route.ts` y `app/api/knowledge/chat/route.ts` usan `@anthropic-ai/sdk`. Las llaman los Client Components vía `fetch`. El `ANTHROPIC_API_KEY` está solo en el servidor (variable de entorno Vercel).

### Sidebar
`components/shared/Sidebar.tsx` — 3 secciones:
- **MI DÍA**: acceso rápido a portada Hoy
- **PERSONAL**: grupo Cerebro (colapsable) + Finanzas
- **BUSINESS**: grupo con 3 etiquetas fijas (CAPTACIÓN, ONBOARDING, OPERATIVA)
