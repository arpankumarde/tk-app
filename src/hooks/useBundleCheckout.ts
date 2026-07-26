import { useAuth } from "@/context/AuthContext";
import type { BundlePaymentData, EnrolledBundle } from "@/types/bundle";
import { isAuthError } from "@/utils/authError";
import { useCallback, useState } from "react";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export type BundlePurchaseResult =
  | { status: "free" }
  | { status: "paid"; paymentData: BundlePaymentData }
  | { status: "alreadyEnrolled" }
  | { status: "error"; message: string };

export interface PromoPreview {
  valid: boolean;
  message: string;
  discountAmount: number;
  promoCodeId: number | null;
}

export interface BundleItemAccess {
  enrolled: boolean;
  /** Items the bundle grants that aren't unlocked yet (see notes on free bundles). */
  lockedCount: number;
}

const readError = (payload: any, fallback: string): string => {
  const err = payload?.error;
  if (Array.isArray(err))
    return err.map((e: any) => e?.message ?? String(e)).join(", ");
  if (typeof err === "string") return err;
  return payload?.details || payload?.message || fallback;
};

/**
 * Bundle checkout. Bundles never go through the cart — the backend has no
 * `bundleId` on cart items — so this is always a single-item direct checkout.
 *
 * Payment itself works exactly like the cart's: the PayU form is posted from a
 * WebView, a `testkart://` deep link is intercepted when the callback sends
 * one, and `payment/payu/verify-and-complete` (via `CartContext.verifyPayment`)
 * settles the result by txnid otherwise. Two ways to reach that WebView:
 *  - no promo code → `POST /_api/bundles/purchase` returns the PayU field set
 *    we post ourselves (JSON + Bearer, the documented native path).
 *  - promo code applied → `GET /_api/payment/payu/bundle-redirect`, the only
 *    endpoint that actually redeems a promo code against a bundle. It answers
 *    with an auto-submitting HTML page, so it has to be loaded in the WebView.
 */
export const useBundleCheckout = () => {
  const { token, invalidateSession } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [validatingPromo, setValidatingPromo] = useState(false);

  const purchase = useCallback(
    async (bundleId: number): Promise<BundlePurchaseResult> => {
      if (!token)
        return { status: "error", message: "Please log in to continue" };

      try {
        setPurchasing(true);
        const response = await fetch(`${BASE_URL}/_api/bundles/purchase`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { bundleId } }),
        });

        const data = await response.json().catch(() => null);
        const payload = data?.json || data;

        if (response.status === 409) return { status: "alreadyEnrolled" };

        if (isAuthError(response.status, payload)) {
          await invalidateSession();
          return {
            status: "error",
            message: "Your session expired. Please log in again.",
          };
        }

        if (!response.ok || payload?.error) {
          return {
            status: "error",
            message: readError(payload, "Failed to start this purchase"),
          };
        }

        if (payload?.isFree) return { status: "free" };

        const paymentData = payload?.paymentData;
        if (!paymentData?.payuUrl || !paymentData?.hash) {
          return {
            status: "error",
            message: "Payment could not be initiated. Please try again.",
          };
        }

        return {
          status: "paid",
          paymentData: paymentData as BundlePaymentData,
        };
      } catch (error) {
        console.error("Error starting bundle purchase:", error);
        return { status: "error", message: "Something went wrong" };
      } finally {
        setPurchasing(false);
      }
    },
    [token, invalidateSession],
  );

  /** Previews a promo discount. Redemption happens server-side at checkout. */
  const validatePromo = useCallback(
    async (
      bundleId: number,
      price: number,
      code: string,
    ): Promise<PromoPreview> => {
      if (!token)
        return {
          valid: false,
          message: "Please log in to use a promo code",
          discountAmount: 0,
          promoCodeId: null,
        };

      try {
        setValidatingPromo(true);
        const response = await fetch(`${BASE_URL}/_api/promo-codes/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            json: {
              code,
              items: [{ id: bundleId, type: "bundle", price }],
              totalAmount: price,
            },
          }),
        });

        const data = await response.json().catch(() => null);
        const payload = data?.json || data;

        if (isAuthError(response.status, payload)) {
          await invalidateSession();
          return {
            valid: false,
            message: "Your session expired. Please log in again.",
            discountAmount: 0,
            promoCodeId: null,
          };
        }

        if (!response.ok || !payload?.valid) {
          return {
            valid: false,
            message:
              payload?.message || readError(payload, "Invalid promo code"),
            discountAmount: 0,
            promoCodeId: null,
          };
        }

        const discountAmount = payload.discountAmount ?? 0;
        return {
          valid: true,
          message:
            payload.message || `Promo applied! You saved ₹${discountAmount}`,
          discountAmount,
          promoCodeId: payload.promoCodeId ?? null,
        };
      } catch (error) {
        console.error("Error validating promo code:", error);
        return {
          valid: false,
          message: "Failed to apply promo code",
          discountAmount: 0,
          promoCodeId: null,
        };
      } finally {
        setValidatingPromo(false);
      }
    },
    [token, invalidateSession],
  );

  /** WebView source for the promo-aware checkout page. */
  const buildRedirectSource = useCallback(
    (bundleId: number, promoCodeId?: number | null) => ({
      uri:
        `${BASE_URL}/_api/payment/payu/bundle-redirect?bundleId=${bundleId}` +
        (promoCodeId != null ? `&promoCodeId=${promoCodeId}` : ""),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
    [token],
  );

  /**
   * A bundle enrollment is supposed to fan out into per-item enrollments. The
   * free-bundle branch of `purchase` is known to skip that fan-out, so after a
   * free claim we check whether the contained items actually unlocked.
   */
  const checkItemAccess = useCallback(
    async (bundleId: number): Promise<BundleItemAccess> => {
      if (!token) return { enrolled: false, lockedCount: 0 };

      try {
        const response = await fetch(
          `${BASE_URL}/_api/student/bundles/enrolled`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json().catch(() => null);
        const payload = data?.json || data;
        const enrolledBundles: EnrolledBundle[] =
          payload?.enrolledBundles || [];
        const bundle = enrolledBundles.find((b) => b.id === bundleId);

        if (!bundle) return { enrolled: false, lockedCount: 0 };

        const lockedTests = (bundle.mockTests || []).filter(
          (t) => t.isEnrolled === false,
        ).length;
        const lockedProducts = (bundle.digitalProducts || []).filter(
          (p) => p.isPurchased === false,
        ).length;

        return { enrolled: true, lockedCount: lockedTests + lockedProducts };
      } catch (error) {
        console.error("Error checking bundle item access:", error);
        return { enrolled: false, lockedCount: 0 };
      }
    },
    [token],
  );

  return {
    purchasing,
    validatingPromo,
    purchase,
    validatePromo,
    buildRedirectSource,
    checkItemAccess,
  };
};

export default useBundleCheckout;
