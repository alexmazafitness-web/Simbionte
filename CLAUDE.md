# Proyecto: Simbionte

Sistema operativo personal de Alex Maza. Next.js + Supabase, dos esquemas separados: `personal` (vida) y `coaching` (negocio de fitness). PWA instalable.

## Documentación modular → `docs/memory/`

| Archivo | Contenido |
|---|---|
| [01_arquitectura.md](docs/memory/01_arquitectura.md) | Stack, mapa de rutas completo, estructura de carpetas, patrones de componente |
| [02_base_datos.md](docs/memory/02_base_datos.md) | Esquema real de todas las tablas (personal + coaching), registro de migraciones, project ID Supabase |
| [03_identidad_visual.md](docs/memory/03_identidad_visual.md) | Variables CSS exactas, clases Tailwind, tipografías, patrones de UI recurrentes |
| [04_reglas_desarrollo.md](docs/memory/04_reglas_desarrollo.md) | Reglas absolutas, patrones de código (Server Actions, queries, rutas API con IA), convenciones |
| [05_historial_decisiones.md](docs/memory/05_historial_decisiones.md) | Qué se construyó en cada fase, decisiones clave, bugs relevantes resueltos |

> `docs/arquitectura-simbionte.md` mantiene el plan original de fases — útil para contexto histórico, pero `docs/memory/` es la fuente de verdad del estado real.

---

## Reglas críticas (siempre en mente)

- **Sin localStorage** — todo estado persistente va a Supabase.
- **IA solo desde servidor** — `ANTHROPIC_API_KEY` en variables de entorno Vercel. Rutas API en `app/api/`. Nunca el SDK en el cliente.
- **`owner_id` en todo INSERT** + RLS activado en cada tabla. Usar `requireUserId(supabase)` de `lib/supabase/auth.ts`.
- **Dos esquemas, nunca mezclar** — `personal.*` y `coaching.*`. Cruces solo por funciones "puente" explícitas.
- **Confirmar antes de crear módulo nuevo** — definir esquema, tablas y rutas antes de escribir código.
- **Migraciones solo hacia adelante** — nunca editar ficheros SQL existentes; añadir uno nuevo numerado.
