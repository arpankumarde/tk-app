/**
 * Tcoins rules, mirroring helpers/tcoinsMath.tsx in the Floot project so the
 * amount shown at checkout is the amount the server charges. Keep the two in
 * step. One coin = one rupee and coins are always whole.
 */

export interface TcoinHistoryEntry {
  orderId: number;
  createdAt: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  title: string;
  amountPaid: number;
  tcoinsRedeemed: number;
  tcoinsCashback: number;
}

/** `GET student/tcoins/summary`. Everything is zero or empty while `enabled` is false. */
export interface TcoinsSummary {
  enabled: boolean;
  redeemPercent: number;
  maxRedeem: number;
  cashbackPercent: number;
  maxCashback: number;
  balance: number;
  pendingCashback: number;
  totalEarned: number;
  totalSpent: number;
  history: TcoinHistoryEntry[];
}

// The epsilon keeps 10% of 400 at 40 coins despite float error.
const wholeCoins = (value: number) => Math.max(0, Math.floor(value + 1e-6));

export const tcoinsRedeemableFor = (
  summary: TcoinsSummary,
  orderValue: number,
): number => {
  if (!summary.enabled) return 0;
  return Math.min(
    wholeCoins((orderValue * summary.redeemPercent) / 100),
    summary.maxRedeem,
    wholeCoins(summary.balance),
  );
};

export const tcoinsCashbackFor = (
  summary: TcoinsSummary,
  amountPaid: number,
): number => {
  if (!summary.enabled) return 0;
  return Math.min(
    summary.maxCashback,
    wholeCoins((amountPaid * summary.cashbackPercent) / 100),
  );
};

/** Coins an order would spend. Coins never combine with a promo code. */
export const tcoinsToSpend = (
  summary: TcoinsSummary | null,
  orderValue: number,
  wantsTcoins: boolean,
  promoApplied: boolean,
): number =>
  summary?.enabled && wantsTcoins && !promoApplied
    ? tcoinsRedeemableFor(summary, orderValue)
    : 0;
