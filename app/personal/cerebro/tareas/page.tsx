import { listTasks } from "@/lib/personal/tasks-queries";
import { TareasPageClient } from "@/components/shared/cerebro/TareasPageClient";

export default async function TareasPage() {
  const tasks = await listTasks();
  return <TareasPageClient tasks={tasks} />;
}
