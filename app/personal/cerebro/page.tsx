import { listTasks } from "@/lib/personal/tasks-queries";
import { getGoal } from "@/lib/personal/goal-queries";
import { listEvents, listEventosUnicos } from "@/lib/personal/events-queries";
import { listReminders } from "@/lib/personal/reminders-queries";
import { listClientes } from "@/lib/coaching/clientes-queries";
import { getVistaCalendario } from "@/lib/personal/meta-queries";
import { MiDiaPageClient } from "@/components/shared/cerebro/MiDiaPageClient";

async function safe<T>(p: Promise<T[]>): Promise<T[]> {
  try { return await p; } catch { return []; }
}

export default async function CerebroPage() {
  const [tasks, goal, events, eventosUnicos, reminders, clientes, savedVista] = await Promise.all([
    safe(listTasks()),
    getGoal(),
    safe(listEvents()),
    safe(listEventosUnicos()),
    safe(listReminders()),
    safe(listClientes()),
    getVistaCalendario().catch(() => "dia"),
  ]);

  return (
    <MiDiaPageClient
      tasks={tasks}
      goal={goal}
      events={events}
      eventosUnicos={eventosUnicos}
      reminders={reminders}
      clientes={clientes}
      initialVista={savedVista}
    />
  );
}
