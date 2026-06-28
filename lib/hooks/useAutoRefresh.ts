"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Returns true when it is safe to fire a background refresh:
// – no input / textarea / contenteditable has focus
// – the page tab is visible
function isSafeToRefresh(): boolean {
  if (typeof document === "undefined") return false;
  if (document.visibilityState === "hidden") return false;
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return false;
  if ((el as HTMLElement).isContentEditable) return false;
  return true;
}

/**
 * Fires router.refresh() periodically, but only when:
 *   - `paused` is false
 *   - no input/textarea/contenteditable has focus
 *   - the browser tab is visible
 *
 * Also refreshes once when the tab returns to visible after having been
 * hidden for more than `hiddenGraceMs` (default 2 min).
 */
export function useAutoRefresh(
  intervalMs = 300_000,       // default 5 min — Realtime handles real-time changes
  paused = false,
  hiddenGraceMs = 120_000,    // re-fetch after 2+ min in background
) {
  const router     = useRouter();
  const hiddenAtRef = useRef<number | null>(null);

  // Periodic background refresh
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (isSafeToRefresh()) router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, paused]);

  // Refresh on tab return after being hidden long enough
  useEffect(() => {
    if (paused) return;
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else if (
        hiddenAtRef.current !== null &&
        Date.now() - hiddenAtRef.current >= hiddenGraceMs &&
        isSafeToRefresh()
      ) {
        hiddenAtRef.current = null;
        router.refresh();
      } else {
        hiddenAtRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router, paused, hiddenGraceMs]);
}
