import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { Directory, Paths } from "expo-file-system";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import PurchasedProductCard from "../_components/PurchasedProductCard";
import { PurchasedProduct } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_LIMIT = 20;

export default function PurchasedProductsScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();

  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [clearing, setClearing] = useState(false);

  const handleClearDownloads = () => {
    Alert.alert(
      "Clear Downloads",
      "Delete all downloaded files from this device? You can re-download them anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              setClearing(true);
              const downloads = new Directory(Paths.cache, "downloads");
              if (downloads.exists) {
                downloads.delete();
              }
              Alert.alert("Done", "All downloaded files have been cleared.");
            } catch (error: any) {
              console.error("Clear downloads error:", error);
              Alert.alert(
                "Error",
                `Could not clear downloads: ${error?.message}`,
              );
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const fetchProducts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!token) return;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const response = await fetch(
          `${BASE_URL}/_api/student/shop/purchases?page=${pageNum}&limit=${PAGE_LIMIT}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch purchases");

        const data = await response.json();
        const payload = data.json || data;
        const purchases: PurchasedProduct[] = payload.purchases || [];

        if (append) {
          setProducts((prev) => [...prev, ...purchases]);
        } else {
          setProducts(purchases);
        }

        setHasMore(purchases.length === PAGE_LIMIT);
      } catch (error) {
        console.error("Error fetching purchased products:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
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
            My Purchases
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-4">
            All your purchased digital products
          </Text>

          {/* TEMP: Dev tool to clear cached downloads. Remove before release. */}
          <TouchableOpacity
            onPress={handleClearDownloads}
            disabled={clearing}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 rounded-2xl flex-row items-center justify-center mb-6"
          >
            {clearing ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Feather name="trash-2" size={14} color="#DC2626" />
                <Text className="text-red-600 dark:text-red-400 font-bold text-xs ml-2">
                  Clear All Downloaded Files (Temp)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="px-6">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : products.length > 0 ? (
            <>
              {products.map((product) => (
                <PurchasedProductCard
                  key={product.purchaseId}
                  product={product}
                />
              ))}

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
              <Feather name="shopping-bag" size={40} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-3 text-base">
                No purchases yet
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                Products you buy will appear here
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
