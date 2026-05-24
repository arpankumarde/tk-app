import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useColorScheme } from "nativewind";
import Placeholder from "@/constants/placeholder";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const SEARCH_LIMIT = 8;

// ─── Type helpers ───────────────────────────────────────────────────────────

interface CourseResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  thumbnailImageUrl: string | null;
  price: number;
  level: string;
  teacherName?: string;
  teacherDisplayName: string;
  teacherIsVerified: boolean;
}

interface TestResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  questionsCount: number;
  durationMinutes: number;
  teacherName: string;
  teacherIsVerified: boolean;
}

interface ProductResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  pageCount: number;
  teacherName: string;
  teacherIsVerified: boolean;
}

interface LiveTestResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  price: number;
  scheduledAt: string;
  teacherName: string;
}

interface TeacherResult {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  slug: string;
  isVerified: boolean;
  testCount: number;
  courseCount: number;
  studentCount: number;
}

interface SearchResults {
  courses: CourseResult[];
  tests: TestResult[];
  products: ProductResult[];
  liveTests: LiveTestResult[];
  teachers: TeacherResult[];
}

// ─── Result Card Components ──────────────────────────────────────────────────

const ResultCard = ({
  thumbnail,
  fallback,
  title,
  subtitle,
  badge,
  price,
  verified,
  onPress,
}: {
  thumbnail: string | null;
  fallback: string;
  title: string;
  subtitle: string;
  badge?: string;
  price: number;
  verified?: boolean;
  onPress: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-slate-700 shadow-sm"
    >
      <Image
        source={{ uri: thumbnail || fallback }}
        className="w-16 h-16 rounded-xl"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <Text
          className="text-slate-800 dark:text-white font-black text-sm leading-tight"
          numberOfLines={2}
        >
          {title}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text
            className="text-slate-500 dark:text-slate-400 text-xs font-medium"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
          {verified && (
            <MaterialIcons name="verified" size={13} color="#22C55E" style={{ marginLeft: 3 }} />
          )}
        </View>
        <View className="flex-row items-center mt-1.5 gap-2">
          {badge && (
            <View className="bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              <Text className="text-primary text-[9px] font-black uppercase tracking-wide">
                {badge}
              </Text>
            </View>
          )}
          <Text
            className={`font-black text-sm ${price === 0 ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}
          >
            {price === 0 ? "FREE" : `₹${price}`}
          </Text>
        </View>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={isDark ? "#475569" : "#cbd5e1"}
        style={{ alignSelf: "center" }}
      />
    </TouchableOpacity>
  );
};

const TeacherCard = ({
  avatar,
  name,
  verified,
  testCount,
  courseCount,
  studentCount,
  onPress,
}: {
  avatar: string | null;
  name: string;
  verified: boolean;
  testCount: number;
  courseCount: number;
  studentCount: number;
  onPress: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-slate-700 shadow-sm"
    >
      <Image
        source={{
          uri:
            avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF8A50&color=fff`,
        }}
        className="w-16 h-16 rounded-full"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <View className="flex-row items-center">
          <Text
            className="text-slate-800 dark:text-white font-black text-sm leading-tight flex-shrink"
            numberOfLines={1}
          >
            {name}
          </Text>
          {verified && (
            <MaterialIcons
              name="verified"
              size={13}
              color="#22C55E"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
        <View className="flex-row items-center mt-1.5 flex-wrap">
          <View className="flex-row items-center mr-3">
            <Feather name="users" size={11} color="#94a3b8" />
            <Text className="ml-1 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
              {studentCount} {studentCount === 1 ? "Student" : "Students"}
            </Text>
          </View>
          <View className="flex-row items-center mr-3">
            <Feather name="file-text" size={11} color="#94a3b8" />
            <Text className="ml-1 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
              {testCount} {testCount === 1 ? "Test" : "Tests"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="book-open" size={11} color="#94a3b8" />
            <Text className="ml-1 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
              {courseCount} {courseCount === 1 ? "Course" : "Courses"}
            </Text>
          </View>
        </View>
      </View>
      <Feather
        name="chevron-right"
        size={18}
        color={isDark ? "#475569" : "#cbd5e1"}
        style={{ alignSelf: "center" }}
      />
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <View className="flex-row items-center mb-3 mt-6">
    <Text className="text-lg font-black text-slate-800 dark:text-white flex-1">
      {title}
    </Text>
    <View className="bg-orange-100 dark:bg-orange-900/30 px-2.5 py-1 rounded-full">
      <Text className="text-primary text-xs font-black">{count}</Text>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SearchScreen = () => {
  const { q } = useLocalSearchParams<{ q: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [query, setQuery] = useState(q || "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const totalResults = results
    ? (results.courses?.length || 0) +
      (results.tests?.length || 0) +
      (results.products?.length || 0) +
      (results.liveTests?.length || 0) +
      (results.teachers?.length || 0)
    : 0;

  const hasResults = totalResults > 0;

  const doSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = `${BASE_URL}/_api/homepage/search?q=${encodeURIComponent(trimmed)}&limit=${SEARCH_LIMIT}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log("[Search] response", url, JSON.stringify(data, null, 2));
      const payload = data.json || data;
      setResults({
        courses: payload.courses || [],
        tests: payload.tests || [],
        products: payload.products || payload.notes || [],
        liveTests: payload.liveTests || payload.live || [],
        teachers: payload.teachers || [],
      });
    } catch (err) {
      console.error("Search error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search on mount if q param provided
  useEffect(() => {
    if (q) doSearch(q);
  }, [q, doSearch]);

  const handleSubmit = () => {
    doSearch(query);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#0f172a" : "#ffffff"}
      />
      {/* Search Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center"
        >
          <Feather name="chevron-left" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>

        <View className="flex-1 flex-row items-center bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-full px-4 h-12">
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSubmit}
            placeholder="Search courses, tests, notes..."
            placeholderTextColor={isDark ? "#475569" : "#94a3b8"}
            className="flex-1 text-slate-800 dark:text-white text-sm font-medium"
            returnKeyType="search"
            autoFocus={!q}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults(null);
              }}
            >
              <Feather name="x" size={16} color={isDark ? "#64748b" : "#94a3b8"} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-primary px-4 h-10 rounded-full items-center justify-center shadow-sm shadow-orange-500/30"
        >
          <Feather name="search" size={18} color="white" />
        </TouchableOpacity>
      </View>
      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8A50" />
          <Text className="text-slate-400 dark:text-slate-500 mt-4 font-medium text-sm">
            Searching...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="wifi-off" size={48} color={isDark ? "#334155" : "#e2e8f0"} />
          <Text className="text-slate-800 dark:text-white font-black text-xl mt-4 mb-2">
            Search Failed
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
            {error}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-primary px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-black">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : results === null ? (
        /* Empty / initial state */
        (<View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-6">
            <Feather name="search" size={40} color="#FF8A50" />
          </View>
          <Text className="text-slate-800 dark:text-white font-black text-2xl mb-2 text-center">
            Search Everything
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-6">
            Find courses, mock tests, study notes, and live exams all in one place.
          </Text>
        </View>)
      ) : !hasResults ? (
        /* No results */
        (<View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full bg-gray-50 dark:bg-slate-800 items-center justify-center mb-6">
            <Feather name="inbox" size={40} color={isDark ? "#334155" : "#cbd5e1"} />
          </View>
          <Text className="text-slate-800 dark:text-white font-black text-xl mb-2 text-center">
            No Results Found
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-sm">
            Try different keywords or check your spelling.
          </Text>
        </View>)
      ) : (
        /* Results */
        (<ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary */}
          <View className="flex-row items-center justify-between pt-5 pb-2">
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              <Text className="text-slate-800 dark:text-white font-black">{totalResults} </Text>
              results for{" "}
              <Text className="text-primary font-black">{`"${query}"`}</Text>
            </Text>
          </View>
          {/* Teachers */}
          {results.teachers.length > 0 && (
            <View>
              <SectionHeader title="Teachers" count={results.teachers.length} />
              {results.teachers.map((tch) => (
                <TeacherCard
                  key={`teacher-${tch.id}`}
                  avatar={tch.avatarUrl}
                  name={tch.displayName}
                  verified={tch.isVerified}
                  testCount={tch.testCount}
                  courseCount={tch.courseCount}
                  studentCount={tch.studentCount}
                  onPress={() => router.push(`/expert/${tch.slug}` as any)}
                />
              ))}
            </View>
          )}
          {/* Courses */}
          {results.courses.length > 0 && (
            <View>
              <SectionHeader title="Courses" count={results.courses.length} />
              {results.courses.map((c) => (
                <ResultCard
                  key={`course-${c.id}`}
                  thumbnail={c.thumbnailUrl || c.thumbnailImageUrl}
                  fallback={Placeholder.COURSE}
                  title={c.title}
                  subtitle={c.teacherName || c.teacherDisplayName || "TestKart Expert"}
                  badge={c.level}
                  price={c.price}
                  verified={c.teacherIsVerified}
                  onPress={() => router.push(`/course/${c.slug}` as any)}
                />
              ))}
            </View>
          )}
          {/* Mock Tests */}
          {results.tests.length > 0 && (
            <View>
              <SectionHeader title="Mock Tests" count={results.tests.length} />
              {results.tests.map((t) => (
                <ResultCard
                  key={`test-${t.id}`}
                  thumbnail={t.thumbnailUrl}
                  fallback={Placeholder.TEST}
                  title={t.title}
                  subtitle={t.teacherName}
                  badge={t.questionsCount ? `${t.questionsCount} Qs` : undefined}
                  price={t.price}
                  verified={t.teacherIsVerified}
                  onPress={() => router.push(`/tests/${t.slug}` as any)}
                />
              ))}
            </View>
          )}
          {/* Notes / Digital Products */}
          {results.products.length > 0 && (
            <View>
              <SectionHeader title="Study Notes" count={results.products.length} />
              {results.products.map((p) => (
                <ResultCard
                  key={`product-${p.id}`}
                  thumbnail={p.thumbnailUrl}
                  fallback={Placeholder.NOTE}
                  title={p.title}
                  subtitle={p.teacherName}
                  badge={p.pageCount ? `${p.pageCount} pages` : undefined}
                  price={p.price}
                  verified={p.teacherIsVerified}
                  onPress={() => router.push(`/product/${p.slug}` as any)}
                />
              ))}
            </View>
          )}
          {/* Live Tests */}
          {results.liveTests.length > 0 && (
            <View>
              <SectionHeader title="Live Tests" count={results.liveTests.length} />
              {results.liveTests.map((l) => (
                <ResultCard
                  key={`live-${l.id}`}
                  thumbnail={l.thumbnailUrl}
                  fallback={Placeholder.LIVE}
                  title={l.title}
                  subtitle={l.teacherName}
                  badge="LIVE"
                  price={l.price}
                  onPress={() => router.push(`/live/${l.id}` as any)}
                />
              ))}
            </View>
          )}
          <View className="h-20" />
        </ScrollView>)
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
