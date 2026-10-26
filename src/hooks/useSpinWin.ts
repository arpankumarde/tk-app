import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAuthError } from "@/utils/authError";
import type {
  ClaimResult,
  MySpinCoupon,
  SpinCampaignView,
  SpinResult,
} from "@/types/spinWin";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export class SpinWinRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function errorText(payload: any, fallback: string): string {
  if (typeof payload?.error === "string") return payload.error;
  if (Array.isArray(payload?.error)) return payload.error[0]?.message ?? fallback;
  return fallback;
}

/** Calls a `spin-win/*` endpoint with the Bearer token; a dead session signs the student out. */
export function useSpinWinRequest() {
  const { token, invalidateSession } = useAuth();

  return useCallback(
    async <T,>(path: string, body?: Record<string, unknown>): Promise<T> => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/_api/spin-win/${path}`, {
        method: body ? "POST" : "GET",
        headers,
        body: body ? JSON.stringify({ json: body }) : undefined,
      });
      const data = await res.json().catch(() => null);
      const payload = data?.json ?? data;
      if (!res.ok) {
        if (token && isAuthError(res.status, payload)) await invalidateSession();
        throw new SpinWinRequestError(errorText(payload, "Request failed"), res.status);
      }
      return payload as T;
    },
    [token, invalidateSession],
  );
}

/** The live campaign as this student or logged-out visitor sees it; null when none is live or the account is not a student. */
export function useActiveSpinCampaign(enabled: boolean) {
  const request = useSpinWinRequest();
  const [view, setView] = useState<SpinCampaignView | null>(null);

  const load = useCallback(
    () =>
      request<{ active: SpinCampaignView | null }>("active")
        .then((result) => result.active ?? null)
        .catch(() => null),
    [request],
  );

  const refetch = useCallback(() => load().then(setView), [load]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then((next) => {
      if (!cancelled) setView(next);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  return { view: enabled ? view : null, refetch };
}

export function useSpinActions() {
  const request = useSpinWinRequest();
  const spin = useCallback(
    (slug: string) => request<SpinResult>("spin", { slug }),
    [request],
  );
  const claim = useCallback(
    (slug: string) => request<ClaimResult>("claim", { slug }),
    [request],
  );
  return { spin, claim };
}

export function useMySpinCoupons() {
  const request = useSpinWinRequest();
  const [coupons, setCoupons] = useState<MySpinCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      request<{ coupons: MySpinCoupon[] }>("my-coupons").then(
        (result) => {
          setCoupons(result.coupons ?? []);
          setError(null);
          setLoading(false);
        },
        (err) => {
          setError(friendlySpinError(err));
          setLoading(false);
        },
      ),
    [request],
  );

  useEffect(() => {
    let cancelled = false;
    request<{ coupons: MySpinCoupon[] }>("my-coupons").then(
      (result) => {
        if (cancelled) return;
        setCoupons(result.coupons ?? []);
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(friendlySpinError(err));
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [request]);

  const refetch = useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  return { coupons, loading, error, refetch };
}

/** Turns API failures into the wording students see; network errors never show raw. */
export function friendlySpinError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || /fetch|network|Failed to|load failed|JSON|Request failed/i.test(message)) {
    return "We couldn't reach Testkart just now. Check your connection and try again; you won't lose your spin.";
  }
  return message;
}

const SHOP_ROUTES: Record<string, string> = {
  test_series: "/tests",
  courses: "/courses",
  study_notes: "/shop",
};

export const shopRouteFor = (categories: string[]): string =>
  SHOP_ROUTES[categories.find((c) => c in SHOP_ROUTES) ?? "test_series"];

export const CATEGORY_LABELS: Record<string, string> = {
  test_series: "Test series",
  courses: "Courses",
  study_notes: "Study notes",
};

export function discountLabel(type: string | null, value: number | null): string {
  if (!type || value === null) return "No discount";
  return type === "percentage" ? `${value}% off` : `₹${value} off`;
}

export function spinDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
