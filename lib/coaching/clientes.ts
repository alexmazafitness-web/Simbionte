import { CATEGORIAS, MESES_CICLO, type Categoria, type Recurrencia } from "./constants";

// Tipos y helpers puros, sin dependencias de servidor (next/headers) —
// este módulo lo importan también componentes cliente.

export type EstadoCliente = "activo" | "baja" | "eliminado";
export type EstadoMesociclo = "EN_CURSO" | "ACTUALIZAR" | "CON_RETRASO";

export type NotaItem = {
  id: string;
  texto: string;
  categoria: Categoria;
  fecha: string;
};

export type MesocicloVM = {
  id: string;
  numeroMicrociclos: number;
  diasMicrociclo: number;
  fechaFin: string | null;
  diasRestantes: number | null;
  estado: EstadoMesociclo;
};

export type ClienteVM = {
  id: string;
  nombre: string;
  iniciales: string;
  estado: EstadoCliente;
  grupoId: string | null;
  grupoCodigo: string | null;
  grupoNombre: string | null;
  fechaAlta: string | null;
  permanencia: string;
  faseCompletada: boolean;
  bajaFecha: string | null;
  bajaMotivo: string | null;
  ltvAcumulado: number;
  cuota: number | null;
  recurrencia: Recurrencia | null;
  proximoPago: string | null;
  pagoD: number | null;
  proximaRevision: string | null;
  revD: number | null;
  mesociclo: MesocicloVM | null;
  notas: Record<Categoria, NotaItem[]>;
  driveFolderId: string | null;
};

export function estadoMesociclo(diasRestantes: number | null): EstadoMesociclo {
  if (diasRestantes === null) return "EN_CURSO";
  if (diasRestantes < 0) return "CON_RETRASO";
  if (diasRestantes <= 7) return "ACTUALIZAR";
  return "EN_CURSO";
}

export function vacioPorCategoria(): Record<Categoria, NotaItem[]> {
  return { meso: [], nutricion: [], seguimiento: [], otros: [] };
}

export function hasNotas(c: ClienteVM): boolean {
  return CATEGORIAS.some((cat) => c.notas[cat].length > 0);
}

export function clientesActivos(clientes: ClienteVM[]): ClienteVM[] {
  return clientes.filter((c) => c.estado === "activo");
}

// Equivalente mensual de la cuota de un cliente, según su recurrencia
// (Mensual/Trimestral/Semestral/Anual). 0 si no tiene suscripción activa.
export function precioMensual(c: ClienteVM): number {
  if (!c.cuota || !c.recurrencia) return 0;
  return c.cuota / MESES_CICLO[c.recurrencia];
}

// MRR exacto (con decimales) sumado sobre los clientes activos.
export function calcularMRR(clientes: ClienteVM[]): number {
  return clientesActivos(clientes).reduce((s, c) => s + precioMensual(c), 0);
}

// Puente Cerebro ⇄ Clientes (docs/arquitectura-simbionte.md §6): título de la
// tarea que se crea a partir de una nota. Es una copia puntual del texto en
// el momento de pulsar el botón, no un resumen vivo — si la nota cambia
// después, la tarea ya creada no se actualiza.
export function notaToTituloTarea(texto: string): string {
  const limpio = texto.trim();
  if (limpio.length <= 80) return limpio;
  const cortado = limpio.slice(0, 80);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  const base = ultimoEspacio > 40 ? cortado.slice(0, ultimoEspacio) : cortado;
  return `${base}…`;
}
