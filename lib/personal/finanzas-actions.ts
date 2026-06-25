"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { TipoTransaccion } from "./finanzas";

const PATH = "/personal/finanzas";

function paths() {
  return [
    PATH,
    `${PATH}/transacciones`,
    `${PATH}/inversiones`,
    `${PATH}/crypto`,
    `${PATH}/ahorro`,
    `${PATH}/deudas`,
  ];
}

function revalidateAll() {
  paths().forEach((p) => revalidatePath(p));
}

// --- Transacciones ---

export type TransaccionInput = {
  tipo: TipoTransaccion;
  importe: number;
  fecha: string;
  categoria: string;
  descripcion: string;
};

export async function crearTransaccion(input: TransaccionInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("fin_transactions").insert({
    owner_id: ownerId,
    type: input.tipo,
    amount: input.importe,
    date: input.fecha,
    category: input.categoria,
    description: input.descripcion || null,
  });
  if (error) throw error;
  revalidateAll();
}

export async function eliminarTransaccion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("fin_transactions").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
}

export type FilaCsv = {
  fecha: string;
  descripcion: string;
  importe: number;
  tipo: string;
  categoria: string;
};

// Igual que confirmImport() del HTML: inserta en bloque las filas ya
// parseadas y previsualizadas en el cliente.
export async function importarTransaccionesCsv(filas: FilaCsv[]) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  // "date" es NOT NULL en fin_transactions: si una sola fila llegara sin
  // fecha, el insert en bloque fallaría entero por esa fila. Se descarta
  // aquí, igual que ya se descartan las filas con importe<=0.
  const rows = filas
    .filter((f) => f.importe > 0 && f.fecha.trim() !== "")
    .map((f) => ({
      owner_id: ownerId,
      type: f.tipo.toLowerCase() === "ingreso" ? "ingreso" : "gasto",
      amount: f.importe,
      date: f.fecha,
      category: f.categoria || "Otros",
      description: f.descripcion || null,
    }));
  if (rows.length === 0) return { importadas: 0 };

  const { error } = await supabase.schema("personal").from("fin_transactions").insert(rows);
  if (error) throw error;
  revalidateAll();
  return { importadas: rows.length };
}

// --- Inversiones ---

export type InversionInput = {
  nombre: string;
  tipo: string;
  precioCompra: number;
  precioActual: number;
  cantidad: number;
  fecha: string;
};

export async function crearInversion(input: InversionInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const precioActual = input.precioActual || input.precioCompra;
  const { error } = await supabase.schema("personal").from("fin_investments").insert({
    owner_id: ownerId,
    name: input.nombre,
    type: input.tipo,
    purchase_price: input.precioCompra,
    current_price: precioActual,
    quantity: input.cantidad || 1,
    date: input.fecha || null,
    amount: input.precioCompra * (input.cantidad || 1),
  });
  if (error) throw error;
  revalidateAll();
}

export async function eliminarInversion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("fin_investments").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
}

// --- Crypto ---

export type CryptoInput = {
  nombre: string;
  simbolo: string;
  precioCompra: number;
  precioActual: number;
  cantidad: number;
  fecha: string;
};

export async function crearCrypto(input: CryptoInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const precioActual = input.precioActual || input.precioCompra;
  const { error } = await supabase.schema("personal").from("fin_crypto").insert({
    owner_id: ownerId,
    name: input.nombre,
    symbol: input.simbolo.toUpperCase(),
    purchase_price: input.precioCompra,
    current_price: precioActual,
    amount: input.cantidad || 0,
    date: input.fecha || null,
  });
  if (error) throw error;
  revalidateAll();
}

export async function eliminarCrypto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("fin_crypto").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
}

// --- Deudas ---

export type DeudaInput = {
  nombre: string;
  tipo: string;
  total: number;
  pendiente: number;
  cuota: number;
  interes: number;
};

export async function crearDeuda(input: DeudaInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("fin_debts").insert({
    owner_id: ownerId,
    name: input.nombre,
    type: input.tipo,
    amount: input.total,
    pending_amount: input.pendiente,
    monthly_payment: input.cuota,
    interest_rate: input.interes,
  });
  if (error) throw error;
  revalidateAll();
}

export async function eliminarDeuda(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("fin_debts").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
}

// --- Objetivos de ahorro ---

export type ObjetivoInput = {
  nombre: string;
  meta: number;
  actual: number;
  fecha: string;
  emoji: string;
};

export async function crearObjetivo(input: ObjetivoInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("fin_savings_goal").insert({
    owner_id: ownerId,
    name: input.nombre,
    target_amount: input.meta,
    current_amount: input.actual,
    target_date: input.fecha || null,
    emoji: input.emoji,
  });
  if (error) throw error;
  revalidateAll();
}

// Igual que abonar() del HTML: suma al ahorro actual con tope en la meta.
export async function abonarObjetivo(id: string, importe: number) {
  const supabase = await createClient();
  const { data: objetivo, error: fetchError } = await supabase
    .schema("personal")
    .from("fin_savings_goal")
    .select("current_amount, target_amount")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const nuevoActual = Math.min(objetivo.target_amount, objetivo.current_amount + importe);

  const { error } = await supabase.schema("personal").from("fin_savings_goal").update({ current_amount: nuevoActual }).eq("id", id);
  if (error) throw error;
  revalidateAll();
}

export async function eliminarObjetivo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("fin_savings_goal").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
}
