# Identidad visual · Simbionte

## Variables CSS (app/globals.css)

```css
:root, html, body {
  color-scheme: dark;

  /* Base */
  --background:  #141414;          /* fondo de pantalla */
  --foreground:  #f5f2ec;          /* texto principal */

  /* Dorado — color transversal de marca */
  --gold:        #c9a96e;
  --gold-bright: #e2c892;          /* hover, activo */
  --gold-dim:    rgba(201,169,110,0.5);   /* texto secundario dorado */

  /* Paneles */
  --panel:   #1a1a1a;
  --panel-2: #1f1f1f;              /* hover, fondo alternativo */
  --panel-3: #242424;              /* chips, badges */

  /* Bordes */
  --line:      rgba(201,169,110,0.14);   /* borde con tinte dorado */
  --line-soft: rgba(237,230,214,0.07);   /* borde muy sutil */

  /* Texto */
  --text-2:   #b9b2a4;             /* texto secundario */
  --text-dim: #7d776c;             /* texto apagado, placeholders */

  /* Semántica */
  --ok:       #74c69d;             /* verde: éxito, activo */
  --warn:     #d9a441;             /* naranja: advertencia, marcado */
  --bad:      #d9624a;             /* rojo: error, baja, eliminar */
  --ok-bg:    rgba(116,198,157,0.1);
  --warn-bg:  rgba(217,164,65,0.1);
  --bad-bg:   rgba(217,98,74,0.12);

  /* Paletas por área de coaching */
  --meso:        #243b55;          /* azul oscuro — entrenamiento */
  --nutri:       #2a4a38;          /* verde oscuro — nutrición */
  --seguimiento: #000000;          /* negro — seguimiento */
}
```

---

## Clases Tailwind más usadas

Tailwind v4 genera clases directamente de las variables CSS via `@theme inline`. Los nombres son los mismos que las variables sin `--color-`:

| Clase Tailwind | Variable CSS | Uso típico |
|---|---|---|
| `bg-[#141414]` / body | `--background` | Fondo general |
| `text-foreground` | `--foreground` | Texto principal |
| `bg-panel` | `--panel` | Cards, modales |
| `bg-panel-2` | `--panel-2` | Hover, fondo alternativo |
| `bg-panel-3` | `--panel-3` | Chips, badges, avatares |
| `text-gold` | `--gold` | Elementos activos, seleccionado |
| `text-gold-bright` | `--gold-bright` | Hover de elementos dorados |
| `text-gold-dim` | `--gold-dim` | Labels de sección, dim gold |
| `border-line` | `--line` | Bordes con tinte dorado |
| `border-line-soft` | `--line-soft` | Bordes sutiles (tablas, separadores) |
| `text-text-2` | `--text-2` | Texto secundario |
| `text-text-dim` | `--text-dim` | Placeholders, labels apagados |
| `text-ok` | `--ok` | Estado positivo |
| `text-warn` | `--warn` | Advertencia, fecha marcada |
| `text-bad` / `text-red-400` | `--bad` | Error, eliminar |

---

## Tipografías

Cargadas desde Google Fonts en `app/layout.tsx`:

| Variable CSS | Clase Tailwind | Fuente | Uso |
|---|---|---|---|
| `--font-display` | `font-display` | **Bebas Neue** | Números grandes, KPIs, importes |
| `--font-heading` | `font-heading` | **Schibsted Grotesk** | `<h1>`/`<h2>`/`<h3>`, títulos de módulo |
| `--font-sans` | `font-sans` / body | **DM Sans** | Texto de cuerpo, todo lo demás |

---

## Reglas de diseño

### Pantallas oscuras
Toda pantalla lleva `color-scheme: dark` (ya en `:root` del globals.css). En componentes inline que lo necesiten, usar `style={{ colorScheme: "dark" }}`.

### Estilo general
Minimalista, tipo *ledger/extracto bancario*. Sin decoración superflua. Bordes finos, fondo casi negro, dorado como único acento.

### Jerarquía de contenedores
```
body #141414
  └── panel #1a1a1a       ← fondo de cards y paneles
        └── panel-2 #1f1f1f  ← hover, fila activa
              └── panel-3 #242424  ← chip, badge, avatar
```

### Patrones de UI recurrentes

**Badge/chip de categoría o estado:**
```tsx
<span className="rounded-md bg-panel-3 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-gold-dim uppercase">
  LABEL
</span>
```

**Pill de estado (ok/warn/bad):**
```tsx
<Pill variant="ok|warn|bad|neutral">{text}</Pill>   // components/ui/Pill.tsx
```

**Label de sección en cabecera:**
```tsx
<span className="text-[10px] font-bold tracking-[0.22em] text-gold-dim uppercase">
  SECCIÓN
</span>
```

**Botón primario (acción principal):**
```tsx
<button className="rounded-lg bg-gold px-4 py-2 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
```

**Botón destructivo (eliminar):**
```tsx
<button className="text-[12px] text-red-400/70 hover:text-red-400">
```

**Separador de sección:**
```tsx
<div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
  SECCIÓN
  <span className="h-px flex-1 bg-line" />
</div>
```

**Input / textarea:**
```tsx
className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim placeholder:text-text-dim"
```

**Select:**
```tsx
className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim"
```

### Tamaños de fuente más usados
- KPIs / importes grandes: `text-3xl font-display` o `text-4xl`
- Título de módulo: `font-heading text-[16px] font-bold`
- Título de card: `font-heading text-[15px] font-bold`
- Cuerpo principal: `text-[13.5px]` o `text-[13px]`
- Metadata / labels: `text-[11.5px]` o `text-[12px]`
- Chips / badges: `text-[10px]` o `text-[9.5px]`

### Paletas específicas por front/área
Usadas en `FrontChip.tsx` y colores de eventos de calendario:

| Front | Color hex | Clase |
|---|---|---|
| `coaching` | `#4A9EFF` | azul |
| `formacion` | `#c9a96e` | dorado |
| `personal` | `#74c69d` | verde |
| `contenido` | `#c084fc` | púrpura |
