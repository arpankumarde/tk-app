import { useState, useEffect, useCallback, useRef } from "react";
import { WalletBalance, WalletTransaction } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_SIZE = 10;

export const useWallet = (token: string | null) => {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchingRef = useRef(false);

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (!token || fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const requests: Promise<Response>[] = [
          fetch(
            `${BASE_URL}/_api/student/wallet/transactions?page=${targetPage}&limit=${PAGE_SIZE}`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ];
        if (!append) {
          requests.push(
            fetch(`${BASE_URL}/_api/student/wallet/balance`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          );
        }

        const [txRes, balanceRes] = await Promise.all(requests);

        if (txRes.ok) {
          const txData = await txRes.json();
          const txPayload = txData.json || txData;
          const next: WalletTransaction[] = txPayload.transactions || [];
          setTransactions((prev) => (append ? [...prev, ...next] : next));
          setTotalTransactions(txPayload.total || 0);
          setPage(targetPage);
        }

        if (!append && balanceRes?.ok) {
          const balanceData = await balanceRes.json();
          const balancePayload = balanceData.json || balanceData;
          setBalance(balancePayload);
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        fetchingRef.current = false;
      }
    },
    [token],
  );

  const refetch = useCallback(() => fetchPage(1, false), [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || fetchingRef.current) return;
    if (transactions.length >= totalTransactions) return;
    fetchPage(page + 1, true);
  }, [
    fetchPage,
    loading,
    loadingMore,
    page,
    transactions.length,
    totalTransactions,
  ]);

  const hasMore = transactions.length < totalTransactions;

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    balance,
    transactions,
    totalTransactions,
    loading,
    loadingMore,
    hasMore,
    refetch,
    loadMore,
  };
};

export default useWallet;
