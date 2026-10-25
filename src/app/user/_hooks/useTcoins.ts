import { useCallback, useEffect, useState } from "react";
import type { TcoinsSummary } from "@/utils/tcoins";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

/**
 * The student's Tcoins balance and recent history. While Tcoins are switched
 * off on the server the summary comes back with `enabled: false` and every
 * screen hides them.
 */
export const useTcoins = (token: string | null) => {
  const [summary, setSummary] = useState<TcoinsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!token) {
      setSummary(null);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/_api/student/tcoins/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setSummary((data.json || data) as TcoinsSummary);
    } catch (error) {
      console.error("Error fetching Tcoins:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, refetch };
};

export default useTcoins;
