import { exportarTodosLosDatos } from "@/lib/ajustes/export-queries";

export async function GET() {
  const backup = await exportarTodosLosDatos();
  const fecha = backup.exportedAt.slice(0, 10);

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="simbionte-backup-${fecha}.json"`,
    },
  });
}
