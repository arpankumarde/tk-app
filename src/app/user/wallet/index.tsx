import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useWallet } from "../_hooks/useWallet";
import WalletTransaction from "./_components/WalletTransaction";
import WalletBank from "./_components/WalletBank";
import WalletWithdrawl from "./_components/WalletWithdrawl";

type WalletTab = "transactions" | "bank" | "withdrawal";

const TABS: {
  key: WalletTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { key: "transactions", label: "Transactions", icon: "list" },
  { key: "bank", label: "Bank Details", icon: "credit-card" },
  { key: "withdrawal", label: "Withdrawal", icon: "download" },
];

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function WalletScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();
  const {
    balance,
    transactions,
    loading,
    loadingMore,
    hasMore,
    refetch,
    loadMore,
  } = useWallet(token);
  const [activeTab, setActiveTab] = useState<WalletTab>("transactions");

  const availableBalance = balance?.availableBalance ?? 0;

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
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <Header />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
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
            {/* Balance Card */}
            <View className="px-6 pt-6 pb-4">
              <View className="bg-primary rounded-3xl p-6 shadow-lg shadow-primary/30">
                <Text className="text-white/70 font-bold text-sm uppercase tracking-widest mb-1">
                  Available Balance
                </Text>
                <Text className="text-white text-4xl font-black">
                  {formatCurrency(availableBalance)}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View className="px-6 mb-6">
              <View className="bg-white dark:bg-slate-900 rounded-[28px] p-5 flex-row items-center border border-gray-200 dark:border-slate-700 shadow-sm">
                <View className="items-center flex-1">
                  <Text className="text-lg font-black text-green-600 dark:text-green-400">
                    {formatCurrency(balance?.totalCredits ?? 0)}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Credited
                  </Text>
                </View>
                <View className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700" />
                <View className="items-center flex-1">
                  <Text className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(balance?.totalPurchased ?? 0)}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Purchased
                  </Text>
                </View>
                <View className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700" />
                <View className="items-center flex-1">
                  <Text className="text-lg font-black text-red-500 dark:text-red-400">
                    {formatCurrency(balance?.totalWithdrawn ?? 0)}
                  </Text>
                  <Text className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Withdrawn
                  </Text>
                </View>
              </View>
            </View>

            {/* Tabs */}
            <View className="px-6 mb-4">
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor:
                    colorScheme === "dark" ? "#0F172A" : "#F3F4F6",
                  borderRadius: 16,
                  padding: 4,
                }}
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const inactiveIconColor =
                    colorScheme === "dark" ? "#94A3B8" : "#64748B";
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.8}
                      onPress={() => setActiveTab(tab.key)}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isActive
                          ? colorScheme === "dark"
                            ? "#1E293B"
                            : "#FFFFFF"
                          : "transparent",
                        shadowColor: isActive ? "#000" : "transparent",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isActive ? 0.05 : 0,
                        shadowRadius: 2,
                        elevation: isActive ? 1 : 0,
                      }}
                    >
                      <Feather
                        name={tab.icon}
                        size={14}
                        color={isActive ? "#FF8A50" : inactiveIconColor}
                      />
                      <Text
                        style={{
                          marginLeft: 6,
                          fontSize: 12,
                          fontWeight: "700",
                          color: isActive ? "#FF8A50" : inactiveIconColor,
                        }}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tab Content */}
            <View className="px-6">
              {activeTab === "transactions" && (
                <WalletTransaction
                  transactions={transactions}
                  loadingMore={loadingMore}
                  hasMore={hasMore}
                />
              )}

              {activeTab === "bank" && (
                <WalletBank token={token} colorScheme={colorScheme} />
              )}

              {activeTab === "withdrawal" && (
                <WalletWithdrawl
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
