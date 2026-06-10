import BottomTabs from "@/components/BottomTabs";
import FeaturedBannerCard from "@/components/FeaturedBannerCard";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HomeCarouselSection from "@/components/HomeCarouselSection";
import NewOnCollection from "@/components/NewOnCollection";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const App = () => {
  const { colorScheme } = useColorScheme();
  const [tests, setTests] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [newestMixed, setNewestMixed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/_api/homepage/data`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      const payload = data.json || data;

      setTests(payload.tests || []);
      setCourses(payload.courses || []);
      setLiveTests(
        (payload.liveTests || []).map((liveTest: any) => ({
          ...liveTest,
          actualQuestionCount: liveTest.totalQuestions,
        })),
      );
      setShopProducts(
        (payload.shopProducts || []).map((product: any) => ({
          ...product,
          teacherAvatar: product.teacherAvatarUrl,
          fileCount: product.pageCount,
          ratingsCount: product.reviewsCount,
        })),
      );
      setNewestMixed(payload.newestMixed || []);
    } catch (err: any) {
      console.error("Home fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const featuredSlides = useMemo(() => {
    type Slide =
      | { kind: "test"; data: any }
      | { kind: "course"; data: any }
      | { kind: "liveTest"; data: any }
      | { kind: "product"; data: any };

    const groups: Slide[][] = [
      tests.map((data) => ({ kind: "test" as const, data })),
      courses.map((data) => ({ kind: "course" as const, data })),
      liveTests.map((data) => ({ kind: "liveTest" as const, data })),
      shopProducts.map((data) => ({ kind: "product" as const, data })),
    ];

    const maxLength = Math.max(0, ...groups.map((group) => group.length));
    const combined: Slide[] = [];
    for (let i = 0; i < maxLength; i++) {
      for (const group of groups) {
        if (group[i]) combined.push(group[i]);
      }
    }
    return combined;
  }, [tests, courses, liveTests, shopProducts]);

  const newestByType = useMemo(() => {
    const groups: Record<"test" | "course" | "liveTest", any[]> = {
      test: [],
      course: [],
      liveTest: [],
    };

    for (const item of newestMixed) {
      const type = item.type as "test" | "course" | "liveTest";
      if (type === "test" || type === "course" || type === "liveTest") {
        groups[type].push(item);
      }
    }

    return groups;
  }, [newestMixed]);

  const hasNewOnTestkart =
    newestByType.test.length > 0 ||
    newestByType.course.length > 0 ||
    newestByType.liveTest.length > 0;

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
      >
        <HeroSection />
        <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#FF8A50" />
            <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium">
              Loading content...
            </Text>
          </View>
        ) : error ? (
          <View className="px-6 py-10 items-center">
            <Text className="text-red-500 mb-4 text-center">{error}</Text>
            <TouchableOpacity
              onPress={fetchHomeData}
              className="bg-primary px-8 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <HomeCarouselSection
              data={featuredSlides}
              keyExtractor={(slide, index) =>
                `${slide.kind}-${slide.data.id ?? index}`
              }
              renderItem={(slide) => (
                <FeaturedBannerCard kind={slide.kind} item={slide.data} />
              )}
            />

            {hasNewOnTestkart && (
              <>
                <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />
                <View className="bg-white dark:bg-slate-900 pb-4">
                  <View className="px-6 pt-10 pb-5 items-center">
                    <Text className="text-4xl font-black text-slate-800 dark:text-white mb-3 text-center">
                      New on TestKart
                    </Text>
                    <Text className="text-base text-slate-500 dark:text-slate-400 leading-6 text-center">
                      Freshly published tests, courses, and resources from our
                      creators.
                    </Text>
                  </View>
                  <NewOnCollection type="test" items={newestByType.test} />
                  <NewOnCollection
                    type="course"
                    items={newestByType.course}
                  />
                  <NewOnCollection
                    type="liveTest"
                    items={newestByType.liveTest}
                  />
                </View>
              </>
            )}
          </>
        )}
        <View className="h-10" />
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default App;
