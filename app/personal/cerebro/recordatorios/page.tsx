import { listReminders } from "@/lib/personal/reminders-queries";
import { RecordatoriosPageClient } from "@/components/shared/cerebro/RecordatoriosPageClient";

export default async function RecordatoriosPage() {
  const reminders = await listReminders();
  return <RecordatoriosPageClient reminders={reminders} />;
}
