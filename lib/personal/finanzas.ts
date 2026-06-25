import type { Periodo } from "./finanzas-constants";

export type TipoTransaccion = "ingreso" | "gasto";

export type TransaccionVM = {
  id: string;
  tipo: TipoTransaccion;
  importe: number;
  fecha: string | null;
  categoria: string;
  descripcion: string | null;
};

export type InversionVM = {
  id: string;
  nombre: string;
  tipo: string;
  precioCompra: number;
  precioActual: number;
  cantidad: number;
  fecha: string | null;
};

export type CryptoVM = {
  id: string;
  nombre: string;
  simbolo: string;
  precioCompra: number;
  precioActual: number;
  cantidad: number;
  fecha: string | null;
};

export type DeudaVM = {
  id: string;
  nombre: string;
  tipo: string | null;
  total: number;
  pendiente: number;
  cuota: number;
  interes: number;
};

export type ObjetivoVM = {
  id: string;
  nombre: string;
  meta: number;
  actual: number;
  fecha: string | null;
  emoji: string;
};

export function fmtEUR(valor: number, decimales = 0): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor || 0);
}

export function fmtPct(valor: number): string {
  return (valor >= 0 ? "+" : "") + valor.toFixed(2) + "%";
}

// --- cálculos puros, igual que el HTML ---

export function valorPosicion(precioActual: number, cantidad: number): number {
  return precioActual * cantidad;
}

export function costePosicion(precioCompra: number, cantidad: number): number {
  return precioCompra * cantidad;
}

export function plPosicion(precioCompra: number, precioActual: number, cantidad: number): number {
  return (precioActual - precioCompra) * cantidad;
}

export function rentabilidadPct(precioCompra: number, precioActual: number): number {
  return precioCompra > 0 ? ((precioActual - precioCompra) / precioCompra) * 100 : 0;
}

export function pctAmortizado(total: number, pendiente: number): number {
  return total > 0 ? ((total - pendiente) / total) * 100 : 0;
}

export function pctObjetivo(meta: number, actual: number): number {
  return meta > 0 ? Math.min(100, (actual / meta) * 100) : 0;
}

// Igual que filterPeriod() del HTML: filtra por fecha sobre la marca de periodo elegida.
export function filterPeriodo(transacciones: TransaccionVM[], periodo: Periodo): TransaccionVM[] {
  const hoy = new Date();
  return transacciones.filter((t) => {
    if (!t.fecha) return true;
    const d = new Date(t.fecha);
    if (periodo === "este_mes") return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
    if (periodo === "mes_anterior") {
      const m = new Date(hoy.getFullYear(), hoy.getMonth() - 1);
      return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
    }
    if (periodo === "trimestre") {
      const t3 = new Date(hoy);
      t3.setMonth(hoy.getMonth() - 3);
      return d >= t3;
    }
    if (periodo === "anio") return d.getFullYear() === hoy.getFullYear();
    return true;
  });
}
