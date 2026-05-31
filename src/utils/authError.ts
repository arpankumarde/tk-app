/**
 * Detects whether an API response means the session is invalid (missing /
 * expired / revoked token). The backend signals this as a 401/403 OR a 500
 * whose body carries a "Not authenticated" marker, so we check both the status
 * and the unwrapped payload (`data.json ?? data`, may be undefined).
 */
export function isAuthError(status: number, payload?: any): boolean {
  if (status === 401 || status === 403) return true;
  if (!payload || typeof payload !== "object") return false;

  const candidates: unknown[] = [
    payload.details,
    payload.message,
    typeof payload.error === "string" ? payload.error : undefined,
    ...(Array.isArray(payload.error)
      ? payload.error.map((e: any) => e?.message ?? e)
      : []),
  ];

  const AUTH_FAILURE =
    /not\s*authenticated|unauthenticated|unauthori[sz]ed|invalid token|token (?:expired|invalid)|expired token|jwt expired|session expired/i;

  return candidates.some(
    (v) => typeof v === "string" && AUTH_FAILURE.test(v),
  );
}
