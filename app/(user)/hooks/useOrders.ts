import { useState, useEffect, useCallback } from "react";
import { Order } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const useOrders = (
  token: string | null,
  options?: { limit?: number; page?: number },
) => {
  const limit = options?.limit ?? 10;
  const page = options?.page ?? 1;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/_api/orders/list?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      const payload = data.json || data;
      setOrders(payload.orders || []);
      setTotal(payload.total || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, total, loading, refetch: fetchOrders };
};

export const useOrderDetails = (token: string | null, orderId: number) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!token || !orderId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${BASE_URL}/_api/orders/details?id=${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch order details");

      const data = await response.json();
      const payload = data.json || data;

      if (payload.error) {
        setError(payload.error);
      } else {
        setOrder(payload.order || payload);
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [token, orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
};
