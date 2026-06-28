"use client";

import { useState, useTransition } from "react";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { notaToTituloTarea, type ClienteVM } from "@/lib/coaching/clientes";
import type { Categoria } from "@/lib/coaching/constants";
import type { GrupoRevision } from "@/lib/coaching/grupos";
import type { Tarifa } from "@/lib/coaching/tarifas";
import {
  crearCliente,
  crearNota,
  darBajaCliente,
  editarNota,
  eliminarCliente,
  eliminarNota,
  gestionarMesociclo,
  marcarCobroHecho,
  marcarRevisionHecha,
  reactivarCliente,
} from "@/lib/coaching/clientes-actions";
// Puente Cerebro ⇄ Clientes (docs/arquitectura-simbionte.md §6): se llama
// directamente a la acción de Tareas de Personal, sin tabla intermedia ni FK.
import { crearTarea } from "@/lib/personal/tasks-actions";
import { MrrHeader } from "./MrrHeader";
import { ActionQueue } from "./ActionQueue";
import { ClientesTable, type ClienteFiltro, type ClienteOrden } from "./ClientesTable";
import { Drawer } from "@/components/ui/Drawer";
import { ClienteDrawer, type EditingNote } from "./ClienteDrawer";
import { BajaModal, EliminarConfirmModal, MesoModal, NuevoClienteModal, ReactivarModal } from "./ClienteModals";

type ModalState =
  | { type: "nuevo" }
  | { type: "baja"; clienteId: string }
  | { type: "reactivar"; clienteId: string }
  | { type: "eliminar"; clienteId: string }
  | { type: "meso"; clienteId: string }
  | null;

export function ClientesPageClient({
  clientes,
  tarifas,
  grupos,
  leadPrefill,
}: {
  clientes: ClienteVM[];
  tarifas: Tarifa[];
  grupos: GrupoRevision[];
  leadPrefill?: { id: string; nombre: string };
}) {
  useAutoRefresh(300_000);

  const [drawerClienteId, setDrawerClienteId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(leadPrefill ? { type: "nuevo" } : null);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<ClienteFiltro>("all");
  const [orden, setOrden] = useState<ClienteOrden>("antiguedad");
  const [editingNote, setEditingNote] = useState<EditingNote>(null);
  const [pending, startTransition] = useTransition();

  const drawerCliente = clientes.find((c) => c.id === drawerClienteId) ?? null;
  const modalCliente = modal && "clienteId" in modal ? clientes.find((c) => c.id === modal.clienteId) ?? null : null;

  function closeDrawer() {
    setDrawerClienteId(null);
    setEditingNote(null);
  }

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div>
      <MrrHeader clientes={clientes} />

      <div className="mb-10">
        <div className="mb-3.5 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Acciones
          <span className="h-px flex-1 bg-line" />
        </div>
        <ActionQueue
          clientes={clientes}
          onOpenDrawer={setDrawerClienteId}
          onMarcarRevision={(id) => run(() => marcarRevisionHecha(id))}
          onMarcarCobro={(id) => run(() => marcarCobroHecho(id))}
          onAbrirMeso={(id) => setModal({ type: "meso", clienteId: id })}
        />
      </div>

      <ClientesTable
        clientes={clientes}
        search={search}
        onSearchChange={setSearch}
        filtro={filtro}
        onFiltroChange={setFiltro}
        orden={orden}
        onOrdenChange={setOrden}
        onOpenDrawer={setDrawerClienteId}
        onNuevoCliente={() => setModal({ type: "nuevo" })}
      />

      <Drawer open={!!drawerCliente} onClose={closeDrawer}>
        {drawerCliente && (
          <ClienteDrawer
            cliente={drawerCliente}
            editingNote={editingNote}
            onClose={closeDrawer}
            onStartAddNote={(categoria) => setEditingNote({ categoria, notaId: null })}
            onStartEditNote={(categoria, notaId) => setEditingNote({ categoria, notaId })}
            onCancelEditNote={() => setEditingNote(null)}
            onSaveNote={(categoria: Categoria, notaId, texto) =>
              run(
                () => (notaId ? editarNota(notaId, texto) : crearNota(drawerCliente.id, categoria, texto)),
                () => setEditingNote(null),
              )
            }
            onDeleteNote={(notaId) => run(() => eliminarNota(notaId), () => setEditingNote(null))}
            onCrearTareaDesdeNota={(texto) =>
              crearTarea({ title: notaToTituloTarea(texto), front: "coaching", isPriority: false, date: null, recur: null })
            }
            onMarcarRevision={() => run(() => marcarRevisionHecha(drawerCliente.id))}
            onMarcarCobro={() => run(() => marcarCobroHecho(drawerCliente.id))}
            onAbrirMeso={() => setModal({ type: "meso", clienteId: drawerCliente.id })}
            onAbrirBaja={() => setModal({ type: "baja", clienteId: drawerCliente.id })}
            onAbrirReactivar={() => setModal({ type: "reactivar", clienteId: drawerCliente.id })}
            onAbrirEliminar={() => setModal({ type: "eliminar", clienteId: drawerCliente.id })}
          />
        )}
      </Drawer>

      <NuevoClienteModal
        open={modal?.type === "nuevo"}
        onClose={() => setModal(null)}
        tarifas={tarifas}
        grupos={grupos}
        leadNombre={leadPrefill?.nombre}
        pending={pending}
        onSubmit={(input) =>
          run(() => crearCliente({ ...input, leadId: leadPrefill?.id }), () => setModal(null))
        }
      />

      {modalCliente && (
        <>
          <BajaModal
            open={modal?.type === "baja"}
            onClose={() => setModal(null)}
            nombre={modalCliente.nombre}
            pending={pending}
            onSubmit={(fecha, motivo) =>
              run(() => darBajaCliente(modalCliente.id, fecha, motivo), () => setModal(null))
            }
          />
          <ReactivarModal
            open={modal?.type === "reactivar"}
            onClose={() => setModal(null)}
            nombre={modalCliente.nombre}
            tarifas={tarifas}
            grupos={grupos}
            pending={pending}
            onSubmit={(input) =>
              run(() => reactivarCliente(modalCliente.id, input), () => setModal(null))
            }
          />
          <EliminarConfirmModal
            open={modal?.type === "eliminar"}
            onClose={() => setModal(null)}
            nombre={modalCliente.nombre}
            pending={pending}
            onConfirm={() =>
              run(() => eliminarCliente(modalCliente.id), () => {
                setModal(null);
                closeDrawer();
              })
            }
          />
          <MesoModal
            open={modal?.type === "meso"}
            onClose={() => setModal(null)}
            nombre={modalCliente.nombre}
            pending={pending}
            onSubmit={(input) =>
              run(() => gestionarMesociclo(modalCliente.id, input), () => setModal(null))
            }
          />
        </>
      )}
    </div>
  );
}
