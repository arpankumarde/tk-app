import BottomTabs from "@/components/BottomTabs";
import BundleCard from "@/components/BundleCard";
import StoreHeader from "@/components/StoreHeader";
import type { BundleListItem } from "@/types/bundle";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_LIMIT = 20;

const SORT_OPTIONS = [
  { label: "Most Popular", value: "popular" },
  { label: "New Arrival", value: "newest" },
  { label: "Price High to Low", value: "price_desc" },
  { label: "Price Low to High", value: "price_asc" },
];

const BundlesScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [bundles, setBundles] = useState<BundleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState("popular");
  const [showSortModal, setShowSortModal] = useState(false);

  // `searchInput` is what the user types; `search` is what has been submitted.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchBundles = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        setError(null);

        let url = `${BASE_URL}/_api/bundles/list?sort=${sort}&page=${pageNum}&limit=${PAGE_LIMIT}`;
        if (search.trim())
          url += `&search=${encodeURIComponent(search.trim())}`;

        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const payload = data.json || data;
        const list: BundleListItem[] = payload.bundles || [];

        setBundles(list);
        setTotalCount(payload.total ?? list.length);
        setCurrentPage(pageNum);
      } catch (err: any) {
        console.error("Error fetching bundles:", err);
        setError(err?.message || "Failed to load bundles");
      } finally {
        setLoading(false);
      }
    },
    [sort, search],
  );

  useEffect(() => {
    fetchBundles(1);
  }, [fetchBundles]);

  const totalPages = Math.ceil(totalCount / PAGE_LIMIT);
  const pageWindowStart = Math.max(1, currentPage - 2);
  const pageWindowEnd = Math.min(totalPages, pageWindowStart + 4);
  const pageNumbers: number[] = [];
  for (let page = pageWindowStart; page <= pageWindowEnd; page += 1) {
    pageNumbers.push(page);
  }

  const activeSortLabel = SORT_OPTIONS.find((opt) => opt.value === sort)?.label;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StoreHeader />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-paper dark:bg-night"
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-4" />
        {/* Search + sort */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center bg-sand dark:bg-night-raised/50 rounded-2xl border border-line dark:border-night-line px-4 mb-3">
            <Feather name="search" size={18} color="#9A8A93" />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={() => setSearch(searchInput)}
              returnKeyType="search"
              placeholder="Search bundles..."
              placeholderTextColor={isDark ? "#6E5D66" : "#9A8A93"}
              className="flex-1 ml-3 h-12 text-ink dark:text-white"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#9A8A93" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="flex-row items-center border border-line dark:border-night-line bg-white dark:bg-night-raised px-4 py-2.5 rounded-xl shadow-sm justify-between"
          >
            <View className="flex-row items-center">
              <Feather name="sliders" size={16} color="#FF8A50" />
              <Text
                className="ml-2 text-ink-soft dark:text-night-soft font-bold text-sm"
                numberOfLines={1}
              >
                {activeSortLabel}
              </Text>
            </View>
            <Feather
              name="chevron-down"
              size={16}
              color={isDark ? "#9A8A93" : "#6E5D66"}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
            <Text className="text-red-600 dark:text-red-400 text-center font-medium">
              Error: {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchBundles(currentPage)}
              className="mt-2"
            >
              <Text className="text-primary-deep dark:text-primary text-center font-bold underline">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="px-6 mb-4">
          <Text className="text-ink-soft dark:text-night-soft text-base">
            Found{" "}
            <Text className="text-ink dark:text-white font-extrabold">
              {totalCount}
            </Text>{" "}
            {totalCount === 1 ? "bundle" : "bundles"}
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#FF8A50" />
          </View>
        ) : (
          <View className="pb-10 px-6">
            {bundles.length > 0 ? (
              bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))
            ) : (
              <View className="items-center justify-center py-20 px-8">
                <View className="w-20 h-20 bg-sand dark:bg-night-raised rounded-full items-center justify-center mb-6">
                  <Feather
                    name="package"
                    size={40}
                    color={isDark ? "#3A3731" : "#B5AEA3"}
                  />
                </View>
                <Text className="w-full text-xl font-bold text-ink dark:text-white mb-2 text-center">
                  No bundles found
                </Text>
                <Text className="text-ink-soft dark:text-night-soft text-center">
                  Try a different search, or check back soon for new bundles.
                </Text>
                <TouchableOpacity
                  onPress={() => fetchBundles(currentPage)}
                  className="mt-6 px-6 py-2 bg-clay-tint dark:bg-night-raised rounded-full"
                >
                  <Text className="text-primary-deep dark:text-primary font-bold">Refresh</Text>
                </TouchableOpacity>
              </View>
            )}

            {bundles.length > 0 && totalPages > 1 && (
              <View className="px-6 pt-2">
                <Text className="text-center text-sm text-ink-soft dark:text-night-soft mb-3">
                  Showing page {currentPage} of {Math.max(totalPages, 1)}
                </Text>

                <View className="flex-row items-center justify-center">
                  <TouchableOpacity
                    onPress={() => fetchBundles(currentPage - 1)}
                    disabled={loading || currentPage <= 1}
                    className={`px-3 py-2 rounded-lg border mr-2 ${
                      currentPage <= 1
                        ? "border-line dark:border-night-line"
                        : "border-line dark:border-night-line"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        currentPage <= 1
                          ? "text-ink-soft dark:text-ink-soft"
                          : "text-primary-deep dark:text-primary"
                      }`}
                    >
                      Prev
                    </Text>
                  </TouchableOpacity>

                  {pageNumbers.map((pageNum) => (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => fetchBundles(pageNum)}
                      disabled={loading || pageNum === currentPage}
                      className={`w-9 h-9 rounded-lg items-center justify-center mx-1 border ${
                        pageNum === currentPage
                          ? "bg-primary-deep border-primary"
                          : "bg-white dark:bg-night border-line dark:border-night-line"
                      }`}
                    >
                      <Text
                        className={`font-bold text-sm ${
                          pageNum === currentPage
                            ? "text-white"
                            : "text-ink-soft dark:text-night-soft"
                        }`}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    onPress={() => fetchBundles(currentPage + 1)}
                    disabled={loading || currentPage >= totalPages}
                    className={`px-3 py-2 rounded-lg border ml-2 ${
                      currentPage >= totalPages
                        ? "border-line dark:border-night-line"
                        : "border-line dark:border-night-line"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        currentPage >= totalPages
                          ? "text-ink-soft dark:text-ink-soft"
                          : "text-primary-deep dark:text-primary"
                      }`}
                    >
                      Next
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
      <BottomTabs />

      {/* Sort dropdown */}
      {showSortModal && (
        <View className="absolute inset-0 z-[110] justify-center items-center px-10">
          <Pressable
            onPress={() => setShowSortModal(false)}
            className="absolute inset-0 bg-black/20"
          />
          <View className="bg-white dark:bg-night-raised rounded-3xl w-full max-w-[280px] p-2 shadow-2xl border border-line dark:border-night-line">
            <View className="p-4 border-b border-line dark:border-night-line">
              <Text className="text-base font-extrabold text-ink dark:text-white">
                Sort by
              </Text>
            </View>

            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setSort(option.value);
                  setShowSortModal(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${
                  sort === option.value
                    ? "bg-clay-tint dark:bg-night-raised"
                    : ""
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    sort === option.value
                      ? "text-primary-deep dark:text-primary"
                      : "text-ink-soft dark:text-night-soft"
                  }`}
                >
                  {option.label}
                </Text>
                {sort === option.value && (
                  <Feather name="check" size={14} color="#FF8A50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default BundlesScreen;
