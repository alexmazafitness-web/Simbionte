"use client";

import { useRouter } from "next/navigation";
import { ActionQueue } from "@/components/shared/clientes/ActionQueue";
import type { ClienteVM } from "@/lib/coaching/clientes";

// Envoltorio fino de ActionQueue para la portada "Hoy": mismo componente,
// mismo cálculo de la cola, pero en modo solo lectura — sin handlers de
// mutación, y un clic en una fila lleva al módulo Clientes en vez de abrir
// el drawer (que solo existe en /coaching/clientes).
export function HoyAccionesQueue({ clientes }: { clientes: ClienteVM[] }) {
  const router = useRouter();
  return <ActionQueue clientes={clientes} onOpenDrawer={() => router.push("/coaching/clientes")} />;
}
