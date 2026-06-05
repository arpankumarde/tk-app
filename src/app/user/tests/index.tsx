import BottomTabs from "@/components/BottomTabs";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
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
import EnrolledTestCard from "../_components/EnrolledTestCard";
import { EnrolledTest } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const PAGE_LIMIT = 20;

type EnrolledTestsApiPayload = {
  enrolledTests?: EnrolledTest[];
  tests?: EnrolledTest[];
  total?: number;
};

export default function EnrolledTestsScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();

  const [tests, setTests] = useState<EnrolledTest[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchTests = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!token) return;

      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        const response = await fetch(
          `${BASE_URL}/_api/student/enrolled-tests?page=${pageNum}&limit=${PAGE_LIMIT}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch enrolled tests");

        const data = await response.json();
        const payload = (data.json || data) as EnrolledTestsApiPayload;
        const pageTests =
          payload.enrolledTests ||
          payload.tests ||
          (Array.isArray(payload) ? (payload as EnrolledTest[]) : []);

        if (append) {
          setTests((prev) => [...prev, ...pageTests]);
        } else {
          setTests(pageTests);
        }

        setTotal((prevTotal) => {
          const nextTotal =
            payload.total || (append ? prevTotal : pageTests.length);

          const hasNextByTotal = nextTotal
            ? pageNum * PAGE_LIMIT < nextTotal
            : pageTests.length === PAGE_LIMIT;
          setHasMore(hasNextByTotal);

          return nextTotal;
        });
      } catch (error) {
        console.error("Error fetching enrolled tests:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchTests(1, false);
  }, [fetchTests]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    fetchTests(nextPage, true);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-950"
      edges={["top", "left", "right"]}
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
            Enrolled Tests
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">
            Showing {tests.length} of {total || tests.length} enrolled test
            packages
          </Text>
        </View>

        <View className="px-6">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : tests.length > 0 ? (
            <>
              {tests.map((test) => (
                <EnrolledTestCard key={test.id} test={test} />
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
              <Feather name="file-text" size={40} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-3 text-base">
                No enrolled tests yet
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                Test packages you enroll in will appear here
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
