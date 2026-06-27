"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AjustesModal } from "./ajustes/AjustesModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavLink    = { label: string; href: string };
type NavSubGroup = { label: string; links: NavLink[] };          // e.g. Cerebro
type NavItem    = NavLink | NavSubGroup;
type NavSection = { label: string; links: NavLink[] };           // labeled category inside Business

type GroupItems    = { label: string; icon: keyof typeof ICONS; items: NavItem[] };
type GroupSections = { label: string; icon: keyof typeof ICONS; sections: NavSection[] };
type NavGroup = GroupItems | GroupSections;

function hasItems(g: NavGroup): g is GroupItems       { return "items" in g; }
function isSubGroup(item: NavItem): item is NavSubGroup { return "links" in item; }

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS = {
  checkCircle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
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
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M16 17l5-5-5-5M21 12H9M13 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8" />
    </svg>
  ),
};

// ─── Nav data ─────────────────────────────────────────────────────────────────

const MI_DIA = { label: "Mi día", href: "/personal/cerebro", icon: "checkCircle" as const };

const GROUPS: NavGroup[] = [
  {
    label: "Personal",
    icon: "home",
    items: [
      {
        label: "Cerebro",
        links: [
          { label: "Tareas",           href: "/personal/cerebro/tareas" },
          { label: "Ideas",            href: "/personal/cerebro/ideas" },
          { label: "Recordatorios",    href: "/personal/cerebro/recordatorios" },
          { label: "Calendario",       href: "/personal/cerebro/calendario" },
          { label: "Knowledge",        href: "/personal/cerebro/knowledge" },
          { label: "El Norte",         href: "/personal/cerebro/norte" },
          { label: "Revisión semanal", href: "/personal/cerebro/revision" },
          { label: "Infra",            href: "/personal/cerebro/infra" },
        ],
      },
      { label: "Finanzas", href: "/personal/finanzas" },
    ],
  },
  {
    label: "Business",
    icon: "briefcase",
    sections: [
      {
        label: "Captación",
        links: [
          { label: "Leads",     href: "/coaching/leads" },
          { label: "Ventas",    href: "/coaching/ventas" },
          { label: "Contenido", href: "/coaching/contenido" },
          { label: "Negocio",   href: "/coaching/negocio" },
        ],
      },
      {
        label: "Onboarding",
        links: [],
      },
      {
        label: "Operativa",
        links: [
          { label: "Clientes",    href: "/coaching/clientes" },
          { label: "Pagos",       href: "/coaching/pagos" },
          { label: "Revisiones",  href: "/coaching/revisiones" },
          { label: "Mesociclos",  href: "/coaching/mesociclos" },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <span className={`block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}>
      {ICONS[name]}
    </span>
  );
}

function initExpanded(pathname: string): Set<string> {
  const keys = new Set<string>();
  for (const group of GROUPS) {
    let groupActive = false;
    if (hasItems(group)) {
      for (const item of group.items) {
        if (isSubGroup(item)) {
          if (item.links.some((l) => l.href === pathname)) {
            keys.add(item.label);
            groupActive = true;
          }
        } else if (item.href === pathname) {
          groupActive = true;
        }
      }
    } else {
      groupActive = group.sections.some((s) => s.links.some((l) => l.href === pathname));
    }
    if (groupActive) keys.add(group.label);
  }
  return keys;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({ name: initialName, email }: { name: string | null; email: string | null }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [name,        setName]        = useState(initialName);
  const [expanded,    setExpanded]    = useState<Set<string>>(() => initExpanded(pathname));
  const [collapsed,   setCollapsed]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  function toggle(label: string) {
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

  // ─── Render helpers ───────────────────────────────────────────────────────

  function renderGroupItems(group: GroupItems) {
    const groupExpanded = expanded.has(group.label);
    return (
      <div key={group.label} className="mb-0.5">
        <button
          type="button"
          onClick={() => showFull && toggle(group.label)}
          title={group.label}
          className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left text-[10px] font-semibold tracking-widest text-neutral-500 uppercase hover:text-neutral-300"
        >
          <Icon name={group.icon} />
          {showFull && (
            <>
              <span className="flex-1 truncate">{group.label}</span>
              <Icon name="chevron" className={`transition-transform ${groupExpanded ? "rotate-90" : ""}`} />
            </>
          )}
        </button>

        {showFull && groupExpanded && (
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              if (isSubGroup(item)) {
                const subExpanded = expanded.has(item.label);
                return (
                  <div key={item.label}>
                    <button
                      type="button"
                      onClick={() => toggle(item.label)}
                      className="mt-1 flex w-full items-center gap-1 rounded py-1 pl-8 pr-2 text-left text-[9px] font-bold tracking-[0.25em] text-neutral-600 uppercase hover:text-neutral-400"
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      <Icon name="chevron" className={`h-[13px] w-[13px] transition-transform ${subExpanded ? "rotate-90" : ""}`} />
                    </button>
                    {subExpanded && (
                      <div className="flex flex-col gap-0.5">
                        {item.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`block rounded px-2 py-1.5 pl-12 text-[12.5px] transition ${
                              pathname === link.href
                                ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                            }`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded px-2 py-1.5 pl-8 text-[12.5px] transition ${
                    pathname === item.href
                      ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderGroupSections(group: GroupSections) {
    const groupExpanded = expanded.has(group.label);
    return (
      <div key={group.label} className="mb-0.5">
        <button
          type="button"
          onClick={() => showFull && toggle(group.label)}
          title={group.label}
          className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left text-[10px] font-semibold tracking-widest text-neutral-500 uppercase hover:text-neutral-300"
        >
          <Icon name={group.icon} />
          {showFull && (
            <>
              <span className="flex-1 truncate">{group.label}</span>
              <Icon name="chevron" className={`transition-transform ${groupExpanded ? "rotate-90" : ""}`} />
            </>
          )}
        </button>

        {showFull && groupExpanded && (
          <div className="flex flex-col">
            {group.sections.map((section, sIdx) => (
              <div key={section.label}>
                {/* Section label — static divider, not interactive */}
                <div
                  className={`cursor-default select-none pl-8 pb-0.5 text-[9px] font-bold tracking-[0.25em] text-neutral-700 uppercase ${
                    sIdx === 0 ? "pt-2" : "mt-2 border-t border-white/[0.06] pt-3"
                  }`}
                >
                  {section.label}
                </div>
                {section.links.length === 0 ? (
                  <p className="py-1 pl-12 text-[12px] italic text-neutral-700">Próximamente</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block rounded py-1.5 pl-12 pr-2 text-[12.5px] transition ${
                          pathname === link.href
                            ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                            : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <div className={`relative flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
      <aside className="flex h-full w-full flex-col border-r border-white/10 bg-[#141414] px-3 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between px-2">
          {showFull && (
            <span className="font-heading text-lg font-semibold tracking-wide text-[#C9A96E]">
              Simbionte
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
          >
            <Icon name="panel" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {/* 1 — MI DÍA */}
          <Link
            href={MI_DIA.href}
            title={MI_DIA.label}
            className={`mb-1 flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition ${
              pathname === MI_DIA.href
                ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                : "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
            }`}
          >
            <Icon name={MI_DIA.icon} />
            {showFull && <span className="truncate">{MI_DIA.label}</span>}
          </Link>

          <div className="my-1 h-px bg-white/10" />

          {/* 2 — PERSONAL  /  3 — BUSINESS */}
          {GROUPS.map((group) =>
            hasItems(group)
              ? renderGroupItems(group)
              : renderGroupSections(group),
          )}
        </nav>

        {/* Profile */}
        <div ref={profileRef} className="relative mt-2 border-t border-white/10 pt-3">
          {profileOpen && (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-48 rounded-lg border border-white/10 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50">
              <button
                type="button"
                onClick={() => { setProfileOpen(false); setAjustesOpen(true); }}
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
            {showFull && (
              <span className="min-w-0 flex-1 truncate text-left text-[12.5px] text-neutral-300">
                {name ?? "Sin sesión"}
              </span>
            )}
          </button>
        </div>
      </aside>

      <AjustesModal
        open={ajustesOpen}
        onClose={() => setAjustesOpen(false)}
        name={name}
        email={email}
        onNameSaved={setName}
      />
    </div>
  );
}
