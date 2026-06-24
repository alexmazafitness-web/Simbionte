import { listLeads } from "@/lib/coaching/leads";
import { LeadsPageClient } from "@/components/shared/leads/LeadsPageClient";

export default async function LeadsPage() {
  const leads = await listLeads();
  return <LeadsPageClient leads={leads} />;
}
