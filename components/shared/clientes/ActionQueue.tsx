import { clientesActivos, hasNotas, type ClienteVM } from "@/lib/coaching/clientes";
import { CATEGORIA_LABEL, CATEGORIAS } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import { Pill } from "@/components/ui/Pill";

const ICONS = {
  pago: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 10h18M6 5h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3z" />
    </svg>
  ),
  revision: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-3 7l2 2 4-4" />
    </svg>
  ),
  meso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  notas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 16 8 17l1-3.8 8.6-8.6z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
};

const CARD_BORDER = { urgent: "border-t-bad", soon: "border-t-warn", info: "border-t-gold" };
const CARD_HEAD_BG = { urgent: "bg-bad-bg", soon: "bg-warn-bg", info: "bg-[rgba(201,169,110,.08)]" };
const CARD_ICON = { urgent: "bg-bad-bg text-bad", soon: "bg-warn-bg text-warn", info: "bg-[rgba(201,169,110,.12)] text-gold" };
const CARD_COUNT = { urgent: "text-bad", soon: "text-warn", info: "text-gold" };
const CARD_PRIO = {
  urgent: "bg-bad text-white",
  soon: "bg-warn text-[#1a1208]",
  info: "bg-[rgba(201,169,110,.18)] text-gold-bright",
};

type Cls = "urgent" | "soon" | "info";

function QueueCard({
  cls,
  icon,
  title,
  count,
  prio,
  children,
}: {
  cls: Cls;
  icon: React.ReactNode;
  title: string;
  count: number;
  prio: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-line-soft border-t-[3px] bg-panel ${CARD_BORDER[cls]}`}>
      <div className={`flex items-center gap-2.5 border-b border-line-soft px-4 py-3 ${CARD_HEAD_BG[cls]}`}>
        <div className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg ${CARD_ICON[cls]}`}>
          <span className="h-4 w-4">{icon}</span>
        </div>
        <div className="font-heading text-sm font-bold">{title}</div>
        <div className={`font-display text-[22px] leading-none ${CARD_COUNT[cls]}`}>{count}</div>
        <div className={`ml-auto rounded px-2 py-0.5 font-display text-[10px] tracking-wide uppercase ${CARD_PRIO[cls]}`}>
          P{prio}
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function QueueRow({
  cliente,
  meta,
  pill,
  action,
  onOpenDrawer,
}: {
  cliente: ClienteVM;
  meta: string;
  pill: React.ReactNode;
  action?: React.ReactNode;
  onOpenDrawer: (id: string) => void;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-panel-2"
      onClick={() => onOpenDrawer(cliente.id)}
    >
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{cliente.nombre}</span>
      <span className="whitespace-nowrap text-[11.5px] text-text-dim">{meta}</span>
      {pill}
      {action}
    </div>
  );
}

function CheckButton({ onClick, title }: { onClick: (e: React.MouseEvent) => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-panel-3 text-text-dim transition hover:bg-ok-bg hover:text-ok"
    >
      <span className="h-[13px] w-[13px]">{ICONS.check}</span>
    </button>
  );
}

function GearButton({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      title="Gestionar mesociclo"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-panel-3 text-text-dim transition hover:bg-ok-bg hover:text-ok"
    >
      <span className="h-[13px] w-[13px]">{ICONS.gear}</span>
    </button>
  );
}

export function ActionQueue({
  clientes,
  onOpenDrawer,
  onMarcarRevision,
  onMarcarCobro,
  onAbrirMeso,
}: {
  clientes: ClienteVM[];
  onOpenDrawer: (id: string) => void;
  // Si se omiten, la cola se muestra en modo solo lectura (sin botones de
  // acción) — usado en la portada "Hoy", que solo agrega datos, no muta.
  onMarcarRevision?: (id: string) => void;
  onMarcarCobro?: (id: string) => void;
  onAbrirMeso?: (id: string) => void;
}) {
  const A = clientesActivos(clientes);
  const conNotas = A.filter(hasNotas);
  const mesoUpd = A.filter((c) => c.mesociclo && c.mesociclo.estado !== "EN_CURSO");
  const revPend = A.filter((c) => c.revD !== null && c.revD < 0);
  const vencidos = A.filter((c) => c.pagoD !== null && c.pagoD < 0);
  const proximos = A.filter((c) => c.pagoD !== null && c.pagoD >= 0 && c.pagoD <= 7);
  const cobros = [...vencidos, ...proximos].sort((a, b) => (a.pagoD ?? 0) - (b.pagoD ?? 0));

  let p = 0;
  const cards: React.ReactNode[] = [];

  if (conNotas.length) {
    p++;
    cards.push(
      <QueueCard key="notas" cls="info" icon={ICONS.notas} title="Notas" count={conNotas.length} prio={p}>
        {conNotas.map((c) => (
          <div
            key={c.id}
            className="cursor-pointer rounded-lg p-2.5 transition hover:bg-panel-2 [&+&]:mt-0.5 [&+&]:border-t [&+&]:border-line-soft"
            onClick={() => onOpenDrawer(c.id)}
          >
            <div className="mb-1.5 text-[13.5px] font-semibold">{c.nombre}</div>
            {CATEGORIAS.map((cat) =>
              c.notas[cat].map((nota) => (
                <div key={nota.id} className="flex items-start gap-2 py-0.5">
                  <span
                    className={`mt-px shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-gold uppercase ${
                      cat === "meso" ? "bg-meso" : cat === "nutricion" ? "bg-nutri" : cat === "seguimiento" ? "bg-seguimiento" : "bg-panel-3 text-text-2"
                    }`}
                  >
                    {CATEGORIA_LABEL[cat]}
                  </span>
                  <span className="text-[12.5px] leading-snug text-text-2">{nota.texto}</span>
                </div>
              )),
            )}
          </div>
        ))}
      </QueueCard>,
    );
  }

  if (mesoUpd.length) {
    p++;
    cards.push(
      <QueueCard key="meso" cls="soon" icon={ICONS.meso} title="Mesociclos" count={mesoUpd.length} prio={p}>
        {mesoUpd.map((c) => (
          <QueueRow
            key={c.id}
            cliente={c}
            meta={c.mesociclo?.estado === "CON_RETRASO" ? "Vencido" : `Acaba ${fmtDateCorta(c.mesociclo?.fechaFin ?? null)}`}
            pill={
              <Pill variant={c.mesociclo?.estado === "CON_RETRASO" ? "bad" : "warn"}>
                {Math.abs(c.mesociclo?.diasRestantes ?? 0)}d
              </Pill>
            }
            action={onAbrirMeso && <GearButton onClick={() => onAbrirMeso(c.id)} />}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </QueueCard>,
    );
  }

  if (revPend.length) {
    p++;
    cards.push(
      <QueueCard key="revisiones" cls="soon" icon={ICONS.revision} title="Revisiones" count={revPend.length} prio={p}>
        {revPend.map((c) => (
          <QueueRow
            key={c.id}
            cliente={c}
            meta={`Grupo ${c.grupoCodigo ?? "—"}`}
            pill={<Pill variant="bad">{Math.abs(c.revD ?? 0)}d</Pill>}
            action={onMarcarRevision && <CheckButton title="Marcar revisión hecha" onClick={() => onMarcarRevision(c.id)} />}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </QueueCard>,
    );
  }

  if (cobros.length) {
    p++;
    cards.push(
      <QueueCard key="cobros" cls="soon" icon={ICONS.pago} title="Cobros" count={cobros.length} prio={p}>
        {cobros.map((c) => (
          <QueueRow
            key={c.id}
            cliente={c}
            meta={c.cuota ? `${c.cuota} €` : "—"}
            pill={
              (c.pagoD ?? 0) < 0 ? (
                <Pill variant="bad">Vencido {Math.abs(c.pagoD ?? 0)}d</Pill>
              ) : (
                <Pill variant="warn">{c.pagoD}d</Pill>
              )
            }
            action={onMarcarCobro && <CheckButton title="Marcar cobro cobrado" onClick={() => onMarcarCobro(c.id)} />}
            onOpenDrawer={onOpenDrawer}
          />
        ))}
      </QueueCard>,
    );
  }

  if (cards.length === 0) {
    return <p className="text-sm text-text-dim">Sin acciones pendientes. Todo al día.</p>;
  }

  return <div className="grid grid-cols-[repeat(auto-fill,minmax(330px,1fr))] gap-3.5">{cards}</div>;
}
