import AutoSlider from "@/components/AutoSlider";
import BottomTabs from "@/components/BottomTabs";
import BundleCard from "@/components/BundleCard";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HomeContentCard from "@/components/HomeContentCard";
import HomeRail from "@/components/HomeRail";
import LiveSpotlightCard from "@/components/LiveSpotlightCard";
import TeacherRailCard from "@/components/TeacherRailCard";
import type { BundleListItem } from "@/types/bundle";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
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
  const [liveSpotlight, setLiveSpotlight] = useState<any[]>([]);
  const [topMockTests, setTopMockTests] = useState<any[]>([]);
  const [popularCourses, setPopularCourses] = useState<any[]>([]);
  const [popularNotes, setPopularNotes] = useState<any[]>([]);
  const [popularTeachers, setPopularTeachers] = useState<any[]>([]);
  const [bundles, setBundles] = useState<BundleListItem[]>([]);
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

      setLiveSpotlight(payload.liveTestSpotlight || []);
      setTopMockTests(payload.topMockTests || []);
      setPopularCourses(payload.popularCourses || []);
      setPopularNotes(payload.popularNotes || []);
      setPopularTeachers(payload.popularTeachers || []);
    } catch (err: any) {
      console.error("Home fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Bundles aren't part of /homepage/data, so they load on their own and never
  // block (or fail) the rest of the home screen.
  const fetchBundles = useCallback(async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/_api/bundles/list?limit=6&sort=popular`,
      );
      if (!response.ok) return;
      const data = await response.json();
      const payload = data.json || data;
      setBundles(payload.bundles || []);
    } catch (err) {
      console.error("Bundles fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
    fetchBundles();
  }, [fetchHomeData, fetchBundles]);

  const hasContent =
    liveSpotlight.length > 0 ||
    topMockTests.length > 0 ||
    popularCourses.length > 0 ||
    popularNotes.length > 0 ||
    popularTeachers.length > 0 ||
    bundles.length > 0;

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
        ) : !hasContent ? (
          <View className="px-6 py-20 items-center">
            <Text className="text-slate-400 dark:text-slate-500 font-medium text-center">
              Nothing to show right now. Check back soon.
            </Text>
          </View>
        ) : (
          <>
            {liveSpotlight.length > 0 && (
              <View className="bg-white dark:bg-slate-900 pt-6 pb-2">
                <View className="flex-row items-center px-6 mb-4">
                  <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  <Text className="text-2xl font-black text-slate-800 dark:text-white">
                    Live Test Spotlight
                  </Text>
                </View>
                <AutoSlider
                  data={liveSpotlight}
                  keyExtractor={(item) => `live-${item.id}`}
                  renderItem={(item) => <LiveSpotlightCard item={item} />}
                />
              </View>
            )}

            <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />

            <HomeRail
              title="Top Mock Tests"
              viewAllHref="/tests"
              data={topMockTests}
              keyExtractor={(item) => `test-${item.id}`}
              renderItem={(item) => <HomeContentCard kind="test" item={item} />}
            />

            <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />

            <HomeRail
              title="Save More with Bundles"
              viewAllHref="/bundles"
              data={bundles}
              keyExtractor={(item) => `bundle-${item.id}`}
              renderItem={(item) => <BundleCard bundle={item} variant="rail" />}
            />

            {bundles.length > 0 && (
              <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />
            )}

            <HomeRail
              title="Popular Courses"
              viewAllHref="/courses"
              data={popularCourses}
              keyExtractor={(item) => `course-${item.id}`}
              renderItem={(item) => (
                <HomeContentCard kind="course" item={item} />
              )}
            />

            <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />

            <HomeRail
              title="Popular Notes"
              viewAllHref="/shop"
              data={popularNotes}
              keyExtractor={(item) => `note-${item.id}`}
              renderItem={(item) => <HomeContentCard kind="note" item={item} />}
            />

            <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />

            <HomeRail
              title="Popular Teachers"
              data={popularTeachers}
              keyExtractor={(item) => `teacher-${item.id}`}
              renderItem={(item) => <TeacherRailCard teacher={item} />}
            />
          </>
        )}
        <View className="h-10" />
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default App;
