import { listEvents, listMarkedDates } from "@/lib/personal/events-queries";
import { CalendarioPageClient } from "@/components/shared/cerebro/CalendarioPageClient";

export default async function CalendarioPage() {
  const [events, marks] = await Promise.all([listEvents(), listMarkedDates()]);
  return <CalendarioPageClient events={events} marks={marks} />;
}
