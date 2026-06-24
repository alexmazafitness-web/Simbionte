import { listClientes } from "@/lib/coaching/clientes-queries";
import { MesociclosList } from "@/components/shared/clientes/MesociclosList";

export default async function MesociclosPage() {
  const clientes = await listClientes();
  return <MesociclosList clientes={clientes} />;
}
