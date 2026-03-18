import { useState, useEffect, useCallback } from "react";
import { EnrolledTest } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const useEnrolledTests = (token: string | null) => {
  const [tests, setTests] = useState<EnrolledTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchTests = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/_api/student/enrolled-tests?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tests");
      }

      const data = await response.json();
      const payload = data.json || data;

      // The API returns 'enrolledTests' based on the logs
      const baseTests =
        payload.enrolledTests ||
        payload.tests ||
        (Array.isArray(payload) ? payload : []);

      setTests(baseTests);
      setTotal(payload.total || baseTests.length);
    } catch (error) {
      console.error("Error fetching enrolled tests:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return { tests, loading, total, refetch: fetchTests };
};

export default useEnrolledTests;
