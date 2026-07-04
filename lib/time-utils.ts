// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ SIEMPRE hora local - nunca UTC ⚠️
//
// Punto único de verdad para la hora "de pared" del usuario. La posición de la
// línea de hora actual del calendario (y cualquier cálculo de "ahora") debe
// salir de aquí. Prohibido getUTC*, toISOString().slice(...) u offsets
// manuales de timezone: el servidor (Vercel) corre en UTC y el usuario no.
//
// Este bug ha reaparecido varias veces. Si la línea de hora vuelve a
// desviarse, este archivo es el único sitio donde tocar el cálculo.
// ─────────────────────────────────────────────────────────────────────────────

/** Minutos transcurridos desde la medianoche LOCAL del dispositivo (0–1439). */
export function getNowMinutes(): number {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}
