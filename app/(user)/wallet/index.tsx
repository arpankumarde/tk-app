import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useWallet } from "../hooks/useWallet";
import { WalletTransaction } from "../types";

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TransactionItem({ item }: { item: WalletTransaction }) {
  const isCredit = item.type === "credit";

  return (
    <View className="flex-row items-center py-4 border-b border-gray-100 dark:border-slate-800">
      <View
        className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
          isCredit
            ? "bg-green-50 dark:bg-green-900/20"
            : "bg-red-50 dark:bg-red-900/20"
        }`}
      >
        <Feather
          name={isCredit ? "arrow-down-left" : "arrow-up-right"}
          size={18}
          color={isCredit ? "#22C55E" : "#EF4444"}
        />
      </View>
      <View className="flex-1">
        <Text
          className="text-slate-700 dark:text-slate-200 font-bold text-[15px]"
          numberOfLines={1}
        >
          {item.description || (isCredit ? "Credit" : "Debit")}
        </Text>
        <Text className="text-slate-400 text-xs mt-0.5">
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text
        className={`font-black text-base ${
          isCredit ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(Math.abs(item.amount))}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();
  const { balance, transactions, loading, refetch } = useWallet(token);

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
                  {formatCurrency(balance?.availableBalance ?? 0)}
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

            {/* Transactions */}
            <View className="px-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-3">
                Transactions
              </Text>

              {transactions.length > 0 ? (
                <View className="bg-white dark:bg-slate-900 rounded-3xl px-5 border border-gray-100 dark:border-slate-800">
                  {transactions.map((tx) => (
                    <TransactionItem key={tx.id} item={tx} />
                  ))}
                </View>
              ) : (
                <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
                  <Feather name="inbox" size={32} color="#CBD5E1" />
                  <Text className="text-slate-400 font-bold mt-2">
                    No transactions yet
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
