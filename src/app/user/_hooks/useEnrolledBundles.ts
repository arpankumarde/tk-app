import type { EnrolledBundle } from "@/types/bundle";
import { useCallback, useEffect, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const useEnrolledBundles = (token: string | null) => {
  const [bundles, setBundles] = useState<EnrolledBundle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBundles = useCallback(async () => {
    if (!token) {
      setBundles([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${BASE_URL}/_api/student/bundles/enrolled`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) throw new Error("Failed to fetch bundles");

      const data = await response.json();
      const payload = data.json || data;
      setBundles(payload.enrolledBundles || []);
    } catch (err: any) {
      console.error("Error fetching enrolled bundles:", err);
      setError(err?.message || "Failed to load your bundles");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBundles();
  }, [fetchBundles]);

  return {
    bundles,
    loading,
    error,
    total: bundles.length,
    refetch: fetchBundles,
  };
};

export default useEnrolledBundles;
