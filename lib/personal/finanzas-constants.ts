export const CAT_GASTOS = [
  "Vivienda", "Alimentación", "Transporte", "Salud", "Ocio",
  "Ropa", "Educación", "Restaurantes", "Suscripciones", "Seguros", "Otros",
];

export const CAT_INGRESOS = ["Salario", "Freelance", "Negocio coaching", "Inversiones", "Dividendos", "Alquiler", "Otros"];

export const INV_TIPOS = ["ETF", "Acción", "Fondo", "Bono", "Otro"] as const;
export type InvTipo = (typeof INV_TIPOS)[number];

export const DEBT_TIPOS = ["Hipoteca", "Préstamo personal", "Préstamo coche", "Tarjeta crédito", "Otro"] as const;
export type DebtTipo = (typeof DEBT_TIPOS)[number];

export const OBJ_EMOJIS = [
  { value: "🏠", label: "🏠 Casa" },
  { value: "✈️", label: "✈️ Viaje" },
  { value: "🚗", label: "🚗 Coche" },
  { value: "🛡️", label: "🛡️ Emergencia" },
  { value: "💻", label: "💻 Tecnología" },
  { value: "🎓", label: "🎓 Educación" },
  { value: "💍", label: "💍 Boda" },
  { value: "💰", label: "💰 Ahorro general" },
];

export const PERIODOS = [
  { value: "este_mes", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "trimestre", label: "Último trimestre" },
  { value: "anio", label: "Este año" },
  { value: "todo", label: "Todo" },
] as const;
export type Periodo = (typeof PERIODOS)[number]["value"];
