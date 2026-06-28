"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAutoRefresh(intervalMs = 60_000, paused = false) {
  const router = useRouter();
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, paused]);
}
