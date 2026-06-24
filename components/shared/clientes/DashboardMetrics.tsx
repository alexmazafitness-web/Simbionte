// Métricas de negocio — valores fijos de ejemplo (decisión consciente, Fase 1).
// Calcularlas en vivo desde la base de datos queda pendiente para una fase posterior.

type Estado = "ok" | "warn" | "bad";

type Metrica = {
  label: string;
  valor: string;
  unidad: string;
  estado: Estado;
  subLabel: string;
  rangos: [Estado, string][];
};

const RETENCION: Metrica[] = [
  {
    label: "Permanencia media",
    valor: "5,6",
    unidad: "meses",
    estado: "bad",
    subLabel: "Problema",
    rangos: [
      ["ok", "Sano ≥ 8m"],
      ["warn", "Alerta 6–8m"],
      ["bad", "Problema < 6m"],
    ],
  },
  {
    label: "LTV promedio",
    valor: "329",
    unidad: "€",
    estado: "bad",
    subLabel: "Débil",
    rangos: [
      ["ok", "Sano ≥ 1.200€"],
      ["warn", "Alerta 800–1.200€"],
      ["bad", "Débil < 800€"],
    ],
  },
  {
    label: "Completó 1ª fase",
    valor: "20",
    unidad: "%",
    estado: "bad",
    subLabel: "Problema serio",
    rangos: [
      ["ok", "Sano ≥ 70%"],
      ["warn", "Alerta 60–70%"],
      ["bad", "Problema < 60%"],
    ],
  },
  {
    label: "Bajas tempranas",
    valor: "0",
    unidad: "%",
    estado: "ok",
    subLabel: "Excelente",
    rangos: [
      ["ok", "Excelente < 10%"],
      ["warn", "Alerta 15–20%"],
      ["bad", "Problema > 20%"],
    ],
  },
  {
    label: "Tasa de abandono",
    valor: "7,1",
    unidad: "%",
    estado: "ok",
    subLabel: "Sano",
    rangos: [
      ["ok", "Sano < 8%"],
      ["warn", "Alerta 8–12%"],
      ["bad", "Problema > 12%"],
    ],
  },
  {
    label: "Calidad de servicio",
    valor: "OK",
    unidad: "",
    estado: "warn",
    subLabel: "Aceptable",
    rangos: [
      ["ok", "Dudas a tiempo"],
      ["warn", "Revisiones a tiempo"],
      ["bad", "—"],
    ],
  },
];

const CUMPLIMIENTO: Metrica[] = [
  {
    label: "Onboarding enviado",
    valor: "100",
    unidad: "%",
    estado: "ok",
    subLabel: "Sano",
    rangos: [["ok", "Objetivo 100%"]],
  },
  {
    label: "Objetivo inicial definido",
    valor: "100",
    unidad: "%",
    estado: "ok",
    subLabel: "Sano",
    rangos: [["ok", "Objetivo 100%"]],
  },
  {
    label: "Servicio sin incidencias 30d",
    valor: "0",
    unidad: "%",
    estado: "bad",
    subLabel: "Sin datos",
    rangos: [["bad", "Columna vacía en Sheet"]],
  },
];

const ESTADO_TEXT: Record<Estado, string> = { ok: "text-ok", warn: "text-warn", bad: "text-bad" };
const ESTADO_DOT: Record<Estado, string> = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" };
const ESTADO_BADGE: Record<Estado, string> = { ok: "bg-ok-bg text-ok", warn: "bg-warn-bg text-warn", bad: "bg-bad-bg text-bad" };

function MetricaCard({ metrica }: { metrica: Metrica }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-panel p-5">
      <div className="text-xs font-semibold tracking-wide text-text-2 uppercase">{metrica.label}</div>
      <div className={`my-3 font-display text-5xl leading-[0.85] ${ESTADO_TEXT[metrica.estado]}`}>
        {metrica.valor}
        <span className="ml-1 text-xl text-text-dim">{metrica.unidad}</span>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ESTADO_BADGE[metrica.estado]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${ESTADO_DOT[metrica.estado]}`} />
        {metrica.subLabel}
      </span>
      <div className="mt-3.5 border-t border-line-soft pt-3">
        {metrica.rangos.map(([estado, texto]) => (
          <div key={texto} className="flex items-center gap-2 py-0.5 text-[11px] text-text-dim">
            <span className={`h-2 w-2 rounded-sm ${ESTADO_DOT[estado]}`} />
            {texto}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardMetrics() {
  return (
    <div className="px-10 py-10">
      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Retención &amp; LTV
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mb-10 grid grid-cols-3 gap-3.5">
        {RETENCION.map((m) => (
          <MetricaCard key={m.label} metrica={m} />
        ))}
      </div>

      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Cumplimiento del sistema
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        {CUMPLIMIENTO.map((m) => (
          <MetricaCard key={m.label} metrica={m} />
        ))}
      </div>
    </div>
  );
}
