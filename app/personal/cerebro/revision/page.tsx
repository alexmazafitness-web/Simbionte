import { getDatosRevisionSemanal, getRevisionActual, getHistorialRevisiones } from "@/lib/personal/revision-queries";
import { getWeekBounds } from "@/lib/personal/revision";
import { RevisionPageClient } from "@/components/shared/cerebro/RevisionPageClient";

export default async function RevisionPage() {
  const { inicio, fin } = getWeekBounds();

  const [datosAuto, revisionActual, historial] = await Promise.all([
    getDatosRevisionSemanal(),
    getRevisionActual(),
    getHistorialRevisiones(6),
  ]);

  return (
    <RevisionPageClient
      datosAuto={datosAuto}
      revisionActual={revisionActual}
      historial={historial}
      semanaInicio={inicio}
      semanaFin={fin}
    />
  );
}
