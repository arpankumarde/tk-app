import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { router } from "expo-router";
import { OrderSummary } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_LIMIT = 10;

const statusColors: Record<
  string,
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
  processing: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "Processing",
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

const getStatusStyle = (status: string) =>
  statusColors[status.toLowerCase()] || {
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
  });
};

export default function OrdersScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchOrders = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!token) return;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const response = await fetch(
          `${BASE_URL}/_api/orders/list?page=${pageNum}&limit=${PAGE_LIMIT}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch orders");

        const data = await response.json();
        const payload = data.json || data;
        const fetched: OrderSummary[] = payload.orders || [];

        if (append) {
          setOrders((prev) => [...prev, ...fetched]);
        } else {
          setOrders(fetched);
        }

        setHasMore(fetched.length === PAGE_LIMIT);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchOrders(1, false);
  }, [fetchOrders]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage, true);
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
      >
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-1">
            My Orders
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">
            Your purchase history
          </Text>
        </View>

        <View className="px-6">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : orders.length > 0 ? (
            <>
              {orders.map((order) => {
                const style = getStatusStyle(order.status);

                return (
                  <TouchableOpacity
                    key={order.id}
                    onPress={() =>
                      router.push({ pathname: "/user/orders/[id]", params: { id: String(order.id) } })
                    }
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm mb-4 overflow-hidden"
                  >
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-slate-800 dark:text-white font-black text-base">
                          Order #{order.id}
                        </Text>
                        <View className={`${style.bg} px-3 py-1 rounded-full`}>
                          <Text
                            className={`${style.text} font-black text-[10px] uppercase`}
                          >
                            {style.label}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 mr-3 items-center justify-center">
                          <Feather name="package" size={18} color="#94A3B8" />
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm flex-1">
                          {order.itemCount} item
                          {order.itemCount !== 1 ? "s" : ""}
                        </Text>
                        <Feather
                          name="chevron-right"
                          size={20}
                          color="#CBD5E1"
                        />
                      </View>

                      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-800">
                        <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs">
                          {formatDate(order.createdAt)}
                        </Text>
                        <Text className="text-slate-800 dark:text-white font-black text-base">
                          ₹{order.totalAmount}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {hasMore && (
                <TouchableOpacity
                  onPress={loadMore}
                  disabled={loadingMore}
                  className="bg-primary/10 dark:bg-primary/20 p-4 rounded-2xl items-center mb-4"
                >
                  {loadingMore ? (
                    <ActivityIndicator color="#FF8A50" />
                  ) : (
                    <Text className="text-primary font-black text-sm">
                      Load More
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
              <Feather name="shopping-cart" size={40} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-3 text-base">
                No orders yet
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                Your order history will appear here
              </Text>
            </View>
          )}
        </View>

        <View className="h-10" />
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
