import { useState, useEffect, useCallback } from "react";
import { WalletBalance, WalletTransaction } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const useWallet = (token: string | null) => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const [balanceRes, txRes] = await Promise.all([
        fetch(`${BASE_URL}/_api/student/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/_api/student/wallet/transactions?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        const balancePayload = balanceData.json || balanceData;
        setBalance(balancePayload);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        const txPayload = txData.json || txData;
        setTransactions(txPayload.transactions || []);
        setTotalTransactions(txPayload.total || 0);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { balance, transactions, totalTransactions, loading, refetch: fetchWallet };
};

export default useWallet;
