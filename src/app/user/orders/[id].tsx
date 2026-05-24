import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import { useLocalSearchParams, router } from "expo-router";
import { useOrderDetails } from "../_hooks/useOrders";
import Placeholder from "@/constants/placeholder";
import { OrderItemType, OrderStatus } from "../types";

const statusColors: Record<
  OrderStatus,
  { bg: string; text: string; label: string }
> = {
  completed: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    label: "Completed",
  },
  pending: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-600 dark:text-yellow-400",
    label: "Pending",
  },
  cancelled: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    label: "Cancelled",
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    label: "Failed",
  },
};

const getStatusStyle = (status: OrderStatus) =>
  statusColors[status] || {
    bg: "bg-gray-50 dark:bg-gray-900/20",
    text: "text-gray-600 dark:text-gray-400",
    label: status,
  };

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getPlaceholder = (itemType: OrderItemType) => {
  switch (itemType) {
    case "course":
      return Placeholder.COURSE;
    case "test":
      return Placeholder.TEST;
    case "product":
      return Placeholder.NOTE;
    default:
      return null;
  }
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();
  const { order, loading, error } = useOrderDetails(token, Number(id));

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator color="#FF8A50" size="large" />
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
          >
            <Feather
              name="arrow-left"
              size={20}
              color={colorScheme === "dark" ? "#fff" : "#1E293B"}
            />
          </TouchableOpacity>
          <Text className="text-xl font-black text-slate-800 dark:text-white">
            Order Details
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
          <Text className="text-slate-400 font-bold mt-3 text-base text-center">
            {error || "Order not found"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const style = getStatusStyle(order.status);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3"
        >
          <Feather
            name="arrow-left"
            size={20}
            color={colorScheme === "dark" ? "#fff" : "#1E293B"}
          />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-black text-slate-800 dark:text-white">
            Order #{order.id}
          </Text>
          <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs">
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View className={`${style.bg} px-3 py-1.5 rounded-full`}>
          <Text className={`${style.text} font-black text-xs uppercase`}>
            {style.label}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Items */}
        <View className="px-6 mt-2">
          <Text className="text-lg font-black text-slate-800 dark:text-white mb-3">
            Items ({order.items?.length || 0})
          </Text>

          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden">
            {order.items?.map((item, index) => (
              <View
                key={item.orderItemId}
                className={`flex-row items-center p-4 ${index !== order.items.length - 1 ? "border-b border-gray-50 dark:border-slate-800" : ""}`}
              >
                {item.thumbnailUrl || getPlaceholder(item.itemType) ? (
                  <Image
                    source={{
                      uri: item.thumbnailUrl || getPlaceholder(item.itemType)!,
                    }}
                    className="w-16 h-16 rounded-xl mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 mr-3 items-center justify-center">
                    <Feather name="package" size={20} color="#94A3B8" />
                  </View>
                )}

                <View className="flex-1">
                  <Text
                    className="text-slate-800 dark:text-white font-black text-base"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full self-start mt-1">
                    <Text className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase">
                      {item.itemType}
                    </Text>
                  </View>
                </View>

                <Text className="text-slate-800 dark:text-white font-black text-base ml-2">
                  ₹{item.priceAtPurchase}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Summary */}
        <View className="px-6 mt-6">
          <Text className="text-lg font-black text-slate-800 dark:text-white mb-3">
            Payment Summary
          </Text>

          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-5">
            {order.paymentTransactionId && (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                  Transaction ID
                </Text>
                <Text
                  className="text-slate-700 dark:text-slate-200 font-bold text-sm"
                  numberOfLines={1}
                >
                  {order.paymentTransactionId}
                </Text>
              </View>
            )}

            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-800">
              <Text className="text-slate-800 dark:text-white font-black text-base">
                Total
              </Text>
              <Text className="text-primary font-black text-xl">
                ₹{order.totalAmount}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
