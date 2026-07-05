// Checklist de cuenta — contenido real de reference/auditoria_ig.html.
// Las etiquetas no cambian (son texto de diagnóstico fijo de @_alexmaza);
// solo el booleano "checked" de cada clave se persiste en BD.

export type ChecklistDef = {
  key: string;
  seccion: "diagnostico" | "perfil";
  titulo: string;
  sub: string;
  detalle?: string;
};

export const CHECKLIST_DEFS: ChecklistDef[] = [
  {
    key: "diag-bio",
    seccion: "diagnostico",
    titulo: "Bio sin diferenciar",
    sub: '"Gana músculo y pierde grasa sin perder el tiempo" — lo dicen 50.000 cuentas. No frena el scroll del visitante.',
    detalle:
      "Bio actual aprobada: \"🇪🇸 | Entrenador Online · 🎯 | Te ayudo a verte como un atleta, sin perder el tiempo y con un plan definido 👇\". Nombre indexable: Alex Maza | Entrenador Online 🇪🇸 — buscable y sin redundancia con la bio.",
  },
  {
    key: "diag-destacados",
    seccion: "diagnostico",
    titulo: "Destacados que no venden",
    sub: '"ETTO" (bicis), una cruz morada y un coche no comunican nada de tu servicio. Cada visita interesada que los mira, se va sin entender qué haces.',
    detalle:
      "Estructura definitiva: Empieza aquí → Transformaciones → Qué dicen → El proceso → Sobre mí. Cada uno responde una pregunta de venta concreta.",
  },
  {
    key: "diag-feed",
    seccion: "diagnostico",
    titulo: "Feed sin prueba social",
    sub: '15 publicaciones, ninguna muestra un cliente, un resultado o un testimonio. El feed dice "cuenta de tips de fitness", no "coach con clientes reales".',
    detalle:
      "Acción: fijar 3 publicaciones arriba — mejor reel educativo, un caso de cliente (cuando haya material), y un carrusel tipo \"empieza aquí\". Intercalar 1 pieza de cliente cada 3-4 reels educativos.",
  },
  {
    key: "perfil-bio",
    seccion: "perfil",
    titulo: "Bio reescrita y aprobada",
    sub: 'Promesa concreta + objeción rota ("sin perder el tiempo, con un plan definido") + CTA claro.',
  },
  {
    key: "perfil-seguidos",
    seccion: "perfil",
    titulo: 'Bajar "seguidos" por debajo de 100',
    sub: "183 actuales. Reduce para reforzar autoridad visual de cuenta profesional.",
  },
  {
    key: "perfil-pin",
    seccion: "perfil",
    titulo: "Fijar 3 publicaciones de bienvenida",
    sub: 'Reel educativo top + carrusel "empieza aquí" + caso de cliente (cuando exista material).',
  },
  {
    key: "perfil-titulacion",
    seccion: "perfil",
    titulo: 'No usar "dietista" hasta tener el título',
    sub: 'Profesión regulada en España. "Entrenamiento y nutrición" describe el servicio sin riesgo de intrusismo. Revisar cuando termines la formación.',
  },
];

