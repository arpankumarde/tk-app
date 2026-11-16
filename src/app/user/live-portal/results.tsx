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
import { usePreventScreenCapture } from "expo-screen-capture";
import { useLocalSearchParams, useRouter } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import { getAttemptStats } from "@/utils/attemptStats";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface LiveResultData {
  attemptId: number;
  score: number;
  totalMarks: number;
  maxPossibleMarks: number;
  correctAnswers: number;
  totalQuestions?: number;
  timeTaken?: number;
  results: {
    isCorrect?: boolean | null;
    selectedOption?: string | null;
    selectedOptions?: string[] | null;
    studentNumericalAnswer?: number | null;
    matchAnswers?: Record<string, string> | null;
  }[];
}

const LiveResultsScreen = () => {
  usePreventScreenCapture("live-results");
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();
  const { testItemId, submitResult } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<LiveResultData | null>(null);

  const testItemNumericId = useMemo(() => {
    const raw = Array.isArray(testItemId) ? testItemId[0] : testItemId;
    return Number(raw);
  }, [testItemId]);

  const parsedSubmitResult = useMemo(() => {
    const raw = Array.isArray(submitResult) ? submitResult[0] : submitResult;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [submitResult]);

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const normalizePayload = useCallback(
    (payload: any): LiveResultData => ({
      attemptId: payload.attemptId || payload.attempt?.id || 0,
      score: payload.score || payload.attempt?.score || 0,
      totalMarks: payload.totalMarks || payload.attempt?.totalMarks || 0,
      maxPossibleMarks:
        payload.maxPossibleMarks || payload.attempt?.maxPossibleMarks || 0,
      correctAnswers: payload.correctAnswers || 0,
      totalQuestions: payload.totalQuestions || payload.results?.length || 0,
      timeTaken: payload.timeTakenSeconds || payload.timeTaken || payload.attempt?.timeTaken,
      results: payload.results || [],
    }),
    [],
  );

  useEffect(() => {
    if (parsedSubmitResult) {
      setResultData(normalizePayload(parsedSubmitResult));
      setLoading(false);
      return;
    }

    if (!token || !testItemNumericId || Number.isNaN(testItemNumericId)) {
      setLoading(false);
      setError("Invalid test item.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${BASE_URL}/_api/student/test-attempts/latest-results?testItemId=${testItemNumericId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to load results (HTTP ${response.status})`);
        }

        const data = await response.json();
        const payload = data.json || data;
        setResultData(normalizePayload(payload));
      } catch (err: any) {
        setError(err.message || "Unable to load test results.");
      } finally {
        setLoading(false);
      }
    })();
  }, [normalizePayload, parsedSubmitResult, testItemNumericId, token]);

  const scoreProgress = useMemo(() => {
    if (!resultData || !resultData.maxPossibleMarks) return 0;
    const raw = (resultData.totalMarks / resultData.maxPossibleMarks) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [resultData]);

  const correctCount = useMemo(() => {
    if (!resultData) return 0;
    return (
      resultData.correctAnswers ||
      resultData.results.filter((item) => item.isCorrect).length
    );
  }, [resultData]);

  const attemptStats = useMemo(
    () =>
      getAttemptStats(
        resultData?.results ?? [],
        correctCount,
        resultData?.totalQuestions ?? 0,
      ),
    [correctCount, resultData],
  );

  if (loading) {
    return (
      <View className="flex-1 bg-paper dark:bg-night items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !resultData) {
    return (
      <SafeAreaView className="flex-1 bg-paper dark:bg-night px-6">
        <TouchableOpacity
          onPress={() => router.replace("/user")}
          className="mt-5 mb-8"
        >
          <Feather
            name="chevron-left"
            size={22}
            color={colorScheme === "dark" ? "#E3DACB" : "#25231F"}
          />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Feather name="alert-circle" size={44} color="#FF6B6B" />
          <Text className="w-full text-ink dark:text-white font-extrabold text-xl mt-4 text-center">
            {error || "Unable to load results"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-4 pt-3">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.replace("/user")}
              className="w-10 h-10 bg-sand dark:bg-night-raised rounded-full items-center justify-center mr-3"
            >
              <Feather name="chevron-left" size={24} color="#FF8A50" />
            </TouchableOpacity>
            <Text className="text-ink dark:text-white text-2xl font-extrabold leading-tight">
              Test Results
            </Text>
          </View>

          {/* Score Card */}
          <View className="mt-3 bg-white dark:bg-night border border-line dark:border-night-line rounded-2xl p-4 shadow-sm mb-3">
            <Text className="text-ink-soft dark:text-night-soft font-extrabold text-base mb-1">
              Your Score
            </Text>
            <Text className="text-primary-deep dark:text-primary text-5xl font-extrabold tracking-tight">
              {Number(resultData.score).toFixed(2)}%
            </Text>
            <Text className="text-ink-soft dark:text-night-soft font-semibold text-lg mt-1">
              {correctCount} / {attemptStats.total} correct ·{" "}
              {attemptStats.attempted} / {attemptStats.total} attempted
            </Text>

            <View className="mt-3 h-2.5 rounded-full bg-line dark:bg-night-line overflow-hidden">
              <View
                className="h-full bg-primary-deep"
                style={{ width: `${scoreProgress}%` }}
              />
            </View>
          </View>

          {/* Stats Cards */}
          <View style={{ gap: 8 }}>
            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1 bg-paper dark:bg-night border border-line dark:border-night-line rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="check-circle" size={18} color="#22c55e" />
                  <Text className="ml-2 text-ink-soft dark:text-night-soft font-extrabold text-xs uppercase">
                    Correct
                  </Text>
                </View>
                <Text className="text-ink dark:text-white text-3xl font-extrabold">
                  {correctCount}
                </Text>
              </View>

              <View className="flex-1 bg-paper dark:bg-night border border-line dark:border-night-line rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="x-circle" size={18} color="#ef4444" />
                  <Text className="ml-2 text-ink-soft dark:text-night-soft font-extrabold text-xs uppercase">
                    Incorrect
                  </Text>
                </View>
                <Text className="text-ink dark:text-white text-3xl font-extrabold">
                  {attemptStats.incorrect}
                </Text>
              </View>
            </View>

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1 bg-paper dark:bg-night border border-line dark:border-night-line rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="minus-circle" size={18} color="#6A6358" />
                  <Text className="ml-2 text-ink-soft dark:text-night-soft font-extrabold text-xs uppercase">
                    Not Attempted
                  </Text>
                </View>
                <Text className="text-ink dark:text-white text-3xl font-extrabold">
                  {attemptStats.notAttempted}
                </Text>
              </View>

              <View className="flex-1 bg-paper dark:bg-night border border-line dark:border-night-line rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="clock" size={18} color="#3F6577" />
                  <Text className="ml-2 text-ink-soft dark:text-night-soft font-extrabold text-xs uppercase">
                    Time Taken
                  </Text>
                </View>
                <Text className="text-ink dark:text-white text-3xl font-extrabold">
                  {formatDuration(resultData.timeTaken)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LiveResultsScreen;
