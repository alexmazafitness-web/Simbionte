"use client";

import { PomodoroProvider } from "@/lib/pomodoro/PomodoroContext";
import { PomodoroWidget } from "./PomodoroWidget";

export function PomodoroSetup({ children }: { children: React.ReactNode }) {
  return (
    <PomodoroProvider>
      {children}
      <PomodoroWidget />
    </PomodoroProvider>
  );
}
