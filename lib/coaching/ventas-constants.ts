// Guía estática del guion de llamada — contenido real de
// reference/script-videocall.html. No es un dato editable desde la UI,
// es la referencia que se consulta durante la llamada de venta.

export type FaseLlamadaId =
  | "pre_llamada"
  | "apertura"
  | "descubrimiento"
  | "amplificacion"
  | "vision"
  | "prescripcion"
  | "precio"
  | "objeciones"
  | "cierre";

export type BloqueGuion = {
  titulo: string;
  texto: string;
  nota?: string;
  destacado?: boolean;
};

export type Objecion = {
  titulo: string;
  tag: string;
  lectura: string;
  respuesta: string;
  notaRespuesta?: string;
};

export type FaseLlamada = {
  id: FaseLlamadaId;
  numero: number;
  nombre: string;
  tiempo: string | null;
  eyebrow: string;
  meta: string;
  objetivoPsicologico?: string;
  alerta?: { titulo: string; texto: string };
  badges?: { texto: string; variante: "ok" | "warn" }[];
  leadCard?: { label: string; valor: string }[];
  diagnostico?: { label: string; texto: string; destacado?: boolean }[];
  bloques: BloqueGuion[];
  advertencia?: { titulo: string; texto: string };
  objeciones?: Objecion[];
  notasEstrategicas?: string[];
};

export const FASES_LLAMADA: FaseLlamada[] = [
  {
    id: "pre_llamada",
    numero: 0,
    nombre: "Pre-llamada",
    tiempo: null,
    eyebrow: "Fase 0 · Preparación",
    meta: "Lead real · Formulario recibido el 13/06/2026",
    alerta: {
      titulo: "⚠ Alertas antes de la llamada",
      texto:
        "Menos de 1 año entrenando — perfil diferente al avatar principal. No encaja el caso Adil directamente.\nMujer, 35 años — ajustar tono y ejemplos. No asumir motivaciones típicas del avatar masculino.\nSin intentos previos estructurados — punto de partida limpio, pero puede tener más resistencia al compromiso.",
    },
    badges: [
      { texto: "Compromiso 10/10", variante: "ok" },
      { texto: "Disposición económica positiva", variante: "ok" },
      { texto: "Menos de 1 año entrenando", variante: "warn" },
    ],
    leadCard: [
      { label: "Nombre", valor: "Nastia Iglesias Jiménez" },
      { label: "Edad", valor: "35 años" },
      { label: "Tiempo entrenando", valor: "Menos de 1 año" },
      { label: "Objetivo", valor: "Reducir grasa corporal" },
      { label: "Intentos previos", valor: "Nada estructurado · Otro (a explorar en llamada)" },
      { label: "Obstáculo declarado", valor: "No especificado en formulario — explorar en llamada" },
      { label: "Detonante", valor: '"Quiero adelgazar y estar en forma y alimentarme correctamente"' },
      { label: "Compromiso", valor: "10/10" },
    ],
    diagnostico: [
      {
        label: "Perfil",
        texto:
          "Mujer de 35 años, menos de 1 año entrenando, sin estructura previa. Alta motivación declarada (10/10). Punto de partida limpio — nunca ha tenido dirección real. El detonante es genérico y hay que profundizar en llamada.",
      },
      {
        label: "Dolor principal",
        texto: "No sabe cómo adelgazar ni alimentarse correctamente. Nunca ha tenido un plan. El esfuerzo aún no ha empezado — el dolor es anticipatorio, no acumulado.",
      },
      {
        label: "Objeción más probable",
        texto: '"¿Esto funciona para mí?" — necesita ver que el servicio se adapta a alguien que empieza desde cero, no a un atleta avanzado.',
      },
      {
        label: "Detonante — profundizar en llamada",
        texto: '"Quiero adelgazar y estar en forma y alimentarme correctamente" — es el qué, no el por qué. En fase 3 hay que ir a la causa real: ¿qué ha pasado para que lo busque ahora?',
        destacado: true,
      },
    ],
    bloques: [
      {
        titulo: "TÚ (audio ~70s)",
        destacado: true,
        texto:
          'Hola Nastia, soy Alex Maza. Acabo de ver tu respuesta al formulario, en el que me indicas que tu objetivo es reducir grasa corporal, estar en forma y aprender a alimentarte correctamente. Bien.\n\nTe envío este audio porque me gustaría hacer una llamada contigo. La idea es entender bien tu situación y, si creo que puedo ayudarte, te cuento cómo trabajaríamos. Y si no, te lo digo igual de claro.\n\nLa llamada son unos 20-25 minutos. Y antes de que hablemos, quiero que pienses en la siguiente pregunta: ¿qué tendría que pasar en los próximos 6 meses para que dijeras que esto ha valido la pena? No me la tienes que responder — solo tenlo claro tú.\n\nAquí te dejo el enlace para agendar cuando mejor te encaje.',
        nota: "Ajusta el tono — más cercano y menos \"entreno de élite\". Nastia empieza desde cero y necesita sentir que el servicio es para ella.",
      },
    ],
  },
  {
    id: "apertura",
    numero: 1,
    nombre: "Apertura y marco",
    tiempo: "0–3'",
    eyebrow: "Fase 1 · 0–3 min",
    meta: "Establecer quién dirige. Tú diagnosticas, tú decides.",
    objetivoPsicologico:
      "Que sienta que esto es una consulta profesional, no una charla de ventas. Nastia no tiene experiencia previa con entrenadores — necesita entender el marco desde el principio.",
    bloques: [
      {
        titulo: "TÚ — apertura",
        texto:
          "Hola Nastia, ¿qué tal? Bueno, vamos al lío que sé que tienes tu tiempo.\n\nLa idea de la llamada es conocerte un poco, entender bien tu situación, y si veo que puedo ayudarte te cuento cómo lo haríamos. Y si veo que no, te lo digo igual de claro. ¿Te parece?",
      },
      {
        titulo: "TÚ — transición con formulario",
        destacado: true,
        texto:
          "Perfecto. Vi tu formulario antes de llamarte — tu objetivo es reducir grasa corporal y aprender a alimentarte bien. Pero cuéntame con tus palabras, ¿qué está pasando ahora mismo y qué te ha llevado a buscar ayuda?",
        nota: "La pregunta final es clave — el detonante del formulario es genérico. Necesitas la versión real en sus palabras.",
      },
    ],
  },
  {
    id: "descubrimiento",
    numero: 2,
    nombre: "Descubrimiento",
    tiempo: "3–12'",
    eyebrow: "Fase 2 · 3–12 min",
    meta: "Perfil diferente al avatar habitual — escucha activa doble.",
    objetivoPsicologico:
      'Nastia viene de cero — no tiene historial de fracasos acumulados como el avatar habitual. Su dolor es diferente: no es "llevo años sin resultados" sino "nunca he sabido por dónde empezar". Hay que encontrar esa narrativa.',
    bloques: [
      {
        titulo: "SITUACIÓN ACTUAL",
        destacado: true,
        texto: "¿Qué haces ahora mismo en cuanto a ejercicio y alimentación? ¿Tienes alguna rutina o vas un poco a lo que sale?",
        nota: 'No preguntes "cuánto tiempo llevas entrenando" — ya sabes que es menos de 1 año y puede ser incómodo. Pregunta por el hábito actual.',
      },
      {
        titulo: "HISTORIAL E INTENTOS",
        texto: "¿Has intentado antes cambiar tu alimentación o ponerte en forma de alguna forma? ¿Qué pasó?",
        nota: 'En el formulario marcó "Nada estructurado" y "Otro". Ese "otro" hay que explorarlo — puede ser una dieta, una app, o nada.',
      },
      {
        titulo: "AUTOPERCEPCIÓN",
        texto: "¿Y por qué crees que hasta ahora no has podido arrancar con algo que funcione?",
      },
      {
        titulo: "REFLEJO",
        texto: "O sea, llevas tiempo queriendo cambiar esto pero sin saber realmente por dónde empezar ni qué hacer… ¿es así?",
      },
    ],
    advertencia: {
      titulo: "Ojo con este perfil",
      texto: "No asumas que su dolor es físico/estético únicamente. A los 35 años puede haber motivaciones de salud, energía, autoconfianza. Deja que ella lo defina.",
    },
  },
  {
    id: "amplificacion",
    numero: 3,
    nombre: "Amplificación del coste",
    tiempo: "12–20'",
    eyebrow: "Fase 3 · 12–20 min",
    meta: "El detonante real está aquí — el formulario solo da la superficie.",
    objetivoPsicologico:
      'Nastia tiene 10/10 de compromiso declarado pero el detonante es vago. Aquí encontramos el "por qué ahora de verdad" — que es siempre más profundo que "quiero adelgazar".',
    bloques: [
      {
        titulo: "IMPACTO EMOCIONAL",
        texto: "¿Y cómo te afecta en el día a día no tener esto resuelto? No solo físicamente — en general.",
      },
      {
        titulo: "CUANTIFICAR",
        texto: "¿Cuánto tiempo llevas queriendo hacer este cambio y sin dar el paso?",
        nota: "Si lleva meses o años pensándolo, eso es tiempo perdido — y ella lo sabe.",
      },
      {
        titulo: "DETONANTE REAL — la pregunta más importante con Nastia",
        destacado: true,
        texto:
          "Me dices que quieres adelgazar y alimentarte mejor — pero eso lo queremos todos. ¿Qué ha pasado específicamente para que lo busques ahora, esta semana, y no hace seis meses?",
        nota: "Esta respuesta es tu cierre. Guárdala literalmente. Puede ser un evento, una foto, un problema de salud, una fecha importante.",
      },
      {
        titulo: "COSTE DE INACCIÓN",
        texto: "Si sigues exactamente igual que ahora dentro de un año, ¿cómo estás?",
      },
    ],
  },
  {
    id: "vision",
    numero: 4,
    nombre: "Visión y anclaje",
    tiempo: "20–25'",
    eyebrow: "Fase 4 · 20–25 min",
    meta: "Construir el punto B en sus palabras.",
    objetivoPsicologico: "Nastia tiene motivación alta pero el punto B no está definido. Aquí lo construimos juntos — y se lo apropiamos a ella, no a nosotros.",
    bloques: [
      {
        titulo: "TÚ — visión",
        texto:
          "Vale, y si esto funcionara de verdad — si en 6 meses tuvieras claro cómo comer, te sintieras bien con tu cuerpo y tuvieras energía — ¿cómo sería eso para ti? ¿Qué cambiaría?",
      },
      {
        titulo: "TÚ — capa profunda",
        texto: "Y más allá de lo físico, ¿qué significaría eso para ti en tu vida?",
        nota: "Con Nastia esto puede ir a autoconfianza, salud a largo plazo, energía para el día a día. Deja que lo diga ella.",
      },
      {
        titulo: "ANCLA DE COMPROMISO",
        destacado: true,
        texto: "Del 1 al 10, ¿cómo de importante es para ti conseguir esto ahora?",
        nota: "Ya sabemos que puso 10 en el formulario. Si confirma el 10, es tu ancla para objeciones.",
      },
      {
        titulo: "PUENTE AL PITCH",
        destacado: true,
        texto:
          "Me alegra escuchar eso. Por todo lo que me has contado — [su detonante real] — lo que te falta no es motivación, está clarísima. Lo que te falta es saber exactamente qué hacer, cómo comer, cómo entrenar, y tener a alguien que lo esté ajustando contigo. Déjame contarte cómo trabajaría contigo.",
      },
    ],
  },
  {
    id: "prescripcion",
    numero: 5,
    nombre: "Prescripción",
    tiempo: "25–33'",
    eyebrow: "Fase 5 · 25–33 min",
    meta: "Pitch adaptado a alguien que empieza desde cero.",
    objetivoPsicologico:
      "Nastia no necesita saber que puedes entrenar a atletas avanzados — necesita saber que puedes llevar a alguien desde cero a resultados reales. Cada bloque conecta con su situación específica.",
    bloques: [
      {
        titulo: "BLOQUE 1 — Plan desde cero",
        texto:
          "Lo primero que hacemos es diseñar tu plan desde cero — entrenamiento y nutrición adaptados a ti, a tu vida, a lo que puedes hacer ahora mismo. No una dieta genérica de internet — algo tuyo, que funcione para tu cuerpo y tu ritmo.",
        nota: "Conecta con: nunca ha tenido estructura, viene de \"nada estructurado\".",
      },
      {
        titulo: "BLOQUE 2 — Aprende mientras avanzas",
        texto:
          "Y no solo te doy el plan — te explico el porqué de cada cosa. Así no dependes de mí para siempre, sino que vas entendiendo cómo funciona tu cuerpo. Cada dos semanas revisamos, ajustamos, y avanzamos juntos.",
        nota: 'Conecta con: "alimentarme correctamente" — quiere entender, no solo seguir órdenes.',
      },
      {
        titulo: "BLOQUE 3 — Acceso directo",
        texto:
          "Y tienes acceso directo a mí por WhatsApp para cualquier duda. Si no sabes qué pedir en un restaurante, si un día no puedes entrenar — me escribes y te digo exactamente qué hacer.",
      },
    ],
    advertencia: {
      titulo: "No uses el caso Adil aquí",
      texto: "Adil es un hombre joven que ya entrenaba. Nastia no se identificará. Si tienes algún caso de mujer o de alguien que empezó desde cero, úsalo. Si no, omite la prueba social o descríbela de forma más genérica.",
    },
  },
  {
    id: "precio",
    numero: 6,
    nombre: "Precio",
    tiempo: "33–35'",
    eyebrow: "Fase 6 · 33–35 min",
    meta: "Seguridad total. Sin justificaciones.",
    objetivoPsicologico:
      'Nastia tiene disposición económica positiva ("Sí, si me convence"). Ya está convencida si has hecho bien las fases anteriores. El precio es el último paso lógico.',
    bloques: [
      {
        titulo: "ANCLAJE",
        texto:
          "Mira, la mayoría de personas que llevan tiempo queriendo hacer este cambio lo van posponiendo — y pasan meses o años sin avanzar. Lo que yo ofrezco es que en los próximos meses tengas resultados reales, no otro intento más.",
      },
      {
        titulo: "OPCIONES",
        destacado: true,
        texto:
          "Trabajo de tres formas. La opción mensual son 115€ al mes. La trimestral son 300€ — que es la que más gente elige porque es donde realmente se empieza a ver el cambio, y sale a 100€ al mes. Y si quieres el mayor compromiso, el semestral son 570€.",
      },
      {
        titulo: "",
        texto: "Silencio después del precio. No justifiques. No rellenes. El primero que habla pierde.",
      },
    ],
  },
  {
    id: "objeciones",
    numero: 7,
    nombre: "Objeciones",
    tiempo: "35–42'",
    eyebrow: "Fase 7 · 35–42 min",
    meta: "Preguntar, nunca rebatir.",
    objetivoPsicologico:
      "Nastia tiene 10/10 de compromiso y disposición positiva. Su objeción más probable no es precio — es incertidumbre sobre si esto funcionará para alguien como ella.",
    bloques: [],
    objeciones: [
      {
        titulo: '"¿Esto funciona para alguien que empieza desde cero?"',
        tag: "Más probable",
        lectura: "Inseguridad sobre si el servicio es para ella. No es resistencia al precio — es necesidad de identificación.",
        respuesta:
          "De hecho, los mejores resultados los veo con personas que empiezan sin hábitos previos — porque no hay nada que desaprender. Partimos de cero y construimos bien desde el principio. Es mucho más fácil que corregir años de malos hábitos.",
      },
      {
        titulo: '"Me lo tengo que pensar"',
        tag: "Frecuente",
        lectura: "Con un 10/10 de compromiso declarado, esta objeción indica que algo no ha quedado claro en la llamada.",
        respuesta: "Claro. ¿Qué es exactamente lo que necesitas pensar?",
        notaRespuesta:
          'SI SE QUEDA VAGA: "Me dijiste que esto era un 10 de importancia para ti. Y me contaste que llevas tiempo queriendo hacer este cambio. ¿Qué haría falta para que lo tuvieras claro hoy?"',
      },
      {
        titulo: '"Es caro"',
        tag: "Posible",
        lectura: "Tiene disposición positiva pero puede que el precio le parezca alto al no tener referencia previa de este tipo de servicio.",
        respuesta: 'Lo entiendo. Dime — si el precio no fuera un tema, ¿lo harías? → Si dice sí: "¿El mensual lo ves más manejable como punto de partida?"',
        notaRespuesta: "El mensual existe para esto. Mejor cliente mensual que no cliente.",
      },
    ],
  },
  {
    id: "cierre",
    numero: 8,
    nombre: "Cierre",
    tiempo: "42–45'",
    eyebrow: "Fase 8 · 42–45 min",
    meta: "Siguiente paso concreto. Pago dentro de la llamada.",
    objetivoPsicologico: "Nastia tiene motivación alta y disposición positiva. Si las fases anteriores fueron bien, el cierre es el paso lógico — no hay que empujar, hay que facilitar.",
    bloques: [
      {
        titulo: "TÚ",
        destacado: true,
        texto: "Pues si lo ves claro, lo ponemos en marcha ya. ¿Con qué opción te quedas?",
      },
      {
        titulo: "DESPUÉS DEL SÍ",
        texto: "Perfecto. Ahora mismo te mando el enlace de pago. En cuanto lo vea hecho, esta semana te mando el formulario de inicio y empezamos a preparar tu plan.",
      },
      {
        titulo: "SI NO CIERRA EN LLAMADA",
        texto: "No hay problema. ¿Cuándo crees que lo tendrás decidido? El [día concreto] te escribo para ver cómo lo tienes.",
      },
    ],
    notasEstrategicas: [
      "Perfil fuera del avatar habitual — mujer, 35 años, menos de 1 año entrenando. Adapta el lenguaje y los ejemplos.",
      'El detonante del formulario es genérico. La fase 3 es crítica para encontrar el "por qué ahora" real.',
      "No usar caso Adil — no se identifica. Si tienes caso de mujer o principiante, úsalo aquí.",
      "Compromiso 10/10 y disposición positiva — lead caliente. Si objeta, el problema es incertidumbre sobre si funciona para ella, no precio.",
      "Contacto: nastia9138@gmail.com · +34 697 115 683",
    ],
  },
];

export const FASE_LLAMADA_LABEL: Record<FaseLlamadaId, string> = Object.fromEntries(
  FASES_LLAMADA.map((f) => [f.id, f.nombre]),
) as Record<FaseLlamadaId, string>;
