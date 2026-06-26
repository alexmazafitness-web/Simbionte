"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AjustesModal } from "./ajustes/AjustesModal";

type NavLink = { label: string; href: string };
type NavGroup = { label: string; icon: keyof typeof ICONS; links: NavLink[] };
type QuickLink = NavLink & { icon: keyof typeof ICONS };

const ICONS = {
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  funnel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M4 4h16l-6 8v6l-4 2v-8L4 4z" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 11l9-8 9 8M5 10v10h14V10" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  panel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M16 17l5-5-5-5M21 12H9M13 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8" />
    </svg>
  ),
};

const QUICK_LINKS: QuickLink[] = [
  { label: "Mi día", href: "/personal/cerebro", icon: "checkCircle" },
];

const GROUPS: NavGroup[] = [
  { label: "Captación", icon: "funnel", links: [{ label: "Leads", href: "/coaching/leads" }] },
  {
    label: "Personal",
    icon: "home",
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
    icon: "briefcase",
    links: [
      { label: "Clientes", href: "/coaching/clientes" },
      { label: "Pagos", href: "/coaching/pagos" },
      { label: "Revisiones", href: "/coaching/revisiones" },
      { label: "Mesociclos", href: "/coaching/mesociclos" },
      { label: "Tarifas", href: "/coaching/clientes/tarifas" },
      { label: "Dashboard", href: "/coaching/dashboard" },
      { label: "Ventas", href: "/coaching/ventas" },
      { label: "Contenido", href: "/coaching/contenido" },
      { label: "Negocio", href: "/coaching/negocio" },
    ],
  },
];

function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return <span className={`block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}>{ICONS[name]}</span>;
}

export function Sidebar({ name: initialName, email }: { name: string | null; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const [name, setName] = useState(initialName);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(GROUPS.filter((g) => g.links.some((l) => l.href === pathname)).map((g) => g.label)),
  );
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cierra al hacer click fuera, sin un backdrop superpuesto que pueda
  // competir en z-index con el propio menú y robarle el click al Link.
  useEffect(() => {
    if (!profileOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  function toggleGroup(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const showFull = !collapsed;

  function renderContent() {
    return (
      <>
        <div className="mb-6 flex items-center justify-between px-2">
          {showFull && <span className="font-heading text-lg font-semibold tracking-wide text-[#C9A96E]">Simbionte</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          >
            <Icon name="panel" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          <div className="mb-2 flex flex-col gap-1">
            {QUICK_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition ${
                    active ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]" : "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
                  }`}
                >
                  <Icon name={link.icon} />
                  {showFull && <span className="truncate">{link.label}</span>}
                </Link>
              );
            })}
          </div>

          <div className="my-1.5 h-px bg-white/10" />

          {GROUPS.map((group) => {
            const isExpanded = expanded.has(group.label);
            return (
              <div key={group.label} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => showFull && toggleGroup(group.label)}
                  title={group.label}
                  className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left text-[10px] font-semibold tracking-widest text-neutral-500 uppercase hover:text-neutral-300"
                >
                  <Icon name={group.icon} />
                  {showFull && (
                    <>
                      <span className="flex-1 truncate">{group.label}</span>
                      <Icon name="chevron" className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </>
                  )}
                </button>
                {showFull && isExpanded && (
                  <div className="flex flex-col gap-1">
                    {group.links.map((link) => {
                      const active = pathname === link.href;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`block rounded px-2 py-1.5 pl-8 text-sm transition ${
                            active ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div ref={profileRef} className="relative mt-2 border-t border-white/10 pt-3">
          {profileOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-lg border border-white/10 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  setAjustesOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Icon name="gear" />
                Ajustes
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-bad"
              >
                <Icon name="logout" />
                Cerrar sesión
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 hover:bg-neutral-900"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A96E] to-[#9a7c47] text-xs font-bold text-[#1a1208]">
              {name ? name[0]!.toUpperCase() : "?"}
            </span>
            {showFull && <span className="min-w-0 flex-1 truncate text-left text-[12.5px] text-neutral-300">{name ?? "Sin sesión"}</span>}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className={`relative flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
      <aside className="flex h-full w-full flex-col border-r border-white/10 bg-[#141414] px-3 py-6">{renderContent()}</aside>
      <AjustesModal open={ajustesOpen} onClose={() => setAjustesOpen(false)} name={name} email={email} onNameSaved={setName} />
    </div>
  );
}
