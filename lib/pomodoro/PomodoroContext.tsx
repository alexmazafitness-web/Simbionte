"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = "focus" | "short" | "long";

export type PomodoroConfig = {
  focusMins: number;
  shortMins: number;
  longMins: number;
  cycleCount: number;
};

export type LinkedTask = { id: string; title: string };

type State = {
  phase: Phase;
  secondsLeft: number;
  running: boolean;
  pomodorosCompleted: number;
  pomodorosThisCycle: number;
  linkedTask: LinkedTask | null;
  config: PomodoroConfig;
  open: boolean;
  minimized: boolean;
};

type Action =
  | { type: "TICK" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESET" }
  | { type: "SKIP" }
  | { type: "OPEN"; task?: LinkedTask }
  | { type: "CLOSE" }
  | { type: "MINIMIZE" }
  | { type: "EXPAND" }
  | { type: "SET_TASK"; task: LinkedTask | null }
  | { type: "UPDATE_CONFIG"; config: Partial<PomodoroConfig> };

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: PomodoroConfig = {
  focusMins: 25,
  shortMins: 5,
  longMins: 15,
  cycleCount: 4,
};

function phaseSeconds(phase: Phase, cfg: PomodoroConfig): number {
  if (phase === "focus") return cfg.focusMins * 60;
  if (phase === "short") return cfg.shortMins * 60;
  return cfg.longMins * 60;
}

function advancePhase(s: State): Pick<State, "phase" | "secondsLeft" | "pomodorosCompleted" | "pomodorosThisCycle"> {
  if (s.phase === "focus") {
    const pomodorosCompleted = s.pomodorosCompleted + 1;
    const next = s.pomodorosThisCycle + 1;
    if (next >= s.config.cycleCount) {
      return { phase: "long", secondsLeft: phaseSeconds("long", s.config), pomodorosCompleted, pomodorosThisCycle: 0 };
    }
    return { phase: "short", secondsLeft: phaseSeconds("short", s.config), pomodorosCompleted, pomodorosThisCycle: next };
  }
  return { phase: "focus", secondsLeft: phaseSeconds("focus", s.config), pomodorosCompleted: s.pomodorosCompleted, pomodorosThisCycle: s.pomodorosThisCycle };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "TICK":
      if (state.secondsLeft <= 1) return { ...state, ...advancePhase(state), running: true };
      return { ...state, secondsLeft: state.secondsLeft - 1 };
    case "PLAY":
      return { ...state, running: true };
    case "PAUSE":
      return { ...state, running: false };
    case "RESET":
      return { ...state, running: false, secondsLeft: phaseSeconds(state.phase, state.config) };
    case "SKIP":
      return { ...state, ...advancePhase(state) };
    case "OPEN":
      return {
        ...state,
        open: true,
        minimized: false,
        linkedTask: action.task !== undefined ? action.task : state.linkedTask,
      };
    case "CLOSE":
      return { ...state, open: false, running: false };
    case "MINIMIZE":
      return { ...state, minimized: true };
    case "EXPAND":
      return { ...state, minimized: false };
    case "SET_TASK":
      return { ...state, linkedTask: action.task };
    case "UPDATE_CONFIG": {
      const config = { ...state.config, ...action.config };
      const secondsLeft = state.running ? state.secondsLeft : phaseSeconds(state.phase, config);
      return { ...state, config, secondsLeft };
    }
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

type ContextValue = {
  state: State;
  play: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  open: (task?: LinkedTask) => void;
  close: () => void;
  minimize: () => void;
  expand: () => void;
  setTask: (task: LinkedTask | null) => void;
  updateConfig: (cfg: Partial<PomodoroConfig>) => void;
};

const PomodoroCtx = createContext<ContextValue | null>(null);

export function usePomodoroCtx(): ContextValue {
  const ctx = useContext(PomodoroCtx);
  if (!ctx) throw new Error("usePomodoroCtx must be used inside PomodoroProvider");
  return ctx;
}

// ── Sound ─────────────────────────────────────────────────────────────────────

function playBeep() {
  try {
    type AudioCtxCtor = typeof AudioContext;
    const Ctor: AudioCtxCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext;
    const ctx = new Ctor();
    [523.25, 659.25].forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.3;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      osc.start(t);
      osc.stop(t + 1.4);
    });
  } catch {
    // AudioContext unavailable — silent fallback
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    phase: "focus",
    secondsLeft: DEFAULT_CONFIG.focusMins * 60,
    running: false,
    pomodorosCompleted: 0,
    pomodorosThisCycle: 0,
    linkedTask: null,
    config: DEFAULT_CONFIG,
    open: false,
    minimized: false,
  });

  // Tick interval
  useEffect(() => {
    if (!state.running) return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.running]);

  // Sound on phase transition (skip initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    playBeep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const value: ContextValue = {
    state,
    play:         useCallback(() => dispatch({ type: "PLAY" }),              []),
    pause:        useCallback(() => dispatch({ type: "PAUSE" }),             []),
    reset:        useCallback(() => dispatch({ type: "RESET" }),             []),
    skip:         useCallback(() => dispatch({ type: "SKIP" }),              []),
    open:         useCallback((task) => dispatch({ type: "OPEN", task }),    []),
    close:        useCallback(() => dispatch({ type: "CLOSE" }),             []),
    minimize:     useCallback(() => dispatch({ type: "MINIMIZE" }),          []),
    expand:       useCallback(() => dispatch({ type: "EXPAND" }),            []),
    setTask:      useCallback((task) => dispatch({ type: "SET_TASK", task }),[]),
    updateConfig: useCallback((cfg) => dispatch({ type: "UPDATE_CONFIG", config: cfg }), []),
  };

  return <PomodoroCtx.Provider value={value}>{children}</PomodoroCtx.Provider>;
}
