import { useState, useEffect, useCallback } from "react";
import { PurchasedProduct } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export const usePurchasedProducts = (
  token: string | null,
  options?: { limit?: number; page?: number },
) => {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;

  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/_api/student/shop/purchases?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch purchases");

      const data = await response.json();
      const payload = data.json || data;
      setProducts(payload.purchases || []);
    } catch (error) {
      console.error("Error fetching purchased products:", error);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
};

export default usePurchasedProducts;
