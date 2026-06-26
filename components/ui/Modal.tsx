"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName = "w-[420px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`fixed top-1/2 left-1/2 z-50 ${widthClassName} max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-panel p-6`}>
        <h3 className="mb-4 font-heading text-lg font-bold">{title}</h3>
        {children}
      </div>
    </>,
    document.body,
  );
}
