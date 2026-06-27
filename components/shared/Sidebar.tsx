"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AjustesModal } from "./ajustes/AjustesModal";
import { EditSidebarModal } from "./sidebar/EditSidebarModal";
import { buildSectionVMs, type SidebarData } from "@/lib/personal/sidebar";

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
  pencil: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

type IconName = keyof typeof ICONS;

function Icon({ name, className }: { name: IconName | string; className?: string }) {
  const icon = ICONS[name as IconName];
  if (icon) {
    return <span className={`block h-[18px] w-[18px] shrink-0 ${className ?? ""}`}>{icon}</span>;
  }
  // emoji / text icon
  return <span className={`shrink-0 text-base leading-none ${className ?? ""}`}>{name}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar({
  name: initialName,
  email,
  sidebarData: initialData,
}: {
  name: string | null;
  email: string | null;
  sidebarData: SidebarData;
}) {
  const pathname    = usePathname();
  const router      = useRouter();

  const [name,        setName]        = useState(initialName);
  const [sidebarData, setSidebarData] = useState(initialData);
  const [collapsed,   setCollapsed]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ajustesOpen, setAjustesOpen] = useState(false);
  const [editOpen,    setEditOpen]    = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Track which section/subgroup is expanded, keyed by id
  const vms = buildSectionVMs(sidebarData);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const keys = new Set<string>();
    for (const vm of vms) {
      let sectionActive = false;
      for (const child of vm.children) {
        if (child.kind === "sub") {
          if (child.items.some((i) => i.ruta === pathname)) {
            keys.add(child.sub.id);
            sectionActive = true;
          }
        } else if (child.item.ruta === pathname) {
          sectionActive = true;
        }
      }
      if (sectionActive) keys.add(vm.section.id);
    }
    return keys;
  });

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

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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
  const activeVMs = buildSectionVMs(sidebarData);

  // ─── Render ───────────────────────────────────────────────────────────────

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
          {activeVMs.map((vm, vmIdx) => {
            const { section, children, isFlatLink } = vm;
            const sectionExpanded = expanded.has(section.id);

            // ── Flat link section (Mi día) ──
            if (isFlatLink && children[0]?.kind === "item") {
              const item = children[0].item;
              return (
                <div key={section.id}>
                  <Link
                    href={item.ruta}
                    title={item.nombre}
                    className={`mb-1 flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition ${
                      pathname === item.ruta
                        ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                        : "text-neutral-300 hover:bg-neutral-900 hover:text-neutral-100"
                    }`}
                  >
                    {section.icono && <Icon name={section.icono} />}
                    {showFull && <span className="truncate">{item.nombre}</span>}
                  </Link>
                  {vmIdx < activeVMs.length - 1 && (
                    <div className="my-1 h-px bg-white/10" />
                  )}
                </div>
              );
            }

            // ── Collapsible group section ──
            return (
              <div key={section.id} className="mb-0.5">
                <button
                  type="button"
                  onClick={() => showFull && toggle(section.id)}
                  title={section.nombre}
                  className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left text-[10px] font-semibold tracking-widest text-neutral-500 uppercase hover:text-neutral-300"
                >
                  {section.icono && <Icon name={section.icono} />}
                  {showFull && (
                    <>
                      <span className="flex-1 truncate">{section.nombre}</span>
                      <Icon name="chevron" className={`transition-transform ${sectionExpanded ? "rotate-90" : ""}`} />
                    </>
                  )}
                </button>

                {showFull && sectionExpanded && (
                  <div className="flex flex-col">
                    {children.map((child, cIdx) => {
                      // ── Subsection group ──
                      if (child.kind === "sub") {
                        const { sub, items: subItems } = child;
                        const subExpanded = expanded.has(sub.id);
                        const hasLinks = subItems.length > 0;

                        return (
                          <div key={sub.id}>
                            <button
                              type="button"
                              onClick={() => toggle(sub.id)}
                              className={`flex w-full items-center gap-1 pr-2 pb-0.5 pl-8 text-[9.5px] font-bold uppercase tracking-widest text-neutral-600 hover:text-neutral-400 ${
                                cIdx === 0 ? "pt-2" : "mt-2 border-t border-white/[0.06] pt-3"
                              }`}
                            >
                              <span className="flex-1 text-left">{sub.nombre}</span>
                              <Icon
                                name="chevron"
                                className={`h-[11px] w-[11px] transition-transform ${subExpanded ? "rotate-90" : ""}`}
                              />
                            </button>
                            {subExpanded && (
                              !hasLinks ? (
                                <p className="py-1 pl-12 text-[12px] italic text-neutral-700">Próximamente</p>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  {subItems.map((item) => (
                                    <Link
                                      key={item.id}
                                      href={item.ruta}
                                      className={`block rounded py-1.5 pl-12 pr-2 text-[12.5px] transition ${
                                        pathname === item.ruta
                                          ? "bg-[rgba(201,169,110,.14)] font-medium text-[#E2C892]"
                                          : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                                      }`}
                                    >
                                      {item.nombre}
                                    </Link>
                                  ))}
                                </div>
                              )
                            )}
                          </div>
                        );
                      }

                      // ── Direct item (no subsection) — shown as subsection label ──
                      const { item } = child;
                      return (
                        <div
                          key={item.id}
                          className={`cursor-default select-none pb-0.5 pl-8 text-[9.5px] font-bold uppercase tracking-widest text-neutral-600 ${
                            cIdx === 0 ? "pt-2" : "mt-2 border-t border-white/[0.06] pt-3"
                          }`}
                        >
                          {item.nombre}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Edit sidebar button */}
        {showFull && (
          <div className="mt-2 px-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex w-full items-center gap-2 rounded px-1 py-1 text-[11px] text-neutral-700 hover:text-neutral-400"
              title="Editar sidebar"
            >
              <Icon name="pencil" className="h-[14px] w-[14px]" />
              <span>Editar sidebar</span>
            </button>
          </div>
        )}

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

      <EditSidebarModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        data={sidebarData}
        onDataChange={setSidebarData}
      />
    </div>
  );
}
