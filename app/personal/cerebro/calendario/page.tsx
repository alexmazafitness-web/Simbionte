import { listEvents, listEventosUnicos, listMarkedDates } from "@/lib/personal/events-queries";
import { CalendarioPageClient } from "@/components/shared/cerebro/CalendarioPageClient";

export default async function CalendarioPage() {
  const [events, marks, eventosUnicos] = await Promise.all([listEvents(), listMarkedDates(), listEventosUnicos()]);
  return <CalendarioPageClient events={events} marks={marks} eventosUnicos={eventosUnicos} />;
}
