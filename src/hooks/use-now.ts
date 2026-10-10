import { useSyncExternalStore } from "react";

export function useNow(intervalMs = 1000) {
  const tick = useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs),
    () => 0,
  );
  return tick * intervalMs;
}
