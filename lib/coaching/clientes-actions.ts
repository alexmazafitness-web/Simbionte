"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { CICLO_DIAS, GRUPO_REV_DEFAULT, type Categoria, type Recurrencia } from "./constants";
import { addDaysISO, fmtDateCorta, todayISO } from "./format";

const PATH = "/coaching/clientes";

async function getGrupoId(grupoCodigo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("grupos_revision")
    .select("id")
    .eq("codigo", grupoCodigo)
    .single();
  if (error) throw error;
  return data.id as string;
}

export type NuevoClienteInput = {
  nombre: string;
  cuota: number;
  recurrencia: Recurrencia;
  grupoCodigo: string;
  leadId?: string;
};

export async function crearCliente(input: NuevoClienteInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const hoy = todayISO();
  const grupoId = await getGrupoId(input.grupoCodigo);

  const { data: cliente, error: clienteError } = await supabase
    .schema("coaching")
    .from("clientes")
    .insert({
      owner_id: ownerId,
      nombre: input.nombre,
      estado: "activo",
      fecha_inicio: hoy,
      grupo_revision_id: grupoId,
      proxima_revision: addDaysISO(hoy, GRUPO_REV_DEFAULT[input.grupoCodigo] ?? 0),
    })
    .select("id")
    .single();
  if (clienteError) throw clienteError;

  const clienteId = cliente.id as string;

  const { error: suscError } = await supabase.schema("coaching").from("suscripciones").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    precio: input.cuota,
    recurrencia: input.recurrencia,
    fecha_inicio: hoy,
    proximo_pago: addDaysISO(hoy, CICLO_DIAS[input.recurrencia]),
    estado: "activa",
  });
  if (suscError) throw suscError;

  const { error: mesoError } = await supabase.schema("coaching").from("mesociclos").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    nombre: "Mesociclo 1",
    numero_microciclos: 1,
    dias_microciclo: 7,
    fecha_inicio: hoy,
    fecha_fin: addDaysISO(hoy, 14),
    estado: "en_curso",
  });
  if (mesoError) throw mesoError;

  if (input.leadId) {
    const { data: lead } = await supabase
      .schema("coaching")
      .from("leads")
      .select("nota, origen")
      .eq("id", input.leadId)
      .single();

    if (lead?.nota) {
      await supabase.schema("coaching").from("notas_cliente").insert({
        owner_id: ownerId,
        cliente_id: clienteId,
        categoria: "otros",
        nota: `Origen: lead (${lead.origen || "sin fuente"}). Nota previa: ${lead.nota}`,
        fecha: hoy,
      });
    }

    const { error: leadUpdateError } = await supabase
      .schema("coaching")
      .from("leads")
      .update({ estado: "cliente" })
      .eq("id", input.leadId);
    if (leadUpdateError) throw leadUpdateError;
  }

  revalidatePath(PATH);
  revalidatePath("/coaching/leads");
  return { clienteId };
}

export async function darBajaCliente(clienteId: string, fecha: string, motivo: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({ estado: "baja", baja_fecha: fecha, baja_motivo: motivo })
    .eq("id", clienteId);
  if (error) throw error;
  revalidatePath(PATH);
}

export type ReactivarClienteInput = {
  cuota: number;
  recurrencia: Recurrencia;
  grupoCodigo: string;
};

export async function reactivarCliente(clienteId: string, input: ReactivarClienteInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const hoy = todayISO();

  const { data: clienteActual, error: clienteFetchError } = await supabase
    .schema("coaching")
    .from("clientes")
    .select("baja_fecha, baja_motivo")
    .eq("id", clienteId)
    .single();
  if (clienteFetchError) throw clienteFetchError;

  const grupoId = await getGrupoId(input.grupoCodigo);

  const { error: clienteError } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({
      estado: "activo",
      fecha_inicio: hoy,
      grupo_revision_id: grupoId,
      proxima_revision: addDaysISO(hoy, GRUPO_REV_DEFAULT[input.grupoCodigo] ?? 0),
      baja_fecha: null,
      baja_motivo: null,
    })
    .eq("id", clienteId);
  if (clienteError) throw clienteError;

  const { error: cancelSuscError } = await supabase
    .schema("coaching")
    .from("suscripciones")
    .update({ estado: "cancelada", fecha_fin: hoy })
    .eq("cliente_id", clienteId)
    .eq("estado", "activa");
  if (cancelSuscError) throw cancelSuscError;

  const { error: suscError } = await supabase.schema("coaching").from("suscripciones").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    precio: input.cuota,
    recurrencia: input.recurrencia,
    fecha_inicio: hoy,
    proximo_pago: addDaysISO(hoy, CICLO_DIAS[input.recurrencia]),
    estado: "activa",
  });
  if (suscError) throw suscError;

  const { error: cerrarMesoError } = await supabase
    .schema("coaching")
    .from("mesociclos")
    .update({ estado: "cerrado" })
    .eq("cliente_id", clienteId)
    .eq("estado", "en_curso");
  if (cerrarMesoError) throw cerrarMesoError;

  const { error: mesoError } = await supabase.schema("coaching").from("mesociclos").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    nombre: "Mesociclo 1",
    numero_microciclos: 1,
    dias_microciclo: 7,
    fecha_inicio: hoy,
    fecha_fin: addDaysISO(hoy, 14),
    estado: "en_curso",
  });
  if (mesoError) throw mesoError;

  const bajaInfo = `Reactivado el ${fmtDateCorta(hoy)} — baja anterior: ${
    clienteActual.baja_motivo || "sin motivo"
  }, el ${clienteActual.baja_fecha ? fmtDateCorta(clienteActual.baja_fecha) : "fecha desconocida"}.`;

  await supabase.schema("coaching").from("notas_cliente").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    categoria: "otros",
    nota: bajaInfo,
    fecha: hoy,
  });

  revalidatePath(PATH);
}

export async function eliminarCliente(clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({ estado: "eliminado" })
    .eq("id", clienteId);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function marcarRevisionHecha(clienteId: string) {
  const supabase = await createClient();
  const hoy = todayISO();
  const { error } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({ proxima_revision: addDaysISO(hoy, 14) })
    .eq("id", clienteId);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

// Same date advance as marcarRevisionHecha but semantically "client didn't upload" —
// kept as a separate action so future history tracking can differentiate.
export async function saltarRevision(clienteId: string) {
  const supabase = await createClient();
  const hoy = todayISO();
  const { error } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({ proxima_revision: addDaysISO(hoy, 14) })
    .eq("id", clienteId);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function marcarCobroHecho(clienteId: string) {
  const supabase = await createClient();
  const hoy = todayISO();

  const { data: suscripcion, error: suscFetchError } = await supabase
    .schema("coaching")
    .from("suscripciones")
    .select("id, precio, recurrencia")
    .eq("cliente_id", clienteId)
    .eq("estado", "activa")
    .single();
  if (suscFetchError) throw suscFetchError;

  const { error: suscError } = await supabase
    .schema("coaching")
    .from("suscripciones")
    .update({ proximo_pago: addDaysISO(hoy, CICLO_DIAS[suscripcion.recurrencia as Recurrencia]) })
    .eq("id", suscripcion.id);
  if (suscError) throw suscError;

  const { data: cliente, error: clienteFetchError } = await supabase
    .schema("coaching")
    .from("clientes")
    .select("ltv_acumulado")
    .eq("id", clienteId)
    .single();
  if (clienteFetchError) throw clienteFetchError;

  const { error: clienteError } = await supabase
    .schema("coaching")
    .from("clientes")
    .update({ ltv_acumulado: Math.round((cliente.ltv_acumulado ?? 0) + suscripcion.precio) })
    .eq("id", clienteId);
  if (clienteError) throw clienteError;

  revalidatePath(PATH);
}

export type GestionMesocicloInput =
  | { accion: "ampliar"; extraMicrociclos: number }
  | { accion: "nuevo"; numeroMicrociclos: number; diasMicrociclo: number };

export async function gestionarMesociclo(clienteId: string, input: GestionMesocicloInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const hoy = todayISO();

  const { data: actual, error: actualError } = await supabase
    .schema("coaching")
    .from("mesociclos")
    .select("id, numero_microciclos, dias_microciclo, fecha_fin")
    .eq("cliente_id", clienteId)
    .eq("estado", "en_curso")
    .maybeSingle();
  if (actualError) throw actualError;

  if (input.accion === "ampliar") {
    if (!actual) throw new Error("No hay mesociclo en curso para este cliente.");
    const nuevaFechaFin = addDaysISO(actual.fecha_fin ?? hoy, input.extraMicrociclos * actual.dias_microciclo);
    const { error } = await supabase
      .schema("coaching")
      .from("mesociclos")
      .update({
        numero_microciclos: actual.numero_microciclos + input.extraMicrociclos,
        fecha_fin: nuevaFechaFin,
        estado: "en_curso",
      })
      .eq("id", actual.id);
    if (error) throw error;
  } else {
    if (actual) {
      const { error: cerrarMesoError } = await supabase
        .schema("coaching")
        .from("mesociclos")
        .update({ estado: "cerrado" })
        .eq("id", actual.id);
      if (cerrarMesoError) throw cerrarMesoError;
    }
    const { error } = await supabase.schema("coaching").from("mesociclos").insert({
      owner_id: ownerId,
      cliente_id: clienteId,
      nombre: `Mesociclo ${fmtDateCorta(hoy)}`,
      numero_microciclos: input.numeroMicrociclos,
      dias_microciclo: input.diasMicrociclo,
      fecha_inicio: hoy,
      fecha_fin: addDaysISO(hoy, input.numeroMicrociclos * input.diasMicrociclo),
      estado: "en_curso",
    });
    if (error) throw error;
  }

  revalidatePath(PATH);
}

export async function crearNota(clienteId: string, categoria: Categoria, texto: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("notas_cliente").insert({
    owner_id: ownerId,
    cliente_id: clienteId,
    categoria,
    nota: texto,
    fecha: todayISO(),
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarNota(notaId: string, texto: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("notas_cliente").update({ nota: texto }).eq("id", notaId);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarNota(notaId: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("notas_cliente").delete().eq("id", notaId);
  if (error) throw error;
  revalidatePath(PATH);
}
