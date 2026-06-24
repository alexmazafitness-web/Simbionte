import { listClientes } from "@/lib/coaching/clientes-queries";
import { PagosView } from "@/components/shared/clientes/PagosView";

export default async function PagosPage() {
  const clientes = await listClientes();
  return <PagosView clientes={clientes} />;
}
