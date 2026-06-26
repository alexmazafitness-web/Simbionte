"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/coaching/leads";
import { agendarLlamada, avanzarLead, crearLead, descartarLead, editarLead, eliminarLead } from "@/lib/coaching/leads-actions";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/SearchInput";
import { LeadsBoard } from "./LeadsBoard";
import { LeadModal } from "./LeadModal";
import { AgendarLlamadaModal } from "./AgendarLlamadaModal";

export function LeadsPageClient({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<"activos" | "historico">("activos");
  const [modalLeadId, setModalLeadId] = useState<string | null | "__new__">(null);
  const [agendandoLeadId, setAgendandoLeadId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const q = search.toLowerCase();
  const filtered = leads.filter((l) => l.nombre.toLowerCase().includes(q));
  const modalLead = modalLeadId && modalLeadId !== "__new__" ? leads.find((l) => l.id === modalLeadId) ?? null : null;
  const modalOpen = modalLeadId !== null;
  const leadAgendando = leads.find((l) => l.id === agendandoLeadId) ?? null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  function convertir(lead: Lead) {
    const params = new URLSearchParams({ leadId: lead.id, nombre: lead.nombre });
    router.push(`/coaching/clientes?${params.toString()}`);
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar lead…" />
        <div className="flex gap-1.5">
          <Chip active={filtro === "activos"} onClick={() => setFiltro("activos")}>
            Activos
          </Chip>
          <Chip active={filtro === "historico"} onClick={() => setFiltro("historico")}>
            Histórico
          </Chip>
        </div>
        <button
          type="button"
          onClick={() => setModalLeadId("__new__")}
          className="ml-auto rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
        >
          + Nuevo lead
        </button>
      </div>

      <LeadsBoard
        leads={filtered}
        filtro={filtro}
        onOpenLead={setModalLeadId}
        onAvanzar={(id) => {
          const lead = leads.find((l) => l.id === id);
          if (!lead) return;
          // Puente Leads → Calendario: esta transición concreta pide fecha/hora
          // antes de avanzar — el resto de etapas avanzan con un solo clic.
          if (lead.etapa === "audio") {
            setAgendandoLeadId(id);
            return;
          }
          run(() => avanzarLead(id, lead.etapa));
        }}
        onConvertir={(id) => {
          const lead = leads.find((l) => l.id === id);
          if (lead) convertir(lead);
        }}
        onDescartar={(id) => run(() => descartarLead(id))}
      />

      <LeadModal
        open={modalOpen}
        onClose={() => setModalLeadId(null)}
        lead={modalLead}
        pending={pending}
        onSave={(input) =>
          run(() => (modalLead ? editarLead(modalLead.id, input) : crearLead(input)), () => setModalLeadId(null))
        }
        onDelete={modalLead ? () => run(() => eliminarLead(modalLead.id), () => setModalLeadId(null)) : undefined}
      />

      {leadAgendando && (
        <AgendarLlamadaModal
          open={!!leadAgendando}
          onClose={() => setAgendandoLeadId(null)}
          nombreLead={leadAgendando.nombre}
          pending={pending}
          onSubmit={(fecha, hora) =>
            run(
              () => agendarLlamada(leadAgendando.id, leadAgendando.nombre, leadAgendando.contacto ?? "", fecha, hora),
              () => setAgendandoLeadId(null),
            )
          }
        />
      )}
    </div>
  );
}
