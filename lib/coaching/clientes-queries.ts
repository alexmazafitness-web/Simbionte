import { createClient } from "@/lib/supabase/server";
import { CATEGORIAS, type Categoria, type Recurrencia } from "./constants";
import { diffDiasDesdeHoy, iniciales, permanenciaMeses } from "./format";
import { estadoMesociclo, vacioPorCategoria, type ClienteVM, type EstadoCliente } from "./clientes";

// Sólo para Server Components / Server Actions: importa next/headers vía
// lib/supabase/server.ts y por tanto nunca debe importarse desde un
// componente cliente (usar lib/coaching/clientes.ts para tipos y helpers).

type ClienteRow = {
  id: string;
  nombre: string;
  estado: EstadoCliente;
  fecha_inicio: string | null;
  fase_completada: boolean;
  baja_fecha: string | null;
  baja_motivo: string | null;
  ltv_acumulado: number;
  proxima_revision: string | null;
  grupo_revision_id: string | null;
  grupos_revision: { id: string; codigo: string; nombre: string } | null;
  suscripciones: {
    id: string;
    precio: number;
    recurrencia: Recurrencia;
    proximo_pago: string | null;
    estado: string;
    fecha_inicio: string;
  }[];
  mesociclos: {
    id: string;
    numero_microciclos: number;
    dias_microciclo: number;
    fecha_fin: string | null;
    estado: string;
    fecha_inicio: string | null;
  }[];
  notas_cliente: { id: string; nota: string; categoria: Categoria; fecha: string }[];
};

function shapeCliente(row: ClienteRow): ClienteVM {
  const suscripcionActiva =
    [...row.suscripciones].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)).find((s) => s.estado === "activa") ?? null;

  const mesocicloActivo =
    [...row.mesociclos]
      .sort((a, b) => (b.fecha_inicio ?? "").localeCompare(a.fecha_inicio ?? ""))
      .find((m) => m.estado === "en_curso") ?? null;

  const diasRestantesMeso = mesocicloActivo ? diffDiasDesdeHoy(mesocicloActivo.fecha_fin) : null;

  const notas = vacioPorCategoria();
  for (const n of row.notas_cliente) {
    if (CATEGORIAS.includes(n.categoria)) {
      notas[n.categoria].push({ id: n.id, texto: n.nota, categoria: n.categoria, fecha: n.fecha });
    }
  }

  return {
    id: row.id,
    nombre: row.nombre,
    iniciales: iniciales(row.nombre),
    estado: row.estado,
    grupoId: row.grupo_revision_id,
    grupoCodigo: row.grupos_revision?.codigo ?? null,
    grupoNombre: row.grupos_revision?.nombre ?? null,
    fechaAlta: row.fecha_inicio,
    permanencia: permanenciaMeses(row.fecha_inicio, row.baja_fecha ?? undefined),
    faseCompletada: row.fase_completada,
    bajaFecha: row.baja_fecha,
    bajaMotivo: row.baja_motivo,
    ltvAcumulado: row.ltv_acumulado,
    cuota: suscripcionActiva?.precio ?? null,
    recurrencia: suscripcionActiva?.recurrencia ?? null,
    proximoPago: suscripcionActiva?.proximo_pago ?? null,
    pagoD: suscripcionActiva ? diffDiasDesdeHoy(suscripcionActiva.proximo_pago) : null,
    proximaRevision: row.proxima_revision,
    revD: diffDiasDesdeHoy(row.proxima_revision),
    mesociclo: mesocicloActivo
      ? {
          id: mesocicloActivo.id,
          numeroMicrociclos: mesocicloActivo.numero_microciclos,
          diasMicrociclo: mesocicloActivo.dias_microciclo,
          fechaFin: mesocicloActivo.fecha_fin,
          diasRestantes: diasRestantesMeso,
          estado: estadoMesociclo(diasRestantesMeso),
        }
      : null,
    notas,
  };
}

const SELECT_CLIENTE = `
  id, nombre, estado, fecha_inicio, fase_completada, baja_fecha, baja_motivo,
  ltv_acumulado, proxima_revision, grupo_revision_id,
  grupos_revision ( id, codigo, nombre ),
  suscripciones ( id, precio, recurrencia, proximo_pago, estado, fecha_inicio ),
  mesociclos ( id, numero_microciclos, dias_microciclo, fecha_fin, estado, fecha_inicio ),
  notas_cliente ( id, nota, categoria, fecha )
`;

export async function listClientes(): Promise<ClienteVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("clientes")
    .select(SELECT_CLIENTE)
    .neq("estado", "eliminado")
    .order("nombre");

  if (error) throw error;
  return (data as unknown as ClienteRow[]).map(shapeCliente);
}
