import { Suspense } from "react";
import Link from "next/link";
import { listTasks } from "@/lib/personal/tasks-queries";
import { taskShowToday } from "@/lib/personal/tasks";
import { listReminders } from "@/lib/personal/reminders-queries";
import { recordatoriosHoy } from "@/lib/personal/reminders";
import { dowOf, todayISO } from "@/lib/personal/format";
import { listClientes } from "@/lib/coaching/clientes-queries";
import { listTransacciones } from "@/lib/personal/finanzas-queries";
import { filterPeriodo, fmtEUR } from "@/lib/personal/finanzas";
import { FrontChip } from "@/components/shared/cerebro/FrontChip";
import { HoyAccionesQueue } from "@/components/shared/HoyAccionesQueue";

async function cargarOVacio<T>(promesa: Promise<T[]>, etiqueta: string): Promise<T[]> {
  try {
    return await promesa;
  } catch (error) {
    console.error(`[Hoy] no se pudo cargar "${etiqueta}":`, error);
    return [];
  }
}

// ─── Secciones asíncronas independientes ──────────────────────────────────────

async function AccionesSection() {
  const clientes = await cargarOVacio(listClientes(), "clientes (coaching)");
  return <HoyAccionesQueue clientes={clientes} />;
}

async function TareasSection({ hoy, dow }: { hoy: string; dow: number }) {
  const tasks = await cargarOVacio(listTasks(), "tareas");
  const tareasHoy = tasks.filter((t) => taskShowToday(t, hoy, dow));
  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Tareas de hoy
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2 py-0.5 font-display text-[12px] text-gold-bright">
          {tareasHoy.length}
        </span>
        <span className="h-px flex-1 bg-line" />
        <Link href="/personal/cerebro/tareas" className="text-[11px] font-semibold text-gold-dim hover:text-gold-bright">
          Ver todas →
        </Link>
      </div>
      {tareasHoy.length === 0 ? (
        <p className="text-sm text-text-dim">Nada pendiente para hoy.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tareasHoy.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-line-soft bg-panel px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{t.title}</span>
              <FrontChip front={t.front} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function RecordatoriosSection({ hoy }: { hoy: string }) {
  const reminders = await cargarOVacio(listReminders(), "recordatorios");
  const recHoy = recordatoriosHoy(reminders);
  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Recordatorios de hoy
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2 py-0.5 font-display text-[12px] text-gold-bright">
          {recHoy.length}
        </span>
        <span className="h-px flex-1 bg-line" />
        <Link href="/personal/cerebro/recordatorios" className="text-[11px] font-semibold text-gold-dim hover:text-gold-bright">
          Ver todos →
        </Link>
      </div>
      {recHoy.length === 0 ? (
        <p className="text-sm text-text-dim">Sin recordatorios para hoy.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {recHoy.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 rounded-lg border border-line-soft bg-panel px-3.5 py-2.5">
              <span className="text-[12px] text-text-dim">
                {new Date(r.whenISO).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{r.text}</span>
              <FrontChip front={r.front} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

async function FinanzasSection() {
  const transacciones = await cargarOVacio(listTransacciones(), "transacciones");
  const delMes = filterPeriodo(transacciones, "este_mes");
  const ingresos = delMes.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.importe, 0);
  const gastos = delMes.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.importe, 0);
  const balance = ingresos - gastos;
  return (
    <div className="flex items-center gap-6 rounded-xl border border-line-soft bg-panel px-5 py-4">
      <div>
        <div className="text-[10px] tracking-wide text-text-dim uppercase">Balance este mes</div>
        <div className={`font-display text-3xl ${balance >= 0 ? "text-ok" : "text-bad"}`}>{fmtEUR(balance)}</div>
      </div>
      <div className="h-8 w-px bg-line-soft" />
      <div className="text-[12.5px] text-text-dim">
        {fmtEUR(ingresos)} ingresos · {fmtEUR(gastos)} gastos
      </div>
    </div>
  );
}

// ─── Skeletons inline ──────────────────────────────────────────────────────────

function AccionesSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-11 rounded-lg bg-neutral-800/70" />
      ))}
    </div>
  );
}

function ListaSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      <div className="mb-3.5 h-3 w-32 rounded bg-neutral-800" />
      {[1, 2].map((i) => (
        <div key={i} className="h-11 rounded-lg bg-neutral-800/70" />
      ))}
    </div>
  );
}

function FinanzasSkeleton() {
  return <div className="animate-pulse h-20 rounded-xl bg-neutral-800/70" />;
}

// ─── Portada ──────────────────────────────────────────────────────────────────

export default function Home() {
  const hoy = todayISO();
  const dow = dowOf(hoy);
  const fecha = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-10 py-10">
      <span className="text-sm text-text-dim capitalize">{fecha}</span>
      <h1 className="mb-8 font-display text-6xl tracking-wide text-gold">Hoy</h1>

      <div className="mb-10">
        <div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Acciones de Coaching
          <span className="h-px flex-1 bg-line" />
          <Link href="/coaching/clientes" className="text-[11px] font-semibold text-gold-dim hover:text-gold-bright">
            Ver clientes →
          </Link>
        </div>
        <Suspense fallback={<AccionesSkeleton />}>
          <AccionesSection />
        </Suspense>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-8">
        <Suspense fallback={<ListaSkeleton />}>
          <TareasSection hoy={hoy} dow={dow} />
        </Suspense>
        <Suspense fallback={<ListaSkeleton />}>
          <RecordatoriosSection hoy={hoy} />
        </Suspense>
      </div>

      <div>
        <div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Finanzas
          <span className="h-px flex-1 bg-line" />
          <Link href="/personal/finanzas" className="text-[11px] font-semibold text-gold-dim hover:text-gold-bright">
            Ver finanzas →
          </Link>
        </div>
        <Suspense fallback={<FinanzasSkeleton />}>
          <FinanzasSection />
        </Suspense>
      </div>
    </div>
  );
}
