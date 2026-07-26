import BottomTabs from "@/components/BottomTabs";
import { bundleSavings } from "@/components/BundleCard";
import Header from "@/components/Header";
import Placeholder from "@/constants/placeholder";
import { useAuth } from "@/context/AuthContext";
import { useCartContext } from "@/context/CartContext";
import { useBuildShareUrl } from "@/hooks/useBuildShareUrl";
import {
  useBundleCheckout,
  type PromoPreview,
} from "@/hooks/useBundleCheckout";
import type { BundleDetails, BundleItem, BundleItemType } from "@/types/bundle";
import { buildPayuForm } from "@/utils/payuForm";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type CheckoutSource =
  | { html: string }
  | { uri: string; headers?: Record<string, string> };

const ITEM_META: Record<
  BundleItemType,
  { label: string; icon: "book-open" | "file-text" | "file"; color: string }
> = {
  course: { label: "Course", icon: "book-open", color: "#FF8A50" },
  test: { label: "Mock Test", icon: "file-text", color: "#3B82F6" },
  digital_product: { label: "Notes", icon: "file", color: "#10B981" },
};

const formatInr = (amount: number) =>
  Math.round(amount).toLocaleString("en-IN");

const stripHtml = (raw: string) =>
  raw
    .replace(/<[^>]*>?/gm, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

const itemMetaLine = (item: BundleItem) => {
  if (item.type === "course") {
    return [item.level, item.language].filter(Boolean).join(" · ");
  }
  if (item.type === "test") {
    return [
      item.totalQuestions ? `${item.totalQuestions} questions` : null,
      item.durationMinutes ? `${item.durationMinutes} min` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return item.pageCount ? `${item.pageCount} pages` : "";
};

const itemRoute = (item: BundleItem) => {
  if (!item.slug) return null;
  if (item.type === "course") return `/course/${item.slug}`;
  if (item.type === "test") return `/tests/${item.slug}`;
  return `/product/${item.slug}`;
};

const BundleDetailsScreen = () => {
  const { slug } = useLocalSearchParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token, user, setAuth } = useAuth();
  const buildShareUrl = useBuildShareUrl();
  // Payment verification is shared with the cart flow — same PayU transaction
  // endpoint, keyed by txnid.
  const { verifyPayment } = useCartContext();
  const {
    purchase,
    purchasing,
    validatePromo,
    validatingPromo,
    buildRedirectSource,
    checkItemAccess,
  } = useBundleCheckout();

  const [bundle, setBundle] = useState<BundleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [promoExpanded, setPromoExpanded] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoPreview | null>(null);

  const [checkoutSource, setCheckoutSource] = useState<CheckoutSource | null>(
    null,
  );
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const finishingRef = useRef(false);
  // The promo checkout page mints its own transaction, so we only hold a txnid
  // on the direct-purchase path.
  const txnidRef = useRef<string | null>(null);

  const fetchBundle = useCallback(async () => {
    if (!slugStr) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${BASE_URL}/_api/bundles/details?slug=${encodeURIComponent(slugStr)}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      const data = await response.json().catch(() => null);
      const payload = data?.json || data;

      if (!response.ok || !payload?.id) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "This bundle is no longer available.",
        );
      }

      setBundle(payload as BundleDetails);
    } catch (err: any) {
      console.error("Error fetching bundle details:", err);
      setError(err?.message || "Failed to load this bundle");
    } finally {
      setLoading(false);
    }
  }, [slugStr, token]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle]);

  const markEnrolled = useCallback(() => {
    setBundle((prev) => (prev ? { ...prev, isEnrolled: true } : prev));
  }, []);

  const openCheckout = (source: CheckoutSource, txnid: string | null) => {
    finishingRef.current = false;
    txnidRef.current = txnid;
    setCheckoutSource(source);
    setCheckoutVisible(true);
  };

  const closeCheckout = () => {
    setCheckoutVisible(false);
    setCheckoutSource(null);
  };

  const goToMyBundles = () => router.replace("/user/bundles" as any);

  /** Payment callback redirected back into the app — same shape as the cart. */
  const handleDeepLinkResult = async (params: {
    status: string | null;
    orderId: string | null;
    txnid: string | null;
    token: string | null;
  }) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    closeCheckout();

    if (params.status === "success") {
      // Refresh auth with the token issued by the payment callback.
      if (params.token && user) {
        await setAuth(user, params.token);
      }
      markEnrolled();
      Alert.alert("Payment Successful", "Your bundle is ready!", [
        { text: "OK", onPress: goToMyBundles },
      ]);
    } else if (params.status === "cancelled") {
      Alert.alert("Payment Cancelled", "Your payment was cancelled.");
    } else {
      Alert.alert(
        "Payment Failed",
        "Your payment could not be completed. Please try again.",
      );
    }
  };

  /**
   * Fallback when no deep link comes back — either the user closed the WebView
   * or PayU landed on the server callback page. Verify against the API, exactly
   * like the cart does.
   */
  const handleWebViewClose = async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    closeCheckout();

    const txnid = txnidRef.current;

    // The promo checkout page owns its transaction id, so fall back to the
    // bundle's own enrollment state there.
    if (!txnid) {
      setVerifying(true);
      const access = bundle ? await checkItemAccess(bundle.id) : null;
      setVerifying(false);

      if (access?.enrolled) {
        markEnrolled();
        Alert.alert("Payment Successful", "Your bundle is ready!", [
          { text: "OK", onPress: goToMyBundles },
        ]);
      } else {
        Alert.alert(
          "Payment Status Unknown",
          "Please check your orders for status.",
        );
      }
      return;
    }

    setVerifying(true);
    const result = await verifyPayment({ txnid });
    setVerifying(false);

    if (result.orderStatus === "completed") {
      markEnrolled();
      Alert.alert(
        "Payment Successful",
        result.message || "Your bundle is ready!",
        [{ text: "OK", onPress: goToMyBundles }],
      );
    } else if (result.orderStatus === "pending") {
      Alert.alert(
        "Payment Pending",
        "Your payment is being processed. We'll notify you once confirmed.",
      );
    } else if (result.orderStatus === "failed") {
      Alert.alert(
        "Payment Failed",
        result.message || "Your payment could not be completed.",
      );
    } else {
      Alert.alert(
        "Payment Status Unknown",
        "Please check your orders for status.",
      );
    }
  };

  const claimFreeBundle = async () => {
    if (!bundle) return;
    setClaiming(true);
    // The free-bundle branch server-side skips the per-item fan-out, so verify
    // the contained items actually unlocked instead of assuming they did.
    const access = await checkItemAccess(bundle.id);
    setClaiming(false);
    markEnrolled();
    Alert.alert(
      "Bundle Added",
      access.lockedCount > 0
        ? `You're enrolled in this bundle. ${access.lockedCount} of its items haven't unlocked yet — they usually appear within a few minutes. Contact support if they don't.`
        : "You now have access to everything in this bundle.",
      [
        { text: "Continue Browsing", style: "cancel" },
        { text: "My Bundles", onPress: goToMyBundles },
      ],
    );
  };

  const handleBuy = async () => {
    if (!bundle) return;

    if (!token) {
      router.push("/login");
      return;
    }

    if (bundle.isEnrolled) {
      router.push("/user/bundles" as any);
      return;
    }

    // A promo code can only be redeemed through the redirect checkout page.
    if (promo?.valid && promo.promoCodeId != null) {
      openCheckout(buildRedirectSource(bundle.id, promo.promoCodeId), null);
      return;
    }

    const outcome = await purchase(bundle.id);

    if (outcome.status === "alreadyEnrolled") {
      markEnrolled();
      Alert.alert(
        "Already Yours",
        "You already own this bundle. Find it under My Bundles.",
        [
          { text: "Continue Browsing", style: "cancel" },
          { text: "My Bundles", onPress: goToMyBundles },
        ],
      );
      return;
    }

    if (outcome.status === "error") {
      Alert.alert("Purchase Failed", outcome.message);
      return;
    }

    if (outcome.status === "free") {
      await claimFreeBundle();
      return;
    }

    openCheckout(
      { html: buildPayuForm(outcome.paymentData) },
      outcome.paymentData.txnid,
    );
  };

  const handleApplyPromo = async () => {
    if (!bundle || !promoCode.trim()) return;
    if (!token) {
      router.push("/login");
      return;
    }
    const preview = await validatePromo(
      bundle.id,
      bundle.price,
      promoCode.trim(),
    );
    setPromo(preview);
    if (preview.valid) setPromoExpanded(false);
  };

  const clearPromo = () => {
    setPromo(null);
    setPromoCode("");
  };

  const handleShare = async () => {
    if (!bundle) return;
    try {
      await Share.share({
        message: `Check out this bundle: ${bundle.title}\n${buildShareUrl(
          `${BASE_URL}/bundles/${bundle.slug}`,
        )}`,
      });
    } catch (err: any) {
      console.error("Error sharing bundle:", err?.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !bundle) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-10">
        <Feather name="package" size={44} color="#CBD5E1" />
        <Text className="text-xl font-bold text-slate-800 dark:text-white mt-4 mb-2 text-center">
          Bundle not available
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">
          {error || "This bundle may have been unpublished."}
        </Text>
        <View className="flex-row">
          <TouchableOpacity
            onPress={fetchBundle}
            className="border border-orange-200 dark:border-orange-800/50 px-6 py-3 rounded-xl mr-3"
          >
            <Text className="text-primary font-bold">Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/bundles" as any)}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-bold">Browse Bundles</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { savings, percent } = bundleSavings(
    bundle.price,
    bundle.originalPrice,
  );
  const discountPercent = Math.round(bundle.discountPercentage ?? percent);
  const isFree = (bundle.price ?? 0) === 0;
  const payable = Math.max(
    0,
    bundle.price - (promo?.valid ? promo.discountAmount : 0),
  );
  const items = [...(bundle.items || [])].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );
  const counts = items.reduce(
    (acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    },
    {} as Record<BundleItemType, number>,
  );
  const busy = purchasing || claiming || verifying;

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* Title & Description */}
          <View className="px-6 pt-4 pb-6">
            <Text className="text-3xl font-black text-slate-800 dark:text-white leading-[42px] mb-4">
              {bundle.title}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-base font-medium leading-6 mb-6">
              {bundle.description
                ? stripHtml(bundle.description)
                : "Everything in this pack, bought together for less than buying each item on its own."}
            </Text>

            {/* Metadata Row: Author */}
            <View className="flex-row items-center flex-wrap mb-6">
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                Created by{" "}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-primary font-bold text-sm">
                  {bundle.teacher?.displayName || "TestKart Expert"}
                </Text>
                <MaterialIcons
                  name="verified"
                  size={14}
                  color="#22C55E"
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>

            {/* Item Count Pill */}
            <View className="self-start px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full border border-orange-100 dark:border-orange-800/30 flex-row items-center">
              <Feather name="layers" size={12} color="#FF8A50" />
              <Text className="text-primary text-[10px] font-black tracking-widest ml-1.5 uppercase">
                {items.length} {items.length === 1 ? "Item" : "Items"} Included
              </Text>
            </View>
          </View>

          {/* Thumbnail */}
          <View className="px-6 mb-8">
            <View className="aspect-video w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-2xl">
              <Image
                source={{ uri: bundle.thumbnailUrl || Placeholder.COURSE }}
                className="w-full h-full"
                resizeMode="cover"
              />
              {discountPercent > 0 && savings > 0 && (
                <View className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 rounded-full shadow-sm">
                  <Text className="text-white text-[10px] font-black">
                    {discountPercent}% OFF
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View className="px-6">
            {bundle.isEnrolled && (
              <View className="flex-row items-center rounded-2xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/15 px-4 py-3 mb-5">
                <Feather name="check-circle" size={18} color="#16a34a" />
                <Text className="ml-2.5 flex-1 text-green-700 dark:text-green-400 font-bold text-sm">
                  You own this bundle — everything inside is unlocked.
                </Text>
              </View>
            )}

            {/* Value summary */}
            <View className="bg-white dark:bg-slate-800/50 rounded-[28px] border border-gray-100 dark:border-slate-700/80 p-5 mb-6 shadow-lg shadow-slate-200/50 dark:shadow-none">
              <View className="flex-row items-end justify-between mb-3">
                <View>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-wider mb-1">
                    Bundle Price
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text
                      className={`text-3xl font-black ${isFree ? "text-emerald-500" : "text-primary"}`}
                    >
                      {isFree ? "FREE" : `₹${formatInr(bundle.price)}`}
                    </Text>
                    {!isFree && savings > 0 && (
                      <Text className="ml-2 text-base text-slate-400 dark:text-slate-500 font-bold line-through">
                        ₹{formatInr(bundle.originalPrice)}
                      </Text>
                    )}
                  </View>
                </View>
                {savings > 0 && (
                  <View className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                    <Text className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      Save ₹{formatInr(savings)}
                    </Text>
                  </View>
                )}
              </View>

              <View className="h-[1px] bg-gray-50 dark:bg-slate-700/50 my-3" />

              <View className="flex-row flex-wrap">
                {(Object.keys(ITEM_META) as BundleItemType[]).map((type) =>
                  counts[type] ? (
                    <View
                      key={type}
                      className="flex-row items-center rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-1.5 mr-2 mb-2"
                    >
                      <Feather
                        name={ITEM_META[type].icon}
                        size={13}
                        color={ITEM_META[type].color}
                      />
                      <Text className="ml-1.5 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {counts[type]}{" "}
                        {counts[type] === 1
                          ? ITEM_META[type].label
                          : `${ITEM_META[type].label}s`}
                      </Text>
                    </View>
                  ) : null,
                )}
              </View>

              {/* Promo code — the redirect checkout applies it at payment time */}
              {!bundle.isEnrolled && !isFree && (
                <View className="mt-2">
                  {promo?.valid ? (
                    <View className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Feather
                          name="check-circle"
                          size={16}
                          color="#16a34a"
                        />
                        <Text
                          className="ml-2 text-sm font-black text-slate-800 dark:text-white"
                          numberOfLines={1}
                        >
                          {promoCode.trim().toUpperCase()}
                        </Text>
                        <Text className="ml-2 text-sm text-green-600 dark:text-green-400 font-bold">
                          -₹{formatInr(promo.discountAmount)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={clearPromo}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x" size={18} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        className="flex-row items-center justify-between py-1"
                        onPress={() => setPromoExpanded(!promoExpanded)}
                      >
                        <View className="flex-row items-center">
                          <Feather name="tag" size={16} color="#FF8A50" />
                          <Text className="ml-2 text-primary font-black text-sm">
                            Have a Promo Code?
                          </Text>
                        </View>
                        <Feather
                          name={promoExpanded ? "chevron-up" : "chevron-down"}
                          size={18}
                          color="#FF8A50"
                        />
                      </TouchableOpacity>

                      {promoExpanded && (
                        <View className="mt-3">
                          <View className="flex-row items-center">
                            <TextInput
                              className="flex-1 h-12 border border-gray-200 dark:border-slate-600 rounded-xl px-4 text-slate-800 dark:text-white bg-gray-50 dark:bg-slate-700 font-bold"
                              placeholder="Enter Promo Code"
                              placeholderTextColor={
                                colorScheme === "dark" ? "#64748b" : "#9ca3af"
                              }
                              value={promoCode}
                              onChangeText={setPromoCode}
                              autoCapitalize="characters"
                            />
                            <TouchableOpacity
                              className="ml-3 bg-primary h-12 px-6 rounded-xl items-center justify-center"
                              onPress={handleApplyPromo}
                              disabled={validatingPromo}
                            >
                              {validatingPromo ? (
                                <ActivityIndicator size="small" color="white" />
                              ) : (
                                <Text className="text-white font-black text-base">
                                  Apply
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {promo && !promo.valid && (
                    <Text className="mt-2 text-sm font-bold text-red-500 dark:text-red-400">
                      {promo.message}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Included items */}
            <Text className="text-2xl font-black text-slate-800 dark:text-white mb-1">
              What&apos;s Included
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
              {items.length} {items.length === 1 ? "item" : "items"} — bought
              separately they&apos;d cost ₹{formatInr(bundle.originalPrice)}
            </Text>

            <View className="mb-8">
              {items.map((item) => {
                const meta = ITEM_META[item.type] || ITEM_META.course;
                const route = itemRoute(item);
                const metaLine = itemMetaLine(item);

                return (
                  <TouchableOpacity
                    key={`${item.type}-${item.id}`}
                    activeOpacity={route ? 0.7 : 1}
                    disabled={!route}
                    onPress={() => route && router.push(route as any)}
                    className="flex-row items-center bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/80 rounded-2xl p-4 mb-3"
                  >
                    <View
                      className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: `${meta.color}1A` }}
                    >
                      <Feather name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-slate-800 dark:text-white font-black text-base leading-5"
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">
                        {[meta.label, metaLine].filter(Boolean).join(" · ")}
                      </Text>
                    </View>
                    <View className="items-end ml-2">
                      {item.price > 0 && (
                        <Text className="text-slate-400 dark:text-slate-500 text-sm font-bold line-through">
                          ₹{formatInr(item.price)}
                        </Text>
                      )}
                      {route && (
                        <Feather
                          name="chevron-right"
                          size={16}
                          color="#CBD5E1"
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Share */}
            <TouchableOpacity
              onPress={handleShare}
              className="h-14 rounded-2xl border border-orange-100 dark:border-orange-400/20 items-center justify-center mb-8"
            >
              <View className="flex-row items-center">
                <Feather name="share-2" size={18} color="#FF8A50" />
                <Text className="text-primary font-black text-base ml-2">
                  Share Bundle
                </Text>
              </View>
            </TouchableOpacity>

            {/* Disclaimer */}
            {bundle.disclaimer ? (
              <View className="mb-6 rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5">
                <View className="flex-row items-center px-4 py-3 bg-amber-100/60 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                  <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3">
                    <Feather name="alert-triangle" size={16} color="white" />
                  </View>
                  <Text className="text-amber-900 dark:text-amber-300 font-black text-sm uppercase tracking-wider">
                    Disclaimer
                  </Text>
                </View>
                <Text className="px-4 py-4 text-amber-900/80 dark:text-amber-200/80 text-[13px] leading-6 font-medium">
                  {stripHtml(
                    bundle.disclaimer.replace(/^\s*disclaimer\s*:\s*/i, ""),
                  )}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Sticky buy bar */}
      <View className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-6 py-4 flex-row items-center">
        <View className="flex-1 mr-3">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-tighter">
            {promo?.valid ? "Payable" : "Bundle Price"}
          </Text>
          <View className="flex-row items-baseline mt-1">
            <Text className="text-2xl font-black text-slate-800 dark:text-white">
              {isFree ? "FREE" : `₹${formatInr(payable)}`}
            </Text>
            {!isFree && promo?.valid && promo.discountAmount > 0 && (
              <Text className="ml-2 text-sm text-slate-400 dark:text-slate-500 font-bold line-through">
                ₹{formatInr(bundle.price)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleBuy}
          disabled={busy}
          className={`${
            bundle.isEnrolled
              ? "bg-emerald-500 shadow-emerald-500/30"
              : "bg-primary shadow-orange-500/30"
          } h-14 w-44 rounded-xl items-center justify-center shadow-lg disabled:opacity-60`}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black">
              {bundle.isEnrolled
                ? "My Bundles"
                : isFree
                  ? "Get Bundle"
                  : "Buy Bundle"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <BottomTabs />

      {/* PayU checkout WebView */}
      {checkoutSource && (
        <Modal
          visible={checkoutVisible}
          animationType="slide"
          onRequestClose={handleWebViewClose}
        >
          <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <TouchableOpacity
                onPress={handleWebViewClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name="x"
                  size={24}
                  color={colorScheme === "dark" ? "#fff" : "#1e293b"}
                />
              </TouchableOpacity>
              <Text className="ml-4 text-base font-black text-slate-800 dark:text-white">
                Complete Payment
              </Text>
            </View>
            <WebView
              source={checkoutSource}
              onShouldStartLoadWithRequest={(request) => {
                const { url } = request;
                // Intercept deep link redirect from payment callback
                if (url.startsWith("testkart://")) {
                  const queryString = url.split("?")[1] || "";
                  const params = new URLSearchParams(queryString);
                  handleDeepLinkResult({
                    status: params.get("status"),
                    orderId: params.get("order_id"),
                    txnid: params.get("txnid"),
                    token: params.get("token"),
                  });
                  return false;
                }
                // UPI collect flows hand off to an installed payment app.
                if (
                  url.startsWith("upi://") ||
                  url.startsWith("tez://") ||
                  url.startsWith("phonepe://") ||
                  url.startsWith("paytmmp://") ||
                  url.startsWith("intent://")
                ) {
                  Linking.openURL(url).catch(() => {
                    Alert.alert(
                      "App Not Found",
                      "No UPI app found to handle this payment.",
                    );
                  });
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(navState) => {
                // Bundle purchases don't carry a deep link back, so PayU lands
                // on the server callback instead — that's the end of the
                // payment leg, verify from there.
                if (
                  navState.url?.startsWith(
                    `${BASE_URL}/_api/payment/payu/callback`,
                  )
                ) {
                  handleWebViewClose();
                }
              }}
              onHttpError={({ nativeEvent }) => {
                // The promo-aware checkout page is the web app's own route; if
                // it won't accept our Bearer token there's no mobile path that
                // redeems the code, so fall back to the plain price.
                if (
                  !nativeEvent.url?.includes("/payu/bundle-redirect") ||
                  (nativeEvent.statusCode !== 401 &&
                    nativeEvent.statusCode !== 403)
                ) {
                  return;
                }
                finishingRef.current = true;
                setCheckoutVisible(false);
                setCheckoutSource(null);
                Alert.alert(
                  "Promo Code Unavailable",
                  "This promo code can't be applied from the app right now. Remove it to continue at the bundle price.",
                  [
                    { text: "Not now", style: "cancel" },
                    { text: "Remove code", onPress: clearPromo },
                  ],
                );
              }}
              // Card/netbanking flows redirect through bank 3-D Secure domains,
              // so the payment WebView can't be pinned to a fixed origin list.
              originWhitelist={[
                "https://*",
                "http://*",
                "upi://*",
                "tez://*",
                "phonepe://*",
                "paytmmp://*",
                "intent://*",
                "testkart://*",
              ]}
              startInLoadingState
              renderLoading={() => (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#FF8A50" />
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* Verifying overlay */}
      {verifying && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-10">
          <View className="bg-white dark:bg-slate-800 rounded-3xl px-8 py-10 items-center w-full max-w-sm">
            <ActivityIndicator size="large" color="#FF8A50" />
            <Text className="text-slate-800 dark:text-white font-black text-base mt-5 text-center">
              Verifying payment
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 text-center">
              This takes a few seconds. Please don&apos;t close the app.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BundleDetailsScreen;
