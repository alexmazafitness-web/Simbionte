import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente con la service_role key: solo para contextos SIN sesión de
// usuario (cron jobs). Bypassa RLS por completo — nunca importar esto
// desde código que pueda ejecutarse con datos/intención del cliente, y
// nunca exponer SUPABASE_SERVICE_ROLE_KEY con el prefijo NEXT_PUBLIC_.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
