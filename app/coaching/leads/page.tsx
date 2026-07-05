import { listLeads } from "@/lib/coaching/leads";
import { listLeadContextos } from "@/lib/coaching/lead-contexto-queries";
import { LeadsPageClient } from "@/components/shared/leads/LeadsPageClient";

export default async function LeadsPage() {
  const [leads, leadContextos] = await Promise.all([listLeads(), listLeadContextos()]);
  return <LeadsPageClient leads={leads} leadContextos={leadContextos} />;
}
