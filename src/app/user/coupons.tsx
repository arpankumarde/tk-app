import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import * as Clipboard from "expo-clipboard";
import Feather from "@react-native-vector-icons/feather";
import { router, type Href } from "expo-router";
import DetailHeader from "@/components/DetailHeader";
import BottomTabs from "@/components/BottomTabs";
import { useAuth } from "@/context/AuthContext";
import {
  CATEGORY_LABELS,
  discountLabel,
  shopRouteFor,
  spinDate,
  useMySpinCoupons,
} from "@/hooks/useSpinWin";
import type { MySpinCoupon, SpinCouponStatus } from "@/types/spinWin";

const STATUS_STYLES: Record<SpinCouponStatus, { bg: string; text: string; label: string }> = {
  active: {
    bg: "bg-green-50 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    label: "Active",
  },
  reserved: {
    bg: "bg-yellow-50 dark:bg-yellow-900/40",
    text: "text-yellow-800 dark:text-yellow-200",
    label: "In checkout",
  },
  redeemed: {
    bg: "bg-sky-tint dark:bg-night-raised",
    text: "text-sky dark:text-sky-light",
    label: "Redeemed",
  },
  expired: {
    bg: "bg-sand dark:bg-night-raised",
    text: "text-ink dark:text-night-soft",
    label: "Expired",
  },
  void: {
    bg: "bg-red-50 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
    label: "Void",
  },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-ink-soft dark:text-night-soft text-[13px] font-semibold">{label}</Text>
      <Text className="text-ink dark:text-white text-[13px] font-bold flex-1 text-right ml-4">
        {value}
      </Text>
    </View>
  );
}

function CouponCard({ coupon }: { coupon: MySpinCoupon }) {
  const [copied, setCopied] = useState(false);
  const status = STATUS_STYLES[coupon.status] ?? STATUS_STYLES.expired;
  const usable = coupon.status === "active" || coupon.status === "reserved";

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy is a convenience; the code stays selectable.
    }
  };

  return (
    <View className="bg-white dark:bg-night rounded-3xl border border-line dark:border-night-line shadow-sm mb-4 p-4">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-xs font-bold text-ink-soft dark:text-night-soft">
            {coupon.campaignName}
          </Text>
          <Text className="text-2xl font-extrabold text-ink dark:text-white">
            {discountLabel(coupon.discountType, coupon.discountValue).toUpperCase()}
          </Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${status.bg}`}>
          <Text className={`text-xs font-bold ${status.text}`}>{status.label}</Text>
        </View>
      </View>

      <View className="rounded-2xl border-2 border-dashed border-primary bg-clay-tint dark:bg-night-raised px-3 py-2.5 mb-3">
        <View className="flex-row items-center justify-between mb-1 min-h-[36px]">
          <Text className="text-[11px] font-semibold text-ink-soft dark:text-night-soft">
            Coupon code
          </Text>
          {usable ? (
            <TouchableOpacity
              onPress={copy}
              className="flex-row items-center rounded-full bg-primary-deep px-3 min-h-[36px]"
            >
              <Feather name={copied ? "check" : "copy"} size={14} color="#2D2A24" />
              <Text className="ml-1.5 text-[13px] font-bold text-ink">
                {copied ? "Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="text-xl font-bold tracking-wider text-ink dark:text-white"
        >
          {coupon.code}
        </Text>
      </View>

      <Row label="Minimum eligible order" value={`₹${coupon.minOrderValue}`} />
      {coupon.maxDiscountAmount !== null ? (
        <Row label="Maximum discount" value={`₹${coupon.maxDiscountAmount}`} />
      ) : null}
      <Row
        label="Valid on"
        value={coupon.eligibleCategories.map((c) => CATEGORY_LABELS[c] ?? c).join(", ")}
      />
      <Row
        label={coupon.status === "expired" ? "Expired" : "Expires"}
        value={spinDate(coupon.expiresAt)}
      />
      {coupon.savedAmount !== null ? (
        <Row label="You saved" value={`₹${coupon.savedAmount}`} />
      ) : null}

      {coupon.status === "active" ? (
        <TouchableOpacity
          onPress={() => router.push(shopRouteFor(coupon.eligibleCategories) as Href)}
          className="mt-3 flex-row items-center justify-center rounded-full bg-primary-deep min-h-[44px]"
        >
          <Feather name="shopping-bag" size={16} color="#2D2A24" />
          <Text className="ml-2 font-extrabold text-ink">Shop Now</Text>
        </TouchableOpacity>
      ) : null}
      {coupon.status === "reserved" ? (
        <Text className="mt-2 text-xs text-ink-soft dark:text-night-soft">
          This coupon is held by a checkout in progress. If that payment fails or is cancelled, you
          can use it again.
        </Text>
      ) : null}
    </View>
  );
}

export default function MyCouponsScreen() {
  const { colorScheme } = useColorScheme();
  const { token, loading: authLoading } = useAuth();
  const { coupons, loading, error, refetch } = useMySpinCoupons();

  useEffect(() => {
    if (!authLoading && !token) router.replace("/login");
  }, [authLoading, token]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-paper dark:bg-night">
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <DetailHeader title="Coupons" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} tintColor="#FF8A50" />
        }
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-ink-soft dark:text-night-soft font-semibold text-sm mb-6">
            Rewards from Spin & Win. Apply a code in your cart.
          </Text>
        </View>

        <View className="px-6">
          {loading && coupons.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : error ? (
            <View className="bg-red-50 dark:bg-red-950 p-4 rounded-2xl">
              <Text className="text-red-700 dark:text-red-300 font-semibold">{error}</Text>
              <TouchableOpacity onPress={refetch} className="mt-3 self-start">
                <Text className="text-red-800 dark:text-red-200 font-extrabold underline">Try again</Text>
              </TouchableOpacity>
            </View>
          ) : coupons.length > 0 ? (
            coupons.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)
          ) : (
            <View className="bg-white dark:bg-night p-12 rounded-3xl border border-line dark:border-night-line border-dashed items-center">
              <Feather name="gift" size={40} color="#B5AEA3" />
              <Text className="text-ink dark:text-white font-bold mt-3 text-base">
                No coupons yet
              </Text>
              <Text className="text-ink-soft dark:text-night-soft text-sm mt-1 text-center">
                Coupons you win on Spin & Win appear here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
