import { View, Text, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import {
  tcoinsCashbackFor,
  tcoinsRedeemableFor,
  type TcoinsSummary,
} from "@/utils/tcoins";

interface Props {
  summary: TcoinsSummary;
  /** The order value before promo codes. Coins can cover redeemPercent of it, up to maxRedeem coins. */
  orderValue: number;
  /** What the student pays in cash with the current choice. Cashback is earned on this. */
  amountToPay: number;
  checked: boolean;
  onToggle: () => void;
  promoApplied: boolean;
}

/** Renders nothing while Tcoins are switched off. */
const TcoinsCheckoutOption = ({
  summary,
  orderValue,
  amountToPay,
  checked,
  onToggle,
  promoApplied,
}: Props) => {
  if (!summary.enabled) return null;

  const redeemable = tcoinsRedeemableFor(summary, orderValue);
  const canUse = redeemable > 0 && !promoApplied;
  const isOn = checked && canUse;
  const cashback = tcoinsCashbackFor(summary, amountToPay);

  const hint =
    promoApplied && redeemable > 0
      ? "Tcoins can't be combined with a promo code. Remove the code to use them."
      : summary.balance <= 0
        ? "You have no Tcoins yet. Earn them as cashback on paid orders."
        : canUse
          ? `Balance ${summary.balance} Tcoins. Pay up to ${summary.redeemPercent}% of an order (at most ${summary.maxRedeem} Tcoins) with Tcoins.`
          : `Balance ${summary.balance} Tcoins. This order is too small to use them.`;

  return (
    <View className="mb-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 p-4">
      <TouchableOpacity
        className="flex-row items-start"
        onPress={onToggle}
        disabled={!canUse}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isOn, disabled: !canUse }}
      >
        <View
          className={`w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5 ${
            isOn
              ? "bg-primary border-primary"
              : "border-slate-400 dark:border-slate-500"
          }`}
        >
          {isOn && <Feather name="check" size={14} color="white" />}
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Feather name="disc" size={16} color="#FF8A50" />
            <Text className="ml-2 text-base font-black text-slate-800 dark:text-white">
              {canUse
                ? `Use ${redeemable} Tcoins and save ₹${redeemable}`
                : "Tcoins"}
            </Text>
          </View>
          <Text className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
            {hint}
          </Text>
        </View>
      </TouchableOpacity>
      {cashback > 0 && (
        <View className="mt-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2">
          <Text className="text-sm font-bold text-green-700 dark:text-green-400 text-center">
            You earn {cashback} Tcoins cashback on this order
          </Text>
        </View>
      )}
    </View>
  );
};

export default TcoinsCheckoutOption;
