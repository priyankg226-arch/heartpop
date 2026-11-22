import { useEffect, useRef, useState } from "react";

/** Elapsed seconds while `running`; pauses when the tab is hidden. */
export function useGameTimer(running: boolean, initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const base = useRef(initialSeconds);
  base.current = seconds;
  useEffect(() => {
    if (!running) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id === null) id = setInterval(() => setSeconds((s) => s + 1), 1000);
    };
    const stop = () => {
      if (id !== null) clearInterval(id);
      id = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [running]);
  return [seconds, setSeconds] as const;
}

export const formatTime = (total: number) =>
  `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
