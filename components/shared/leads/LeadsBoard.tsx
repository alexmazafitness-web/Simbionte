import type { Lead } from "@/lib/coaching/leads";
import { ETAPAS, ETAPA_LABEL, ETAPA_SIGUIENTE } from "@/lib/coaching/constants";
import { Pill } from "@/components/ui/Pill";

function LeadCard({
  lead,
  onOpen,
  onAvanzar,
  onConvertir,
  onDescartar,
}: {
  lead: Lead;
  onOpen: () => void;
  onAvanzar: () => void;
  onConvertir: () => void;
  onDescartar: () => void;
}) {
  const tieneSiguiente = ETAPA_SIGUIENTE[lead.etapa as keyof typeof ETAPA_SIGUIENTE];
  return (
    <div
      className="mb-2 cursor-pointer rounded-lg border border-transparent bg-panel-2 p-3 transition hover:border-gold-dim"
      onClick={onOpen}
    >
      <div className="text-[13px] font-semibold">{lead.nombre}</div>
      {(lead.contacto || lead.origen) && (
        <div className="mt-0.5 text-[11px] text-text-dim">
          {lead.contacto}
          {lead.contacto && lead.origen ? " · " : ""}
          {lead.origen}
        </div>
      )}
      {lead.nota && <div className="mt-1.5 text-[11.5px] leading-snug text-text-2">{lead.nota}</div>}
      <div className="mt-2.5 flex gap-1.5">
        {tieneSiguiente && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAvanzar();
            }}
            className="flex-1 rounded-md bg-panel-3 py-1.5 text-center text-[10.5px] font-bold text-text-dim hover:bg-[rgba(201,169,110,.14)] hover:text-gold-bright"
          >
            Avanzar →
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConvertir();
          }}
          className="flex-1 rounded-md bg-panel-3 py-1.5 text-center text-[10.5px] font-bold text-text-dim hover:bg-ok-bg hover:text-ok"
        >
          ✓ Cliente
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDescartar();
          }}
          className="flex-1 rounded-md bg-panel-3 py-1.5 text-center text-[10.5px] font-bold text-text-dim hover:bg-bad-bg hover:text-bad"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function LeadsBoard({
  leads,
  filtro,
  onOpenLead,
  onAvanzar,
  onConvertir,
  onDescartar,
}: {
  leads: Lead[];
  filtro: "activos" | "historico";
  onOpenLead: (id: string) => void;
  onAvanzar: (id: string) => void;
  onConvertir: (id: string) => void;
  onDescartar: (id: string) => void;
}) {
  if (filtro === "historico") {
    const hist = leads.filter((l) => l.etapa === "cliente" || l.etapa === "descartado");
    if (hist.length === 0) {
      return <div className="py-9 text-center text-text-dim">Sin histórico todavía</div>;
    }
    return (
      <div className="flex flex-col gap-2">
        {hist.map((l) => (
          <div
            key={l.id}
            onClick={() => onOpenLead(l.id)}
            className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-line-soft bg-panel px-4 py-3.5 hover:border-gold-dim"
          >
            <span className="flex-1 text-[13.5px] font-semibold">{l.nombre}</span>
            <Pill variant={l.etapa === "cliente" ? "ok" : "bad"} dot={false}>
              {l.etapa === "cliente" ? "Convertido a cliente" : "Descartado"}
            </Pill>
          </div>
        ))}
      </div>
    );
  }

  const activos = leads.filter((l) => ETAPAS.includes(l.etapa as (typeof ETAPAS)[number]));

  return (
    <div className="mt-4.5 grid grid-cols-4 gap-3.5">
      {ETAPAS.map((etapa) => {
        const items = activos.filter((l) => l.etapa === etapa);
        return (
          <div key={etapa} className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
            <div className="flex items-center gap-2 border-b border-line px-3.5 py-3 font-heading text-[12.5px] font-bold">
              {ETAPA_LABEL[etapa]}
              <span className="ml-auto flex h-[21px] min-w-[21px] items-center justify-center rounded-md bg-panel-3 text-[11.5px] font-bold text-text-2">
                {items.length}
              </span>
            </div>
            <div className="min-h-[60px] p-2">
              {items.map((l) => (
                <LeadCard
                  key={l.id}
                  lead={l}
                  onOpen={() => onOpenLead(l.id)}
                  onAvanzar={() => onAvanzar(l.id)}
                  onConvertir={() => onConvertir(l.id)}
                  onDescartar={() => onDescartar(l.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
