import { listTasks } from "@/lib/personal/tasks-queries";
import { getGoal } from "@/lib/personal/goal-queries";
import { listEvents } from "@/lib/personal/events-queries";
import { listReminders } from "@/lib/personal/reminders-queries";
import { listClientes } from "@/lib/coaching/clientes-queries";
import { MiDiaPageClient } from "@/components/shared/cerebro/MiDiaPageClient";

async function safe<T>(p: Promise<T[]>): Promise<T[]> {
  try { return await p; } catch { return []; }
}

export default async function CerebroPage() {
  const [tasks, goal, events, reminders, clientes] = await Promise.all([
    safe(listTasks()),
    getGoal(),
    safe(listEvents()),
    safe(listReminders()),
    safe(listClientes()),
  ]);

  return (
    <MiDiaPageClient
      tasks={tasks}
      goal={goal}
      events={events}
      reminders={reminders}
      clientes={clientes}
    />
  );
}
