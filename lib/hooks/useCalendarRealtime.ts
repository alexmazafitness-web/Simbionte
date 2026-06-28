"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Defers router.refresh() if an input/textarea currently has focus —
// waits up to 10 s for focus to leave before giving up on that update.
function safeRefresh(router: ReturnType<typeof useRouter>) {
  function tryRefresh(attemptsLeft: number) {
    const el  = document.activeElement;
    const tag = el?.tagName.toLowerCase();
    const blocked = tag === "input" || tag === "textarea" || (el as HTMLElement)?.isContentEditable;
    if (!blocked) {
      router.refresh();
      return;
    }
    if (attemptsLeft > 0) {
      setTimeout(() => tryRefresh(attemptsLeft - 1), 1_000);
    }
    // if still blocked after 10 attempts, skip — data will arrive next auto-refresh
  }
  tryRefresh(10);
}

export function useCalendarRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-realtime")
      .on("postgres_changes", { event: "*", schema: "personal", table: "events" },    () => safeRefresh(router))
      .on("postgres_changes", { event: "*", schema: "personal", table: "reminders" }, () => safeRefresh(router))
      .on("postgres_changes", { event: "*", schema: "personal", table: "tasks" },     () => safeRefresh(router))
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [router]);
}
