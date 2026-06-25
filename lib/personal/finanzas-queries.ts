import { createClient } from "@/lib/supabase/server";
import type { CryptoVM, DeudaVM, InversionVM, ObjetivoVM, TransaccionVM } from "./finanzas";

export async function listTransacciones(): Promise<TransaccionVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("fin_transactions")
    .select("id, type, amount, date, category, description")
    .order("date", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    tipo: row.type,
    importe: row.amount,
    fecha: row.date,
    categoria: row.category ?? "Otros",
    descripcion: row.description,
  }));
}

export async function listInversiones(): Promise<InversionVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("fin_investments")
    .select("id, name, type, purchase_price, current_price, quantity, date")
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    nombre: row.name,
    tipo: row.type ?? "Otro",
    precioCompra: row.purchase_price,
    precioActual: row.current_price,
    cantidad: row.quantity,
    fecha: row.date,
  }));
}

export async function listCrypto(): Promise<CryptoVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("fin_crypto")
    .select("id, name, symbol, purchase_price, current_price, amount, date")
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    nombre: row.name ?? row.symbol,
    simbolo: row.symbol,
    precioCompra: row.purchase_price,
    precioActual: row.current_price,
    cantidad: row.amount,
    fecha: row.date,
  }));
}

export async function listDeudas(): Promise<DeudaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("fin_debts")
    .select("id, name, type, amount, pending_amount, monthly_payment, interest_rate")
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    nombre: row.name,
    tipo: row.type,
    total: row.amount,
    pendiente: row.pending_amount,
    cuota: row.monthly_payment,
    interes: row.interest_rate ?? 0,
  }));
}

export async function listObjetivosAhorro(): Promise<ObjetivoVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("fin_savings_goal")
    .select("id, name, target_amount, current_amount, target_date, emoji")
    .order("created_at");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    nombre: row.name,
    meta: row.target_amount,
    actual: row.current_amount,
    fecha: row.target_date,
    emoji: row.emoji ?? "💰",
  }));
}
