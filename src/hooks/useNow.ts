import { useState, useEffect } from "react";

/**
 * Custom hook exposing the current time as state, refreshed on an interval.
 * Reading it during render stays pure, while time-based UI (live/ended badges,
 * registration deadlines) still transitions on its own.
 * @param intervalMs How often to refresh the timestamp. Defaults to 1s.
 * @returns The current time in milliseconds since the epoch.
 */
export const useNow = (intervalMs = 1000) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
