# Reglas de desarrollo · Simbionte

## Reglas absolutas — no negociables

### 1. Sin localStorage
**Nada persistente va a localStorage.** Todo va a Supabase. No hay excepciones. El estado local de UI (modales abiertos, tabs activos) puede vivir en `useState`, pero nunca se persiste fuera de Supabase.

### 2. Sin IA desde el cliente
La API key de Anthropic (`ANTHROPIC_API_KEY`) vive en Vercel como variable de entorno de servidor. Toda llamada a Claude va por rutas API de Next.js (`app/api/.../route.ts`). Los Client Components llaman a esas rutas via `fetch`, nunca importan el SDK directamente.

### 3. `owner_id` en todo INSERT
Cada fila insertada en cualquier tabla lleva `owner_id` igual al `auth.uid()` del usuario autenticado. Se obtiene con `requireUserId(supabase)` desde `lib/supabase/auth.ts`. El RLS impide leer/escribir filas de otros — pero el `owner_id` correcto en el INSERT es la defensa en profundidad.

### 4. Dos esquemas, nunca mezclar
`personal.*` es la vida de Alex. `coaching.*` es el negocio. Las queries de un mundo no tocan tablas del otro directamente. Si un módulo necesita datos del otro, se hace por una función "puente" explícita (ejemplo: `crearTarea` llamada desde Clientes para insertar en `personal.tasks`).

### 5. Confirmar antes de crear un módulo nuevo
Antes de empezar a construir un módulo nuevo: definir en qué esquema van las tablas, qué rutas tendrá, y consultarlo con Alex. No empezar a escribir código sin ese consenso.

### 6. Migraciones solo hacia adelante
Nunca editar un fichero SQL de `supabase/` ya aplicado. Cada cambio de esquema añade un nuevo fichero numerado (`11_algo.sql`, `12_algo.sql`, …). Los cambios aplicados vía MCP (`apply_migration`) se documentan también en `docs/memory/02_base_datos.md`.

### 7. Secretos de servidor — nunca al cliente
`ANTHROPIC_API_KEY` y `CREDENTIALS_SECRET` (clave de cifrado de la bóveda de credenciales en Infra, ver `personal.credenciales`) viven solo como variables de entorno de servidor (Vercel + `.env.local`). Cualquier operación que las use pasa por una ruta API (`app/api/.../route.ts`) o Server Action — nunca se exponen a `NEXT_PUBLIC_*` ni se importan en Client Components. Si `CREDENTIALS_SECRET` cambia, todas las credenciales cifradas con la clave anterior dejan de ser descifrables — no es una rotación trivial.

### 8. Notificaciones push — variables y generación
Variables de servidor para `/api/push/*` (ver `.env.local` para los valores actuales):
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — par de claves VAPID, generadas con `npx web-push generate-vapid-keys`. La pública lleva el prefijo `NEXT_PUBLIC_` porque el navegador la necesita en `PushSetup.tsx` para suscribirse (Next.js solo expone al cliente las variables con ese prefijo) — no es una elección de estilo, es un requisito técnico.
- `VAPID_SUBJECT` — `mailto:alexmaza.fitness@gmail.com`.
- `CRON_SECRET` — string aleatorio (`openssl rand -base64 32`). Vercel añade automáticamente `Authorization: Bearer $CRON_SECRET` en las llamadas a rutas de cron definidas en `vercel.json` cuando esta variable está configurada en el proyecto — `/api/push/cron` solo compara ese header.
- `SUPABASE_SERVICE_ROLE_KEY` — **no generada por la app**, hay que copiarla del dashboard de Supabase (Project Settings → API → "service_role" key → Reveal). El cron no tiene sesión de usuario/cookies, así que la RLS (`owner_id = auth.uid()`) bloquearía todas sus consultas con el cliente normal; `lib/supabase/service.ts` usa esta key para bypasarla. Nunca exponer con `NEXT_PUBLIC_`, nunca usar fuera de rutas server-only sin sesión.

Todas viven en Vercel (producción) y `.env.local` (local). Añadir a Vercel manualmente tras generar — Claude no tiene acceso a ese panel.

---

## Patrones de código

### Server Action estándar

```typescript
// lib/personal/algo-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/personal/cerebro/algo";

export async function crearAlgo(params: { ... }) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("personal")           // ← especificar siempre el schema
    .from("tabla")
    .insert({ owner_id: ownerId, ...params });
  if (error) throw error;
  revalidatePath(PATH);           // ← invalida cache de la ruta
}
```

### Query en server component

```typescript
// lib/personal/algo-queries.ts
import { createClient } from "@/lib/supabase/server";

export async function listAlgo(): Promise<AlgoVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("tabla")
    .select("id, campo1, campo2")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ ... }));
}
```

### Ruta API con IA

```typescript
// app/api/modulo/accion/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);         // ← siempre verificar auth

  const body = await req.json() as { ... };

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",          // ← modelo actual
    max_tokens: 1024,
    system: "...",
    messages: [{ role: "user", content: "..." }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return Response.json({ result: text });
}
```

### Client Component con Server Actions

```typescript
// components/shared/.../XPageClient.tsx
"use client";

import { useState, useTransition } from "react";
import { crearAlgo, editarAlgo, eliminarAlgo } from "@/lib/personal/algo-actions";

export function XPageClient({ items }: { items: AlgoVM[] }) {
  const [, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  // uso:
  // run(() => crearAlgo(params), () => setModal(null))
}
```

### Cambios de esquema via MCP

Para DDL (CREATE TABLE, ALTER TABLE):
```
mcp__claude_ai_Supabase__apply_migration
  project_id: "qtkkrcehzqjkjrgssnyn"
  name: "descripcion_snake_case"
  query: "ALTER TABLE ..."
```

Para consultas normales (SELECT, INSERT, UPDATE sin DDL):
```
mcp__claude_ai_Supabase__execute_sql
  project_id: "qtkkrcehzqjkjrgssnyn"
  query: "SELECT ..."
```

---

## Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Server Actions | `verbNombre` en camelCase | `crearCliente`, `editarNota`, `eliminarCategoria` |
| Queries | `listX`, `getX` | `listKnNotes`, `getCliente` |
| Tipos ViewModel | `NombreVM` | `ClienteVM`, `KnNoteVM` |
| Rutas de página | kebab-case | `/personal/cerebro/knowledge` |
| Archivos de componente | PascalCase | `KnowledgePageClient.tsx` |
| Migraciones SQL | `NN_descripcion_snake.sql` | `11_nueva_tabla.sql` |

---

## Errores frecuentes a evitar

1. **Timezone en dates**: `new Date("2026-06-01").toISOString()` devuelve UTC — en Spain (UTC+2) esto desplaza el día. Usar siempre `new Date(iso + "T00:00:00")` para parsing y formatear con `getFullYear()`/`getMonth()`/`getDate()` locales, no con `toISOString().slice(0,10)`.

2. **Schema en Supabase**: El cliente con `.schema("personal")` o `.schema("coaching")` es necesario para todas las queries. Sin él, Supabase usa `public.*` y falla.

3. **RLS sin service_role**: Las rutas API usan el cliente normal (`createClient()`) con las cookies del usuario. Nunca usar la clave `service_role` en código del lado del usuario.

4. **revalidatePath tras mutación**: Toda Server Action que modifica datos debe llamar a `revalidatePath(PATH)` para que Next.js invalide el cache y la página se refresque.
