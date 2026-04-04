import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  Pressable,
  TextInput,
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
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import CourseCard from "@/components/CourseCard";
import BottomTabs from "@/components/BottomTabs";

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Popular", value: "popular" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const PAGE_SIZE = 6;

const LEVELS = ["All Levels", "beginner", "intermediate", "advanced"];

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

// ── Separate component so filter interactions don't re-render CourseScreen ──
function FilterSidebarContent({
  initialFilters,
  onApply,
  onClose,
}: {
  initialFilters: {
    search: string;
    price: string;
    level: string;
    lang: string;
  };
  onApply: (f: {
    search: string;
    price: string;
    level: string;
    lang: string;
  }) => void;
  onClose: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [search, setSearch] = useState(initialFilters.search);
  const [price, setPrice] = useState(initialFilters.price);
  const [level, setLevel] = useState(initialFilters.level);
  const [lang, setLang] = useState(initialFilters.lang);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const sheetHeight = Dimensions.get("window").height * 0.7;
  const translateY = useSharedValue(sheetHeight);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 350 });
  }, [translateY]);

  const handleClose = useCallback(() => {
    translateY.value = withTiming(sheetHeight, { duration: 300 }, (finished) => {
      if (finished) {
        scheduleOnRN(onClose);
      }
    });
  }, [onClose, sheetHeight, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const clearAll = () => {
    setSearch("");
    setPrice("all");
    setLevel("All Levels");
    setLang("All Languages");
  };

  return (
    <View className="flex-1 justify-end">
      {/* Backdrop with Fade */}
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        className="absolute inset-0 bg-black/50"
      >
        <Pressable onPress={handleClose} className="flex-1" />
      </Animated.View>

      {/* Sheet with Manual Slide */}
      <Animated.View
        className="absolute bottom-0 w-full bg-white dark:bg-slate-900 rounded-t-[40px] shadow-2xl overflow-hidden"
        style={[
          { height: sheetHeight },
          animatedStyle
        ]}
      >
        <SafeAreaView edges={["bottom"]} className="flex-1">
          {/* Drag Handle Container */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full" />
          </View>

          <View className="flex-row items-center justify-between px-7 py-4">
            <View className="flex-row items-center">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">
                Filters
              </Text>
              <TouchableOpacity
                onPress={clearAll}
                className="ml-4 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full"
              >
                <Text className="text-xs font-bold text-primary">
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center"
            >
              <Feather
                name="x"
                size={20}
                color={isDark ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>
          </View>
          <View className="h-[1px] bg-gray-100 dark:bg-slate-800 mx-7" />

          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-3">
                Search
              </Text>
              <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-1">
                <Feather name="search" size={18} color="#94a3b8" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search courses..."
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  className="flex-1 ml-3 h-12 text-slate-800 dark:text-white"
                />
              </View>
            </View>

            {/* Price Type — static className + dynamic style to avoid NativeWind crash */}
            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">
                Price Type
              </Text>
              <View className="flex-row p-1 bg-gray-100 dark:bg-slate-800 rounded-2xl">
                {["all", "free", "paid"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setPrice(type)}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={
                      price === type
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
                          price === type
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

            {/* Level */}
            <View className="mb-8">
              <Text className="text-base font-bold text-slate-800 dark:text-white mb-4">
                Course Level
              </Text>
              <TouchableOpacity
                onPress={() => setShowLevelModal(true)}
                className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 px-5 py-4"
              >
                <Text className="text-slate-800 dark:text-white font-medium capitalize">
                  {level}
                </Text>
                <Feather name="chevron-down" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Language */}
            <View className="mb-8">
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

            <View className="h-10" />
          </ScrollView>

          <View className="p-6 border-t border-gray-100 dark:border-slate-800">
            <TouchableOpacity
              onPress={() => {
                translateY.value = withTiming(sheetHeight, { duration: 250 }, (finished) => {
                  if (finished) {
                    scheduleOnRN(onApply, { search, price, level, lang });
                  }
                });
              }}
              className="bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <Text className="text-white text-lg font-black">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
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
            <ScrollView className="max-h-[300px]">
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    setLang(l);
                    setShowLanguageModal(false);
                  }}
                  className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/30"
                  style={
                    lang === l
                      ? {
                          backgroundColor: isDark
                            ? "rgba(194,65,12,0.1)"
                            : "#fff7ed",
                        }
                      : undefined
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base"
                      style={{
                        color:
                          lang === l
                            ? "#FF8A50"
                            : isDark
                              ? "#cbd5e1"
                              : "#475569",
                        fontWeight: lang === l ? "700" : "400",
                      }}
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

      {/* Level Selection Modal */}
      <Modal
        visible={showLevelModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLevelModal(false)}
      >
        <Pressable
          onPress={() => setShowLevelModal(false)}
          className="flex-1 bg-black/20 justify-center items-center px-10"
        >
          <View className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-700">
            <View className="p-5 border-b border-gray-50 dark:border-slate-700/50">
              <Text className="text-lg font-black text-slate-800 dark:text-white">
                Select Level
              </Text>
            </View>
            <View>
              {LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => {
                    setLevel(lvl);
                    setShowLevelModal(false);
                  }}
                  className="px-6 py-4 border-b border-gray-50 dark:border-slate-700/30"
                  style={
                    level === lvl
                      ? {
                          backgroundColor: isDark
                            ? "rgba(194,65,12,0.1)"
                            : "#fff7ed",
                        }
                      : undefined
                  }
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base capitalize"
                      style={{
                        color:
                          level === lvl
                            ? "#FF8A50"
                            : isDark
                              ? "#cbd5e1"
                              : "#475569",
                        fontWeight: level === lvl ? "700" : "400",
                      }}
                    >
                      {lvl}
                    </Text>
                    {level === lvl && (
                      <Feather name="check" size={16} color="#FF8A50" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Main screen ──
const CourseScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States (applied values only)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "All Categories",
  ]);
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [priceType, setPriceType] = useState("all");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = `${process.env.EXPO_PUBLIC_BASE_URL}/_api/courses/list?sortBy=${sort}&page=${page}&limit=${PAGE_SIZE}`;

      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (selectedCategories[0] !== "All Categories")
        url += `&category=${encodeURIComponent(selectedCategories.join(","))}`;
      if (selectedLevel !== "All Levels") url += `&level=${selectedLevel}`;
      if (selectedLanguage !== "All Languages")
        url += `&language=${selectedLanguage}`;
      if (priceType !== "all") url += `&priceType=${priceType}`;

      const response = await fetch(url);
      const data = await response.json();

      const payload = data.json || data;
      const coursesData = payload.courses || [];
      const pagination = payload.pagination;

      setCourses(coursesData);
      setTotalPages(pagination?.totalPages || 1);
    } catch (err) {
      console.error("Fetch Courses Error:", err);
      setError("Failed to load courses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [
    sort,
    page,
    searchQuery,
    selectedCategories,
    selectedLevel,
    selectedLanguage,
    priceType,
  ]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const courseCards = useMemo(
    () =>
      courses.map((course, index) => (
        <CourseCard key={course.slug || index} course={course} />
      )),
    [courses],
  );

  const handleApplyFilters = useCallback(
    (f: { search: string; price: string; level: string; lang: string }) => {
      setSearchQuery(f.search);
      setPriceType(f.price);
      setSelectedLevel(f.level);
      setSelectedLanguage(f.lang);
      setPage(1);
      setShowFilterSidebar(false);
    },
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#ffffff"}
      />
      <Header />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
              <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
                Premium Learning
              </Text>
            </View>
          </View>
          <Text className="text-4xl font-black text-slate-800 dark:text-white leading-[48px]">
            Online Courses
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium mt-2 leading-6">
            Master new skills with comprehensive courses designed by expert
            educators.
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
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
            </Text>
            <Feather
              name="chevron-down"
              size={16}
              color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#FF8A50" />
          </View>
        ) : (
          <View className="px-5 pb-10">
            {courses.length > 0 ? (
              <>
                {courseCards}

                {/* Pagination Controls — static className + dynamic style */}
                {totalPages > 1 && (
                  <View className="flex-row items-center justify-center mt-6 mb-2 gap-3">
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 rounded-xl items-center justify-center border"
                      style={{
                        borderColor:
                          page === 1
                            ? isDark
                              ? "#334155"
                              : "#e5e7eb"
                            : isDark
                              ? "rgba(154,52,18,0.8)"
                              : "#fed7aa",
                        backgroundColor:
                          page === 1
                            ? isDark
                              ? "rgba(30,41,59,0.5)"
                              : "#f9fafb"
                            : isDark
                              ? "#1e293b"
                              : "#ffffff",
                      }}
                    >
                      <Feather
                        name="chevron-left"
                        size={18}
                        color={page === 1 ? "#94a3b8" : "#FF8A50"}
                      />
                    </TouchableOpacity>

                    <View className="flex-row items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => (
                          <TouchableOpacity
                            key={p}
                            onPress={() => setPage(p)}
                            className="w-10 h-10 rounded-xl items-center justify-center"
                            style={{
                              backgroundColor:
                                page === p
                                  ? "#FF8A50"
                                  : isDark
                                    ? "rgba(30,41,59,0.5)"
                                    : "#f9fafb",
                            }}
                          >
                            <Text
                              className="text-sm font-bold"
                              style={{
                                color:
                                  page === p
                                    ? "#ffffff"
                                    : isDark
                                      ? "#cbd5e1"
                                      : "#475569",
                              }}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        ),
                      )}
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="w-10 h-10 rounded-xl items-center justify-center border"
                      style={{
                        borderColor:
                          page === totalPages
                            ? isDark
                              ? "#334155"
                              : "#e5e7eb"
                            : isDark
                              ? "rgba(154,52,18,0.8)"
                              : "#fed7aa",
                        backgroundColor:
                          page === totalPages
                            ? isDark
                              ? "rgba(30,41,59,0.5)"
                              : "#f9fafb"
                            : isDark
                              ? "#1e293b"
                              : "#ffffff",
                      }}
                    >
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={page === totalPages ? "#94a3b8" : "#FF8A50"}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View className="items-center justify-center py-20 px-8">
                <View className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                  <Feather
                    name="video"
                    size={40}
                    color={isDark ? "#334155" : "#cbd5e1"}
                  />
                </View>
                <Text className="text-xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                  No courses found
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center">
                  Try adjusting your filters or sorting to find something new.
                </Text>
                <TouchableOpacity
                  onPress={fetchCourses}
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

      {/* Sort Dropdown Modal — static className + dynamic style */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable
          onPress={() => setShowSortModal(false)}
          className="flex-1 bg-black/20"
        >
          <View className="flex-1 justify-center items-center px-10">
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
                    setPage(1);
                    setShowSortModal(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3.5 rounded-2xl"
                  style={
                    sort === option.value
                      ? {
                          backgroundColor: isDark
                            ? "rgba(194,65,12,0.2)"
                            : "#fff7ed",
                        }
                      : undefined
                  }
                >
                  <Text
                    className="text-sm font-bold"
                    style={{
                      color:
                        sort === option.value
                          ? "#FF8A50"
                          : isDark
                            ? "#cbd5e1"
                            : "#475569",
                    }}
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
        </Pressable>
      </Modal>

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterSidebar}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowFilterSidebar(false)}
      >
        <FilterSidebarContent
          initialFilters={{
            search: searchQuery,
            price: priceType,
            level: selectedLevel,
            lang: selectedLanguage,
          }}
          onApply={handleApplyFilters}
          onClose={() => setShowFilterSidebar(false)}
        />
      </Modal>
    </SafeAreaView>
  );
};

export default CourseScreen;
