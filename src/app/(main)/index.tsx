import BottomTabs from "@/components/BottomTabs";
import BundleCard from "@/components/BundleCard";
import HomeContentCard from "@/components/HomeContentCard";
import HomeRail from "@/components/HomeRail";
import StoreHeader from "@/components/StoreHeader";
import TeacherRailCard from "@/components/TeacherRailCard";
import { themeColors } from "@/constants/theme";
import type { BundleListItem } from "@/types/bundle";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const App = () => {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme);
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
    topMockTests.length > 0 ||
    popularCourses.length > 0 ||
    popularNotes.length > 0 ||
    popularTeachers.length > 0 ||
    bundles.length > 0;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StoreHeader />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-paper dark:bg-night"
      >

        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={c.ink} />
            <Text className="mt-4 text-ink-soft dark:text-night-soft font-medium">
              Loading content...
            </Text>
          </View>
        ) : error ? (
          <View className="px-6 py-10 items-center">
            <Text className="text-ink dark:text-white font-semibold mb-1 text-center">
              Home could not be loaded.
            </Text>
            <Text className="text-ink-soft dark:text-night-soft mb-4 text-center">
              Check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={fetchHomeData}
              className="bg-ink dark:bg-paper px-8 py-3 rounded-xl"
            >
              <Text className="text-white dark:text-ink font-bold">Try again</Text>
            </TouchableOpacity>
          </View>
        ) : !hasContent ? (
          <View className="px-6 py-20 items-center">
            <Text className="text-ink-soft dark:text-night-soft font-medium text-center">
              Nothing to show right now. Check back soon.
            </Text>
          </View>
        ) : (
          <>
            <View className="h-5" />

            <HomeRail
              title="Top mock tests"
              viewAllHref="/tests"
              data={topMockTests}
              keyExtractor={(item) => `test-${item.id}`}
              renderItem={(item) => <HomeContentCard kind="test" item={item} />}
            />

            <HomeRail
              title="Save more with bundles"
              viewAllHref="/bundles"
              data={bundles}
              keyExtractor={(item) => `bundle-${item.id}`}
              renderItem={(item) => <BundleCard bundle={item} variant="rail" />}
            />

            <HomeRail
              title="Popular courses"
              viewAllHref="/courses"
              data={popularCourses}
              keyExtractor={(item) => `course-${item.id}`}
              renderItem={(item) => (
                <HomeContentCard kind="course" item={item} />
              )}
            />

            <HomeRail
              title="Popular notes"
              viewAllHref="/shop"
              data={popularNotes}
              keyExtractor={(item) => `note-${item.id}`}
              renderItem={(item) => <HomeContentCard kind="note" item={item} />}
            />

            <HomeRail
              title="Popular teachers"
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
