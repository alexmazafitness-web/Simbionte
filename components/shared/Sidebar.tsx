"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { label: string; href: string };
type NavGroup = { label: string; links: NavLink[] };

const GROUPS: NavGroup[] = [
  { label: "Inicio", links: [{ label: "Hoy", href: "/" }] },
  { label: "Captación", links: [{ label: "Leads", href: "/coaching/leads" }] },
  {
    label: "Personal",
    links: [
      { label: "Mi día", href: "/personal/cerebro" },
      { label: "Tareas", href: "/personal/cerebro/tareas" },
      { label: "Ideas", href: "/personal/cerebro/ideas" },
      { label: "Recordatorios", href: "/personal/cerebro/recordatorios" },
      { label: "El Norte", href: "/personal/cerebro/norte" },
      { label: "Calendario", href: "/personal/cerebro/calendario" },
      { label: "Knowledge", href: "/personal/cerebro/knowledge" },
      { label: "Infra", href: "/personal/cerebro/infra" },
      { label: "Revisión", href: "/personal/cerebro/revision" },
      { label: "Finanzas", href: "/personal/finanzas" },
      { label: "Transacciones", href: "/personal/finanzas/transacciones" },
      { label: "Inversiones", href: "/personal/finanzas/inversiones" },
      { label: "Crypto", href: "/personal/finanzas/crypto" },
      { label: "Ahorro", href: "/personal/finanzas/ahorro" },
      { label: "Deudas", href: "/personal/finanzas/deudas" },
    ],
  },
  {
    label: "Coaching",
    links: [
      { label: "Clientes", href: "/coaching/clientes" },
      { label: "Revisiones", href: "/coaching/revisiones" },
      { label: "Pagos", href: "/coaching/pagos" },
      { label: "Mesociclos", href: "/coaching/mesociclos" },
      { label: "Tarifas", href: "/coaching/clientes/tarifas" },
      { label: "Dashboard", href: "/coaching/dashboard" },
    ],
  },
  { label: "Ajustes", links: [] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-white/10 bg-[#141414] px-4 py-6">
      <span className="mb-8 px-2 font-heading text-lg font-semibold tracking-wide text-[#C9A96E]">Simbionte</span>
      <nav className="flex flex-col gap-1">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            <span className="block px-2 py-2 text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
              {group.label}
            </span>
            {group.links.length === 0 ? (
              <span className="block px-2 py-1.5 text-sm text-neutral-600 italic">Próximamente</span>
            ) : (
              group.links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded px-2 py-1.5 text-sm transition ${
                      active ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
