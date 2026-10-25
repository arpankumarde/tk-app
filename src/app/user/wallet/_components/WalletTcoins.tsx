import { View, Text } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import type { TcoinHistoryEntry, TcoinsSummary } from "@/utils/tcoins";

const RECENT_LIMIT = 5;

const statusText = (entry: TcoinHistoryEntry) =>
  entry.status === "pending"
    ? "Payment pending"
    : entry.status === "refunded"
      ? "Refunded"
      : "Completed";

/** Renders nothing while Tcoins are switched off. */
const WalletTcoins = ({ summary }: { summary: TcoinsSummary | null }) => {
  if (!summary?.enabled) return null;

  const recent = summary.history.slice(0, RECENT_LIMIT);

  return (
    <View className="px-6 mb-6">
      <View className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
        <View className="flex-row items-center mb-1">
          <Feather name="disc" size={16} color="#FF8A50" />
          <Text className="ml-2 text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">
            Tcoins
          </Text>
        </View>
        <Text className="text-3xl font-black text-primary">
          {summary.balance.toLocaleString("en-IN")}
          <Text className="text-base font-black"> coins</Text>
        </Text>
        {summary.pendingCashback > 0 && (
          <Text className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            {summary.pendingCashback} more coins arrive once your pending
            payment goes through.
          </Text>
        )}

        <View className="mt-4">
          <Text className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-5">
            1 Tcoin = ₹1. Use them to pay up to {summary.redeemPercent}% of any
            order (at most {summary.maxRedeem} coins), and earn {summary.cashbackPercent}% back on what you pay (up
            to {summary.maxCashback} coins per order). Tcoins can&apos;t be
            withdrawn or combined with a promo code.
          </Text>
        </View>

        {recent.length > 0 && (
          <View className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-3">
            {recent.map((entry) => {
              const counts = entry.status !== "refunded";
              return (
                <View
                  key={entry.orderId}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className="text-sm font-black text-slate-800 dark:text-white"
                      numberOfLines={1}
                    >
                      {entry.title}
                    </Text>
                    <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      - {statusText(entry)}
                    </Text>
                  </View>
                  <View className="items-end">
                    {entry.tcoinsCashback > 0 && (
                      <Text
                        className={`text-sm font-black ${
                          counts && entry.status === "completed"
                            ? "text-green-600 dark:text-green-400"
                            : "text-slate-400 dark:text-slate-500 line-through"
                        }`}
                      >
                        +{entry.tcoinsCashback}
                      </Text>
                    )}
                    {entry.tcoinsRedeemed > 0 && (
                      <Text
                        className={`text-sm font-black ${
                          counts
                            ? "text-slate-800 dark:text-white"
                            : "text-slate-400 dark:text-slate-500 line-through"
                        }`}
                      >
                        -{entry.tcoinsRedeemed}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

export default WalletTcoins;
