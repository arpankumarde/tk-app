import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import Feather, {
  type FeatherIconName,
} from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import DetailHeader from "@/components/DetailHeader";
import BottomTabs from "@/components/BottomTabs";
import { useWallet } from "../_hooks/useWallet";
import type { WalletTabHandle } from "../types";
import WalletTransaction from "./_components/WalletTransaction";
import WalletBank from "./_components/WalletBank";
import WalletWithdrawl from "./_components/WalletWithdrawl";
import { useTcoins } from "../_hooks/useTcoins";
import { WalletArcs } from "@/components/AccountArt";
import { themeColors } from "@/constants/theme";
import type { TcoinsSummary } from "@/utils/tcoins";

type WalletTab = "transactions" | "bank" | "withdrawal";

const TABS: {
  key: WalletTab;
  label: string;
  icon: FeatherIconName;
}[] = [
  { key: "transactions", label: "Transactions", icon: "list" },
  { key: "bank", label: "Bank details", icon: "credit-card" },
  { key: "withdrawal", label: "Withdrawal", icon: "download" },
];

const WALNUT = "#3B2A21";
const WALNUT_SOFT = "#D6C3B0";

function showTcoinRules(t: TcoinsSummary) {
  Alert.alert(
    "How T-coins work",
    `1 T-coin = ₹1. Pay up to ${t.redeemPercent}% of an order with them (at most ${t.maxRedeem}), and get ${t.cashbackPercent}% back on what you pay (up to ${t.maxCashback} per order). T-coins can't be withdrawn or used with a promo code.`,
  );
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function WalletScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
  const {
    balance,
    transactions,
    loading,
    loadingMore,
    hasMore,
    refetch,
    loadMore,
  } = useWallet(token);
  const { summary: tcoins, refetch: refetchTcoins } = useTcoins(token);
  const [activeTab, setActiveTab] = useState<WalletTab>("transactions");
  const [refreshing, setRefreshing] = useState(false);
  const tabRef = useRef<WalletTabHandle>(null);

  const availableBalance = balance?.availableBalance ?? 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchTcoins(), tabRef.current?.refresh()]);
    setRefreshing(false);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (activeTab !== "transactions" || !hasMore || loadingMore) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 200) loadMore();
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="Wallet" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={100}
      >
        {loading && !balance ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator color="#FF8A50" size="large" />
          </View>
        ) : (
          <>
            <View className="px-4 pt-5 pb-6">
              <View
                className="rounded-[28px] overflow-hidden"
                style={{ backgroundColor: WALNUT }}
              >
                <View className="absolute right-0 top-0">
                  <WalletArcs />
                </View>
                <View className="px-5 pt-5 flex-row items-start justify-between">
                  <Text className="text-sm" style={{ color: WALNUT_SOFT }}>
                    Wallet balance
                  </Text>
                  {tcoins?.enabled && (
                    <View className="flex-row items-center rounded-full bg-wheat-tint px-3 py-1.5">
                      <Feather name="disc" size={13} color="#8A6A22" />
                      <Text className="ml-1.5 text-xs font-bold text-wheat">
                        {tcoins.balance.toLocaleString("en-IN")} T-coins
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="px-5 mt-1 text-[44px] font-bold text-white">
                  {formatCurrency(availableBalance)}
                </Text>
                {!!tcoins?.enabled && tcoins.pendingCashback > 0 && (
                  <Text className="px-5 text-xs" style={{ color: WALNUT_SOFT }}>
                    {tcoins.pendingCashback} T-coins arrive once your pending
                    payment clears
                  </Text>
                )}

                <View
                  className="mx-5 mt-5 border-t border-dashed"
                  style={{ borderColor: "#6B5240" }}
                />

                <View className="flex-row px-5 pt-4 pb-5">
                  {[
                    { label: "Credited", value: balance?.totalCredits ?? 0 },
                    { label: "Spent", value: balance?.totalPurchased ?? 0 },
                    { label: "Withdrawn", value: balance?.totalWithdrawn ?? 0 },
                  ].map((stat, i) => (
                    <View
                      key={stat.label}
                      className={`flex-1 ${i > 0 ? "pl-4" : ""}`}
                      style={
                        i > 0
                          ? { borderLeftWidth: 1, borderLeftColor: "#6B5240" }
                          : undefined
                      }
                    >
                      <Text className="text-xs" style={{ color: WALNUT_SOFT }}>
                        {stat.label}
                      </Text>
                      <Text className="mt-1 text-base font-semibold text-white">
                        {formatCurrency(stat.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {tcoins?.enabled && (
                <TouchableOpacity
                  onPress={() => showTcoinRules(tcoins)}
                  className="mt-3 self-start flex-row items-center px-1"
                >
                  <Feather name="info" size={14} color={c.inkSoft} />
                  <Text className="ml-1.5 text-sm font-semibold text-ink-soft dark:text-night-soft">
                    How T-coins work
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="px-4 mb-4">
              <View className="flex-row bg-sand dark:bg-night-raised rounded-2xl p-1">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.8}
                      onPress={() => setActiveTab(tab.key)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                      className={`flex-1 h-10 flex-row items-center justify-center rounded-xl ${
                        isActive ? "bg-white dark:bg-night-line" : ""
                      }`}
                    >
                      <Feather
                        name={tab.icon}
                        size={14}
                        color={isActive ? c.ink : c.inkSoft}
                      />
                      <Text
                        className={`ml-1.5 text-xs ${
                          isActive
                            ? "font-bold text-ink dark:text-white"
                            : "font-semibold text-ink-soft dark:text-night-soft"
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tab Content */}
            <View className="px-4">
              {activeTab === "transactions" && (
                <WalletTransaction
                  transactions={transactions}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                />
              )}

              {activeTab === "bank" && (
                <WalletBank
                  ref={tabRef}
                  token={token}
                  colorScheme={colorScheme}
                />
              )}

              {activeTab === "withdrawal" && (
                <WalletWithdrawl
                  ref={tabRef}
                  token={token}
                  availableBalance={availableBalance}
                  colorScheme={colorScheme}
                  onWithdrawalCreated={refetch}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
