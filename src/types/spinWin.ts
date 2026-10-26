// Mirrors the Floot `spin-win/*` endpoint outputs. Dates arrive as ISO strings over the wire.

export type SpinCategory = "test_series" | "courses" | "study_notes";

export type SpinCouponStatus = "active" | "reserved" | "redeemed" | "expired" | "void";

export type SpinViewCoupon = {
  code: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  eligibleCategories: string[];
  expiresAt: string;
  status: SpinCouponStatus;
};

export type SpinViewState = {
  spinId: string;
  rewardId: number;
  /** Position on the wheel's active segments, or -1 when that reward has since been switched off. */
  wheelIndex: number;
  rewardName: string;
  wheelLabel: string;
  rewardType: string;
  discountType: "percentage" | "flat" | null;
  discountValue: number | null;
  minOrderValue: number | null;
  maxDiscountAmount: number | null;
  eligibleCategories: string[];
  expiresAt: string;
  claimStatus: string;
  requiresLogin: boolean;
  coupon: SpinViewCoupon | null;
};

export type SpinSegment = {
  rewardId: number;
  label: string;
  color: string;
  icon: string | null;
  probability: number;
  discountType: "percentage" | "flat" | null;
  discountValue: number | null;
};

export type SpinCampaignView = {
  campaign: {
    slug: string;
    name: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    phase: "draft" | "scheduled" | "active" | "paused" | "completed" | "expired";
    allowGuestSpins: boolean;
    loginRequiredToSpin: boolean;
    eligibleCategories: string[];
    couponExpiresAt: string;
    maxDiscountPercent: number;
    popupEnabled: boolean;
    popupDelaySeconds: number;
  };
  segments: SpinSegment[];
  viewer: {
    loggedIn: boolean;
    role: string | null;
    canSpin: boolean;
    reason: string | null;
    spin: SpinViewState | null;
  };
};

export type SpinResult = {
  spin: SpinViewState;
  alreadySpun: boolean;
  message: string | null;
};

export type ClaimResult = {
  spin: SpinViewState | null;
  forfeited: boolean;
  message: string | null;
};

export type MySpinCoupon = {
  id: number;
  code: string;
  campaignName: string;
  campaignSlug: string;
  rewardName: string;
  discountType: "percentage" | "flat";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  maxDiscountPercent: number;
  eligibleCategories: string[];
  issuedAt: string;
  expiresAt: string;
  status: SpinCouponStatus;
  orderId: number | null;
  savedAmount: number | null;
  redeemedAt: string | null;
};
