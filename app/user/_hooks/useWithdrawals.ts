import { useState, useEffect, useCallback } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface Withdrawal {
  id: number;
  amount: number;
  status: "pending" | "completed" | "rejected" | "failed";
  requestedDate?: string;
  processedDate?: string | null;
  notes?: string | null;
  transactionId?: string | null;
  studentId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const useWithdrawals = (token: string | null) => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/_api/student/withdrawal/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const payload = data.json || data;
        setWithdrawals(payload.withdrawals || []);
      }
    } catch (error) {
      console.error("[Withdrawals] Error:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  return { withdrawals, loading, refetch: fetchWithdrawals };
};

export default useWithdrawals;
