import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Pressable,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import MockTestCard from "@/components/MockTestCard";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_LIMIT = 10;

const SORT_OPTIONS = [
  { label: "New Arrival", value: "newest" },
  { label: "Most Popular", value: "popular" },
  { label: "Rating", value: "rating" },
  { label: "Price High to Low", value: "price_desc" },
  { label: "Price Low to High", value: "price_asc" },
];

const LANGUAGES = [
  "All Languages",
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Others",
];

type ExamTest = {
  id: number;
  slug: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  discountPrice: number | null;
  totalQuestions: number;
  thumbnailUrl: string | null;
  totalTests: number;
  freeTestsCount: number;
  creatorName: string;
  studentsEnrolled: number;
  rating: number | null;
  reviewsCount: number;
  examName: string;
  language: string;
  teacherName: string;
  teacherIsVerified: boolean;
  examSlug: string;
  durationMinutes: string;
  actualQuestionCount: string;
  isEnrolled: boolean;
};

// ── Separate component so filter interactions don't re-render ShopScreen ──
function FilterSidebarContent({
  initialFilters,
  onApply,
  onClose,
}: {
  initialFilters: {
    search: string;
    priceType: "all" | "free" | "paid";
    minPrice: string;
    maxPrice: string;
    language: string;
  };
  onApply: (f: {
    search: string;
    priceType: "all" | "free" | "paid";
    minPrice: string;
    maxPrice: string;
    language: string;
  }) => void;
  onClose: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [search, setSearch] = useState(initialFilters.search);
  const [priceType, setPriceType] = useState(initialFilters.priceType);
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice);
  const [lang, setLang] = useState(initialFilters.language);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const sheetHeight = Dimensions.get("window").height * 0.7;
  const translateY = useSharedValue(sheetHeight);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 350 });
  }, [translateY]);

  const handleClose = useCallback(() => {
    translateY.value = withTiming(
      sheetHeight,
      { duration: 300 },
      (finished) => {
        if (finished) {
          scheduleOnRN(onClose);
        }
      },
    );
  }, [onClose, sheetHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const clearAll = () => {
    setSearch("");
    setPriceType("all");
    setMinPrice("");
    setMaxPrice("");
    setLang("All Languages");
  };

  const handleApply = () => {
    translateY.value = withTiming(
      sheetHeight,
      { duration: 250 },
      (finished) => {
        if (finished) {
          scheduleOnRN(onApply, {
            search,
            priceType,
            minPrice,
            maxPrice,
            language: lang,
          });
        }
      },
    );
  };

  return (
    <View className="flex-1 justify-end">
      {/* Backdrop with Fade */}
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        className="absolute inset-0 bg-black/40"
      >
        <Pressable onPress={handleClose} className="flex-1" />
      </Animated.View>

      {/* Sheet with Manual Slide */}
      <Animated.View
        className="absolute bottom-0 w-full bg-white dark:bg-slate-900 rounded-t-[40px] shadow-2xl overflow-hidden"
        style={[{ height: sheetHeight }, animatedStyle]}
      >
        <SafeAreaView
          edges={["bottom"]}
          className="flex-1"
          style={{ backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
        >
          {/* Drag Handle Container */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" />
          </View>

          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-slate-800">
            <View className="flex-row items-center">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">
                Filters
              </Text>
              <TouchableOpacity
                onPress={clearAll}
                className="ml-4 px-3 py-1 bg-gray-50 dark:bg-slate-800 rounded-full"
              >
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Feather
                name="x"
                size={24}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-3">
                Search
              </Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-1">
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search tests..."
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  className="flex-1 ml-3 h-12 text-slate-800 dark:text-white"
                />
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">
                Price Type
              </Text>
              <View className="flex-row p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                {(["all", "free", "paid"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setPriceType(type)}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={
                      priceType === type
                        ? {
                            backgroundColor: isDark ? "#334155" : "#ffffff",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 1,
                          }
                        : undefined
                    }
                  >
                    <Text
                      className="text-xs font-black capitalize"
                      style={{
                        color:
                          priceType === type
                            ? "#FF8A50"
                            : isDark
                              ? "#94a3b8"
                              : "#64748b",
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">
                Price Range (₹)
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-4 text-slate-800 dark:text-white font-bold"
                />
                <Text className="text-slate-400 mx-3 font-bold">-</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-4 text-slate-800 dark:text-white font-bold"
                />
              </View>
            </View>

            <View className="mb-10">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">
                Language
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(true)}
                className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4"
              >
                <Text className="text-slate-800 dark:text-white font-medium">
                  {lang}
                </Text>
                <Feather name="chevron-down" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View className="p-6 border-t border-gray-100 dark:border-slate-800">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <Text className="text-white text-lg font-black">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          onPress={() => setShowLanguageModal(false)}
          className="flex-1 bg-black/20 justify-center items-center px-10"
        >
          <View className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
            <View className="p-5 border-b border-gray-50 dark:border-slate-700/50">
              <Text className="text-lg font-black text-slate-800 dark:text-white">
                Select Language
              </Text>
            </View>
            <ScrollView
              className="max-h-[300px]"
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    setLang(l);
                    setShowLanguageModal(false);
                  }}
                  className={`px-6 py-4 border-b border-gray-50 dark:border-slate-700/30 ${lang === l ? "bg-orange-50 dark:bg-orange-900/10" : ""}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base ${lang === l ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300"}`}
                    >
                      {l}
                    </Text>
                    {lang === l && (
                      <Feather name="check" size={16} color="#FF8A50" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const ShopScreen = () => {
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();
  const [tests, setTests] = useState<ExamTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Applied Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [priceType, setPriceType] = useState<"all" | "free" | "paid">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");

  const fetchTests = useCallback(
    async (pageNum: number = 1, isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        let url = `${BASE_URL}/_api/tests/list?sortBy=${sort}&page=${pageNum}&limit=${PAGE_LIMIT}`;
        if (searchQuery.trim()) {
          url += `&search=${encodeURIComponent(searchQuery.trim())}`;
        }
        if (priceType !== "all") {
          url += `&priceType=${priceType}`;
        }
        if (minPrice.trim()) {
          url += `&minPrice=${encodeURIComponent(minPrice.trim())}`;
        }
        if (maxPrice.trim()) {
          url += `&maxPrice=${encodeURIComponent(maxPrice.trim())}`;
        }
        if (selectedLanguage !== "All Languages") {
          url += `&language=${encodeURIComponent(selectedLanguage)}`;
        }

        console.log("[MockTests] Fetching:", url);
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!response.ok) {
          throw new Error(`Server returned error ${response.status}`);
        }

        const data = await response.json();
        const payload = data.json || data;
        const testsList = payload.tests || payload.data?.tests || [];

        const totalItemsCount =
          payload.totalCount ||
          payload.pagination?.totalCount ||
          payload.data?.totalCount ||
          testsList.length;

        if (isLoadMore) {
          setTests((prev) => [...prev, ...testsList]);
        } else {
          setTests(testsList);
        }

        setTotalCount(totalItemsCount);
        setHasMore(pageNum * PAGE_LIMIT < totalItemsCount);
      } catch (err: any) {
        console.error("[MockTests] caught error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, searchQuery, priceType, minPrice, maxPrice, selectedLanguage, token],
  );

  useEffect(() => {
    setPage(1);
    fetchTests(1, false);
  }, [fetchTests]);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTests(nextPage, true);
    }
  };

  const handleApplyFilters = useCallback(
    (f: {
      search: string;
      priceType: "all" | "free" | "paid";
      minPrice: string;
      maxPrice: string;
      language: string;
    }) => {
      setSearchQuery(f.search);
      setPriceType(f.priceType);
      setMinPrice(f.minPrice);
      setMaxPrice(f.maxPrice);
      setSelectedLanguage(f.language);
      setPage(1);
      setShowFilterSidebar(false);
    },
    [],
  );

  const activeSortLabel = SORT_OPTIONS.find((opt) => opt.value === sort)?.label;

  const testCards = useMemo(
    () =>
      tests.map((test, index) => (
        <MockTestCard key={`${test.id}-${index}`} test={test as any} />
      )),
    [tests],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colorScheme === "dark" ? "#0f172a" : "#ffffff"}
      />
      <Header />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-white dark:bg-slate-900"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="px-6 pt-5 pb-4">
          <Text className="text-[34px] font-extrabold text-slate-800 dark:text-white leading-[40px]">
            Online Mock Tests
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-[15px] leading-6 pr-6">
            Find the right test set to sharpen your speed, accuracy, and exam
            confidence.
          </Text>
        </View>

        {/* Filters & Sorting */}
        <View className="px-5 mb-8 flex-row items-center">
          <TouchableOpacity
            onPress={() => setShowFilterSidebar(true)}
            className="flex-row items-center border border-orange-200 dark:border-orange-800/80 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl mr-3 shadow-sm"
          >
            <Feather name="filter" size={16} color="#FF8A50" />
            <Text className="ml-2 text-primary font-bold text-sm">Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="flex-row items-center border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 shadow-sm justify-between"
          >
            <Text
              className="text-slate-600 dark:text-slate-300 font-bold text-sm"
              numberOfLines={1}
            >
              {activeSortLabel}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
            <Text className="text-red-600 dark:text-red-400 text-center font-medium">
              Error: {error}
            </Text>
            <TouchableOpacity onPress={() => fetchTests(1)} className="mt-2">
              <Text className="text-primary text-center font-bold underline">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="px-6 mb-6">
          <Text className="text-slate-600 dark:text-slate-400 text-base">
            Found{" "}
            <Text className="text-slate-900 dark:text-white font-black">
              {totalCount}
            </Text>{" "}
            tests
          </Text>
        </View>

        {/* List Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-10">
            <ActivityIndicator size="large" color="#FF8A50" />
          </View>
        ) : (
          <View className="pb-10">
            {tests.length > 0 ? (
              <>
                {testCards}

                {hasMore && (
                  <View className="px-6 mt-4">
                    <TouchableOpacity
                      onPress={handleLoadMore}
                      disabled={loadingMore}
                      className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 py-4 rounded-2xl items-center flex-row justify-center"
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color="#FF8A50" />
                      ) : (
                        <>
                          <Text className="text-primary font-bold text-base mr-2">
                            Load More Tests
                          </Text>
                          <Feather
                            name="refresh-cw"
                            size={16}
                            color="#FF8A50"
                          />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {!hasMore && tests.length > 0 && (
                  <View className="items-center py-8">
                    <Text className="text-slate-400 dark:text-slate-500 text-sm italic font-medium">
                      You&apos;ve reached the end of the list
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="items-center justify-center py-20 px-8">
                <View className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                  <Feather
                    name="shopping-bag"
                    size={40}
                    color={colorScheme === "dark" ? "#334155" : "#cbd5e1"}
                  />
                </View>
                <Text className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                  No tests found
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center">
                  Try adjusting your filters or sorting to find what you&apos;re
                  looking for.
                </Text>
                <TouchableOpacity
                  onPress={() => fetchTests(1)}
                  className="mt-6 px-6 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-full"
                >
                  <Text className="text-primary font-bold">Refresh</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
      <BottomTabs />

      {/* Sort Dropdown */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          onPress={() => setShowSortModal(false)}
          className="flex-1 bg-black/20 justify-center items-center px-10"
        >
          <View className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-[280px] p-2 shadow-2xl border border-gray-100 dark:border-slate-700">
            <View className="p-4 border-b border-gray-50 dark:border-slate-700/50">
              <Text className="text-base font-black text-slate-800 dark:text-white">
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
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : ""
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    sort === option.value
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-300"
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
        </Pressable>
      </Modal>

      {/* Filter Sidebar Modal */}
      <Modal
        visible={showFilterSidebar}
        transparent
        animationType="none"
        onRequestClose={() => setShowFilterSidebar(false)}
      >
        <FilterSidebarContent
          initialFilters={{
            search: searchQuery,
            priceType,
            minPrice,
            maxPrice,
            language: selectedLanguage,
          }}
          onApply={handleApplyFilters}
          onClose={() => setShowFilterSidebar(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default ShopScreen;
