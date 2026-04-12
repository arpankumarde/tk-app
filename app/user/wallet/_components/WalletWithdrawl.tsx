import { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useWithdrawals, Withdrawal } from "../../_hooks/useWithdrawals";

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

const STATUS_STYLE: Record<
  Withdrawal["status"],
  {
    label: string;
    bg: string;
    text: string;
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  pending: { label: "Pending", bg: "#FEF3C7", text: "#B45309", icon: "clock" },
  completed: {
    label: "Completed",
    bg: "#DCFCE7",
    text: "#15803D",
    icon: "check-circle",
  },
  rejected: {
    label: "Rejected",
    bg: "#FEE2E2",
    text: "#B91C1C",
    icon: "x-circle",
  },
  failed: {
    label: "Failed",
    bg: "#FEE2E2",
    text: "#B91C1C",
    icon: "x-circle",
  },
};

function WithdrawalItem({ item }: { item: Withdrawal }) {
  const style = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;

  return (
    <View className="py-4 border-b border-gray-100 dark:border-slate-800">
      <View className="flex-row items-center">
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: style.bg,
            marginRight: 12,
          }}
        >
          <Feather name={style.icon} size={18} color={style.text} />
        </View>
        <View className="flex-1 pr-2">
          <Text
            className="text-slate-700 dark:text-slate-200 font-bold text-[15px]"
            numberOfLines={1}
          >
            Withdrawal #{item.id}
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            Requested {formatDate(item.requestedDate || item.createdAt || "")}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-black text-base text-slate-800 dark:text-white">
            {formatCurrency(Math.abs(item.amount))}
          </Text>
          <View
            style={{
              marginTop: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: style.bg,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                textTransform: "uppercase",
                color: style.text,
              }}
            >
              {style.label}
            </Text>
          </View>
        </View>
      </View>
      {item.notes && (
        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-2 ml-[52px]">
          {item.notes}
        </Text>
      )}
      {item.transactionId && (
        <Text className="text-slate-400 text-[11px] mt-1 ml-[52px] font-mono">
          Txn ID: {item.transactionId}
        </Text>
      )}
    </View>
  );
}

export default function WalletWithdrawl({
  token,
  availableBalance,
  colorScheme,
  onWithdrawalCreated,
}: {
  token: string | null;
  availableBalance: number;
  colorScheme?: "light" | "dark";
  onWithdrawalCreated?: () => void;
}) {
  const {
    withdrawals,
    loading,
    refetch: refetchWithdrawals,
  } = useWithdrawals(token);

  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasPending = withdrawals.some((w) => w.status === "pending");

  const openModal = () => {
    if (hasPending) {
      Alert.alert(
        "Withdrawal in progress",
        "You already have a pending withdrawal. Please wait until it is processed before requesting another.",
      );
      return;
    }
    setAmount("");
    setNotes("");
    setModalOpen(true);
  };

  const submit = async () => {
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      Alert.alert("Invalid amount", "Enter a valid withdrawal amount.");
      return;
    }
    if (num < 100) {
      Alert.alert("Minimum amount", "Minimum withdrawal amount is ₹100.");
      return;
    }
    if (num > availableBalance) {
      Alert.alert(
        "Insufficient balance",
        `Your available balance is ${formatCurrency(availableBalance)}.`,
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/withdrawal/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            json: {
              amount: num,
              ...(notes.trim() ? { notes: notes.trim() } : {}),
            },
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      const payload = data.json || data;

      if (!res.ok || payload?.error) {
        const errMsg = Array.isArray(payload?.error)
          ? payload.error.map((e: { message: string }) => e.message).join("\n")
          : payload?.error || "Failed to submit withdrawal request.";
        Alert.alert("Request failed", errMsg);
        return;
      }

      setModalOpen(false);
      Alert.alert("Request submitted", "Your withdrawal request is pending.");
      refetchWithdrawals();
      onWithdrawalCreated?.();
    } catch (error) {
      console.error("Withdrawal request error:", error);
      Alert.alert("Network error", "Could not submit request. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-black text-slate-800 dark:text-white">
          Withdrawal Requests
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openModal}
          className="bg-primary rounded-xl px-4 py-2 flex-row items-center"
        >
          <Feather name="plus" size={14} color="#fff" />
          <Text className="text-white font-black text-xs ml-1">Request</Text>
        </TouchableOpacity>
      </View>

      {loading && withdrawals.length === 0 ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="#FF8A50" />
        </View>
      ) : withdrawals.length > 0 ? (
        <View className="bg-white dark:bg-slate-900 rounded-3xl px-5 border border-gray-100 dark:border-slate-800">
          {withdrawals.map((w) => (
            <WithdrawalItem key={w.id} item={w} />
          ))}
        </View>
      ) : (
        <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
          <Feather name="download" size={32} color="#CBD5E1" />
          <Text className="text-slate-700 dark:text-slate-200 font-black text-base mt-3">
            No withdrawals yet
          </Text>
          <Text className="text-slate-400 font-bold text-xs mt-1 text-center">
            Request a withdrawal from your available balance
          </Text>
        </View>
      )}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !submitting && setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colorScheme === "dark" ? "#0F172A" : "#FFFFFF",
              borderRadius: 24,
              padding: 24,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-800 dark:text-white text-xl font-black">
                Request Withdrawal
              </Text>
              <TouchableOpacity
                onPress={() => !submitting && setModalOpen(false)}
                activeOpacity={0.7}
              >
                <Feather
                  name="x"
                  size={22}
                  color={colorScheme === "dark" ? "#94A3B8" : "#64748B"}
                />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
              Available Balance
            </Text>
            <Text className="text-primary text-2xl font-black mb-5">
              {formatCurrency(availableBalance)}
            </Text>

            <Text className="text-slate-700 dark:text-slate-200 text-sm font-bold mb-2">
              Amount (min ₹100)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={
                colorScheme === "dark" ? "#64748B" : "#94A3B8"
              }
              editable={!submitting}
              style={{
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                fontWeight: "700",
                color: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
                marginBottom: 16,
              }}
            />

            <Text className="text-slate-700 dark:text-slate-200 text-sm font-bold mb-2">
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note"
              placeholderTextColor={
                colorScheme === "dark" ? "#64748B" : "#94A3B8"
              }
              editable={!submitting}
              multiline
              style={{
                borderWidth: 1,
                borderColor: colorScheme === "dark" ? "#334155" : "#E2E8F0",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colorScheme === "dark" ? "#F1F5F9" : "#1E293B",
                minHeight: 70,
                textAlignVertical: "top",
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={submit}
              disabled={submitting}
              activeOpacity={0.8}
              style={{
                backgroundColor: "#FF8A50",
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-black text-base">
                  Submit Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
