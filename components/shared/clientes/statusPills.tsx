import { Pill } from "@/components/ui/Pill";
import type { EstadoMesociclo } from "@/lib/coaching/clientes";

export function PagoPill({ dias }: { dias: number | null }) {
  if (dias === null) return <Pill variant="neutral">—</Pill>;
  if (dias < 0) return <Pill variant="bad">Vencido {Math.abs(dias)}d</Pill>;
  if (dias <= 7) return <Pill variant="warn">En {dias}d</Pill>;
  return <Pill variant="ok">En {dias}d</Pill>;
}

export function RevisionPill({ dias }: { dias: number | null }) {
  if (dias === null) return <Pill variant="neutral">—</Pill>;
  if (dias < 0) return <Pill variant="bad">Retraso {Math.abs(dias)}d</Pill>;
  return <Pill variant="ok">En {dias}d</Pill>;
}

const MESO_LABEL: Record<EstadoMesociclo, string> = {
  EN_CURSO: "En curso",
  ACTUALIZAR: "Actualizar",
  CON_RETRASO: "Retraso",
};

const MESO_VARIANT: Record<EstadoMesociclo, "ok" | "warn" | "bad"> = {
  EN_CURSO: "ok",
  ACTUALIZAR: "warn",
  CON_RETRASO: "bad",
};

export function MesoPill({ estado }: { estado: EstadoMesociclo | null }) {
  if (!estado) return <Pill variant="neutral">—</Pill>;
  return <Pill variant={MESO_VARIANT[estado]}>{MESO_LABEL[estado]}</Pill>;
}
