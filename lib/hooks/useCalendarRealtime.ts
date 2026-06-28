"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribes to personal.events, personal.reminders and personal.tasks via
// Supabase Realtime. Any INSERT/UPDATE/DELETE triggers a router.refresh() so
// the RSC page re-fetches and the calendar stays in sync across tabs.
export function useCalendarRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("calendar-realtime")
      .on("postgres_changes", { event: "*", schema: "personal", table: "events" },    () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "personal", table: "reminders" }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "personal", table: "tasks" },     () => router.refresh())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [router]);
}
