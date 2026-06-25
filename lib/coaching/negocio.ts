import type { EstadoTarjeta, FaseId, TipoTarjeta } from "./negocio-constants";

export type SubtareaVM = {
  id: string;
  texto: string;
  hecha: boolean;
};

export type TarjetaVM = {
  id: string;
  faseId: FaseId;
  tipo: TipoTarjeta | null;
  titulo: string;
  nota: string | null;
  estado: EstadoTarjeta;
  subtareas: SubtareaVM[];
};

const PESO: Record<EstadoTarjeta, number> = { pendiente: 0, curso: 0.5, hecho: 1 };

// Si la tarjeta tiene subtareas, su estado/peso se deriva de ellas (igual
// que el HTML). Si no tiene ninguna, se usa el campo "estado" guardado —
// a diferencia del HTML original, donde quedaba "No definido" para siempre.
export function estadoEfectivo(t: TarjetaVM): EstadoTarjeta | "nodef" {
  if (t.subtareas.length === 0) return t.estado;
  const hechas = t.subtareas.filter((s) => s.hecha).length;
  if (hechas === 0) return "pendiente";
  if (hechas === t.subtareas.length) return "hecho";
  return "curso";
}

export function pesoTarjeta(t: TarjetaVM): number {
  if (t.subtareas.length > 0) {
    return t.subtareas.filter((s) => s.hecha).length / t.subtareas.length;
  }
  return PESO[t.estado];
}

export function pctFase(tarjetas: TarjetaVM[]): number {
  if (tarjetas.length === 0) return 0;
  return Math.round((tarjetas.reduce((s, t) => s + pesoTarjeta(t), 0) / tarjetas.length) * 100);
}
