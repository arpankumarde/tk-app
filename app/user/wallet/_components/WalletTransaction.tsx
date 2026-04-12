import { View, Text, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WalletTransaction as WalletTransactionData } from "../../types";

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

const CREDIT_TYPES: WalletTransactionData["transactionType"][] = [
  "prize_credit",
  "prize_lock_refund",
];

const TYPE_META: Record<
  WalletTransactionData["transactionType"],
  { label: string; icon: keyof typeof Feather.glyphMap }
> = {
  prize_credit: { label: "Prize", icon: "award" },
  prize_lock_refund: { label: "Refund", icon: "rotate-ccw" },
  purchase_debit: { label: "Purchase", icon: "shopping-bag" },
  withdrawal_debit: { label: "Withdrawal", icon: "arrow-up-right" },
};

function TransactionItem({ item }: { item: WalletTransactionData }) {
  const isCredit = CREDIT_TYPES.includes(item.transactionType);
  const meta = TYPE_META[item.transactionType];

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
          name={meta.icon}
          size={18}
          color={isCredit ? "#22C55E" : "#EF4444"}
        />
      </View>
      <View className="flex-1 pr-2">
        <Text
          className="text-slate-700 dark:text-slate-200 font-bold text-[15px]"
          numberOfLines={1}
        >
          {item.description || meta.label}
        </Text>
        <Text className="text-slate-400 text-xs mt-0.5">
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text
        className={`font-black text-base ${
          isCredit
            ? "text-green-600 dark:text-green-400"
            : "text-red-500 dark:text-red-400"
        }`}
      >
        {isCredit ? "+" : "-"}
        {formatCurrency(Math.abs(item.amount))}
      </Text>
    </View>
  );
}

export default function WalletTransaction({
  transactions,
  loadingMore,
  hasMore,
}: {
  transactions: WalletTransactionData[];
  loadingMore: boolean;
  hasMore: boolean;
}) {
  if (transactions.length === 0) {
    return (
      <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
        <Feather name="inbox" size={32} color="#CBD5E1" />
        <Text className="text-slate-400 font-bold mt-2">
          No transactions yet
        </Text>
      </View>
    );
  }

  return (
    <>
      <View className="bg-white dark:bg-slate-900 rounded-3xl px-5 border border-gray-100 dark:border-slate-800">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} item={tx} />
        ))}
      </View>
      {loadingMore && (
        <View className="py-4 items-center">
          <ActivityIndicator color="#FF8A50" />
        </View>
      )}
      {!hasMore && !loadingMore && (
        <Text className="text-slate-400 font-bold text-xs text-center py-4">
          No more transactions
        </Text>
      )}
    </>
  );
}
