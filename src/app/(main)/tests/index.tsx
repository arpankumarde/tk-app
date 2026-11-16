import BottomTabs from "@/components/BottomTabs";
import StoreHeader from "@/components/StoreHeader";
import MockTestCard from "@/components/MockTestCard";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

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
  teacherAvatarUrl: string | null;
  teacherIsVerified: boolean;
  examSlug: string;
  durationMinutes: string;
  actualQuestionCount: string;
  isEnrolled: boolean;
  views: number;
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
        className="absolute bottom-0 w-full bg-white dark:bg-night rounded-t-[40px] shadow-2xl overflow-hidden"
        style={[{ height: sheetHeight }, animatedStyle]}
      >
        <SafeAreaView
          edges={["bottom"]}
          className="flex-1"
          style={{ backgroundColor: isDark ? "#18121A" : "#ffffff" }}
        >
          {/* Drag Handle Container */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-line dark:bg-night-line rounded-full" />
          </View>

          <View className="flex-row items-center justify-between px-6 py-4 border-b border-line dark:border-night-line">
            <View className="flex-row items-center">
              <Text className="text-2xl font-extrabold text-ink dark:text-white">
                Filters
              </Text>
              <TouchableOpacity
                onPress={clearAll}
                className="ml-4 px-3 py-1 bg-sand dark:bg-night-raised rounded-full"
              >
                <Text className="text-xs font-bold text-ink-soft dark:text-night-soft">
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Feather
                name="x"
                size={24}
                color={isDark ? "#9A8A93" : "#6E5D66"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-6 pt-6"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-8">
              <Text className="text-base font-bold text-ink dark:text-white mb-3">
                Search
              </Text>
              <View className="flex-row items-center bg-sand dark:bg-night-raised/50 rounded-2xl border border-line dark:border-night-line px-4 py-1">
                <Feather name="search" size={18} color="#9A8A93" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search tests..."
                  placeholderTextColor={isDark ? "#6E5D66" : "#9A8A93"}
                  className="flex-1 ml-3 h-12 text-ink dark:text-white"
                />
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-base font-bold text-ink dark:text-white mb-4">
                Price Type
              </Text>
              <View className="flex-row p-1 bg-sand dark:bg-night-raised rounded-2xl">
                {(["all", "free", "paid"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setPriceType(type)}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={
                      priceType === type
                        ? {
                            backgroundColor: isDark ? "#3A3731" : "#ffffff",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 1,
                          }
                        : undefined
                    }
                  >
                    <Text
                      className="text-xs font-extrabold capitalize"
                      style={{
                        color:
                          priceType === type
                            ? "#FF8A50"
                            : isDark
                              ? "#9A8A93"
                              : "#6E5D66",
                      }}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-8">
              <Text className="text-base font-bold text-ink dark:text-white mb-4">
                Price Range (₹)
              </Text>
              <View className="flex-row items-center">
                <TextInput
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="Min"
                  placeholderTextColor="#9A8A93"
                  keyboardType="numeric"
                  className="flex-1 bg-sand dark:bg-night-raised/50 rounded-2xl border border-line dark:border-night-line px-4 py-4 text-ink dark:text-white font-bold"
                />
                <Text className="text-ink-soft mx-3 font-bold">-</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="Max"
                  placeholderTextColor="#9A8A93"
                  keyboardType="numeric"
                  className="flex-1 bg-sand dark:bg-night-raised/50 rounded-2xl border border-line dark:border-night-line px-4 py-4 text-ink dark:text-white font-bold"
                />
              </View>
            </View>

            <View className="mb-10">
              <Text className="text-base font-bold text-ink dark:text-white mb-4">
                Language
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(true)}
                className="flex-row items-center justify-between bg-sand dark:bg-night-raised/50 rounded-2xl border border-line dark:border-night-line px-5 py-4"
              >
                <Text className="text-ink dark:text-white font-medium">
                  {lang}
                </Text>
                <Feather name="chevron-down" size={18} color="#9A8A93" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View className="p-6 border-t border-line dark:border-night-line">
            <TouchableOpacity
              onPress={handleApply}
              className="bg-primary-deep h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <Text className="text-white text-lg font-extrabold">
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
          <View className="bg-white dark:bg-night rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl border border-line dark:border-night-line">
            <View className="p-5 border-b border-line dark:border-night-line">
              <Text className="text-lg font-extrabold text-ink dark:text-white">
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
                  className={`px-6 py-4 border-b border-line dark:border-night-line/30 ${lang === l ? "bg-clay-tint dark:bg-night-raised" : ""}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base ${lang === l ? "text-primary-deep dark:text-primary font-bold" : "text-ink-soft dark:text-night-soft"}`}
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
        <MockTestCard key={`${test.id}-${index}`} test={test} />
      )),
    [tests],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StoreHeader />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-paper dark:bg-night"
        showsVerticalScrollIndicator={false}
      >
        <View className="h-4" />
        {/* Filters & Sorting */}
        <View className="px-5 mb-8 flex-row items-center">
          <TouchableOpacity
            onPress={() => setShowFilterSidebar(true)}
            className="flex-row items-center border border-line dark:border-night-line bg-white dark:bg-night-raised px-4 py-2.5 rounded-xl mr-3 shadow-sm"
          >
            <Feather name="filter" size={16} color="#FF8A50" />
            <Text className="ml-2 text-primary-deep dark:text-primary font-bold text-sm">Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="flex-row items-center border border-line dark:border-night-line bg-white dark:bg-night-raised px-4 py-2.5 rounded-xl flex-1 shadow-sm justify-between"
          >
            <Text
              className="text-ink-soft dark:text-night-soft font-bold text-sm"
              numberOfLines={1}
            >
              {activeSortLabel}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colorScheme === "dark" ? "#9A8A93" : "#6E5D66"}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
            <Text className="text-red-600 dark:text-red-400 text-center font-medium">
              Error: {error}
            </Text>
            <TouchableOpacity onPress={() => fetchTests(1)} className="mt-2">
              <Text className="text-primary-deep dark:text-primary text-center font-bold underline">
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="px-6 mb-6">
          <Text className="text-ink-soft dark:text-night-soft text-base">
            Found{" "}
            <Text className="text-ink dark:text-white font-extrabold">
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
                      className="bg-clay-tint dark:bg-night-raised border border-line dark:border-night-line py-4 rounded-2xl items-center flex-row justify-center"
                    >
                      {loadingMore ? (
                        <ActivityIndicator size="small" color="#FF8A50" />
                      ) : (
                        <>
                          <Text className="text-primary-deep dark:text-primary font-bold text-base mr-2">
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
                    <Text className="text-ink-soft dark:text-night-soft text-sm italic font-medium">
                      You&apos;ve reached the end of the list
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="items-center justify-center py-20 px-8">
                <View className="w-20 h-20 bg-sand dark:bg-night-raised rounded-full items-center justify-center mb-6">
                  <Feather
                    name="shopping-bag"
                    size={40}
                    color={colorScheme === "dark" ? "#3A3731" : "#B5AEA3"}
                  />
                </View>
                <Text className="w-full text-xl font-bold text-ink dark:text-white mb-2 text-center">
                  No tests found
                </Text>
                <Text className="text-ink-soft dark:text-night-soft text-center">
                  Try adjusting your filters or sorting to find what you&apos;re
                  looking for.
                </Text>
                <TouchableOpacity
                  onPress={() => fetchTests(1)}
                  className="mt-6 px-6 py-2 bg-clay-tint dark:bg-night-raised rounded-full"
                >
                  <Text className="text-primary-deep dark:text-primary font-bold">Refresh</Text>
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
