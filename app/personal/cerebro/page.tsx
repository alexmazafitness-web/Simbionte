import { listTasks } from "@/lib/personal/tasks-queries";
import { getGoal } from "@/lib/personal/goal-queries";
import { listEvents, listMarkedDates } from "@/lib/personal/events-queries";
import { MiDiaPageClient } from "@/components/shared/cerebro/MiDiaPageClient";

export default async function CerebroPage() {
  const [tasks, goal, events, marks] = await Promise.all([listTasks(), getGoal(), listEvents(), listMarkedDates()]);

  return <MiDiaPageClient tasks={tasks} goal={goal} marks={marks} events={events} />;
}
