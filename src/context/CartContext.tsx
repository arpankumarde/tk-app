import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { isAuthError } from "@/utils/authError";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export interface CartItem {
  id: number;
  resourceId: number;
  type: "test" | "course" | "digitalProduct";
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  teacherName: string;
  price: number;
  originalPrice: number;
  discount: number;
}

export interface CartData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoDiscount: number;
  total: number;
  itemCount: number;
}

interface CartContextType {
  cart: CartData;
  loading: boolean;
  itemCount: number;
  refreshCart: (silent?: boolean) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyPromoCode: (
    code: string,
  ) => Promise<{ success: boolean; message: string }>;
  clearPromo: () => void;
  appliedPromoCode: string | null;
  eligibleItemIds: number[];
  initiatePayment: () => Promise<any>;
  verifyPayment: (params: any) => Promise<any>;
  walletPurchase: () => Promise<{
    success: boolean;
    orderId?: number;
    walletBalanceAfter?: number;
    amountDeducted?: number;
    error?: string;
  }>;
}

const computeTotals = (items: CartItem[], promoDiscount = 0): CartData => {
  const subtotal = items.reduce((sum, item) => sum + item.originalPrice, 0);
  const itemDiscount =
    subtotal - items.reduce((sum, item) => sum + item.price, 0);
  const discount = itemDiscount + promoDiscount;
  const total = subtotal - discount;
  return {
    items,
    subtotal,
    discount,
    promoDiscount,
    total,
    itemCount: items.length,
  };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, invalidateSession } = useAuth();
  const [cart, setCart] = useState<CartData>({
    items: [],
    subtotal: 0,
    discount: 0,
    promoDiscount: 0,
    total: 0,
    itemCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [appliedPromoDiscount, setAppliedPromoDiscount] = useState(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [appliedPromoCodeId, setAppliedPromoCodeId] = useState<number | null>(
    null,
  );
  const [eligibleItemIds, setEligibleItemIds] = useState<number[]>([]);

  const fetchCart = useCallback(
    async (silent = false) => {
      if (!token) {
        setCart({
          items: [],
          subtotal: 0,
          discount: 0,
          promoDiscount: 0,
          total: 0,
          itemCount: 0,
        });
        return;
      }

      try {
        if (!silent) setLoading(true);
        const response = await fetch(`${BASE_URL}/_api/cart/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json().catch(() => null);
        const payload = data?.json || data;

        // Expired token can surface as a non-401 "Not authenticated" body.
        if (isAuthError(response.status, payload)) {
          await invalidateSession();
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch cart");

        const items: CartItem[] = (payload?.items || []).map((item: any) => {
          const originalPrice = item.price ?? 0;
          const finalPrice = item.discountPrice ?? originalPrice;
          return {
            id: item.cartItemId,
            resourceId:
              item.courseId || item.mockTestId || item.digitalProductId,
            type: item.type,
            title: item.title || "",
            slug: item.slug || "",
            thumbnailUrl: item.thumbnailImageUrl || item.thumbnailUrl || null,
            teacherName: item.teacherName || item.creatorName || "",
            price: finalPrice,
            originalPrice,
            discount: originalPrice - finalPrice,
          };
        });

        setCart(computeTotals(items, appliedPromoDiscount));
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, appliedPromoDiscount, invalidateSession],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!token) return;

      setAppliedPromoDiscount(0);
      setAppliedPromoCode(null);
      setEligibleItemIds([]);
      setCart((prev) =>
        computeTotals(prev.items.filter((i) => i.id !== itemId)),
      );

      try {
        const response = await fetch(`${BASE_URL}/_api/cart/remove`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { cartItemId: itemId } }),
        });

        if (!response.ok) throw new Error("Failed to remove item");

        await fetchCart(true);
      } catch (error) {
        console.error("Error removing cart item:", error);
        await fetchCart(true);
      }
    },
    [token, fetchCart],
  );

  const applyPromoCode = useCallback(
    async (code: string) => {
      if (!token) return { success: false, message: "Not authenticated" };

      try {
        const items = cart.items.map((item) => ({
          id: item.resourceId,
          type: item.type === "digitalProduct" ? "course" : item.type,
          price: item.price,
        }));
        const totalAmount = cart.items.reduce(
          (sum, item) => sum + item.price,
          0,
        );

        const response = await fetch(`${BASE_URL}/_api/promo-codes/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            json: { code, items, totalAmount },
          }),
        });

        const data = await response.json();
        const payload = data.json || data;

        if (!payload.valid) {
          return {
            success: false,
            message: payload.message || "Invalid promo code",
          };
        }

        const discount = payload.discountAmount ?? 0;
        setAppliedPromoDiscount(discount);
        setAppliedPromoCode(code.toUpperCase());
        setAppliedPromoCodeId(payload.promoCodeId ?? null);
        setEligibleItemIds(payload.eligibleItemIds ?? []);
        setCart((prev) => computeTotals(prev.items, discount));

        return {
          success: true,
          message:
            payload.message ||
            `Promo applied! You saved ₹${discount.toFixed(2)}`,
        };
      } catch (error) {
        console.error("Error applying promo code:", error);
        return { success: false, message: "Failed to apply promo code" };
      }
    },
    [token, cart.items],
  );

  const clearPromo = useCallback(() => {
    setAppliedPromoDiscount(0);
    setAppliedPromoCode(null);
    setAppliedPromoCodeId(null);
    setEligibleItemIds([]);
    setCart((prev) => computeTotals(prev.items, 0));
  }, []);

  const initiatePayment = useCallback(async () => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const body: Record<string, any> = {
        deepLinkUrl: "testkart://payment/callback",
      };
      if (appliedPromoCodeId != null) body.promoCodeId = appliedPromoCodeId;

      const reqBody = { json: body };
      const response = await fetch(`${BASE_URL}/_api/payment/payu/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reqBody),
      });

      const data = await response.json();
      const payload = data.json || data;

      if (!response.ok || payload.error) {
        return {
          success: false,
          error:
            payload.details || payload.error || "Failed to initiate payment",
        };
      }

      return {
        success: true,
        key: payload.key as string,
        txnid: payload.txnid as string,
        amount: payload.amount as string,
        productinfo: payload.productinfo as string,
        firstname: payload.firstname as string,
        email: payload.email as string,
        phone: payload.phone as string,
        surl: payload.surl as string,
        furl: payload.furl as string,
        hash: payload.hash as string,
        payuUrl: payload.payuUrl as string,
        udf1: payload.udf1 as string | undefined,
      };
    } catch (error) {
      console.error("Error initiating payment:", error);
      return { success: false, error: "Something went wrong" };
    }
  }, [token, appliedPromoCodeId]);

  const verifyPayment = useCallback(
    async (params: { txnid: string } | { orderId: number }) => {
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const reqBody = { json: params };
        const response = await fetch(
          `${BASE_URL}/_api/payment/payu/verify-and-complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(reqBody),
          },
        );

        const data = await response.json();
        const payload = data.json || data;

        return {
          success: payload.success ?? false,
          orderStatus: payload.orderStatus as
            | "completed"
            | "pending"
            | "failed"
            | undefined,
          orderId: payload.orderId as number | undefined,
          message: payload.message as string | undefined,
        };
      } catch (error) {
        console.error("Error verifying payment:", error);
        return { success: false, error: "Something went wrong" };
      }
    },
    [token],
  );

  const walletPurchase = useCallback(async () => {
    if (!token) return { success: false, error: "Not authenticated" };

    try {
      const body: Record<string, any> = {};
      if (appliedPromoCodeId != null) body.promoCodeId = appliedPromoCodeId;

      const response = await fetch(`${BASE_URL}/_api/student/wallet/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ json: body }),
      });

      const data = await response.json();
      const payload = data.json || data;

      if (!response.ok || payload.error) {
        const errMsg = Array.isArray(payload.error)
          ? payload.error.map((e: any) => e.message).join(", ")
          : payload.error || "Failed to complete wallet purchase";
        return { success: false, error: errMsg };
      }

      setAppliedPromoDiscount(0);
      setAppliedPromoCode(null);
      setAppliedPromoCodeId(null);
      setEligibleItemIds([]);
      await fetchCart(true);

      return {
        success: true,
        orderId: payload.orderId as number,
        walletBalanceAfter: payload.walletBalanceAfter as number,
        amountDeducted: payload.amountDeducted as number,
      };
    } catch (error) {
      console.error("Error during wallet purchase:", error);
      return { success: false, error: "Something went wrong" };
    }
  }, [token, appliedPromoCodeId, fetchCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        itemCount: cart.itemCount,
        refreshCart: fetchCart,
        removeItem,
        applyPromoCode,
        clearPromo,
        appliedPromoCode,
        eligibleItemIds,
        initiatePayment,
        verifyPayment,
        walletPurchase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
};
