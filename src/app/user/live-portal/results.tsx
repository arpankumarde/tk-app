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
import { useLocalSearchParams, useRouter } from "expo-router";
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface LiveResultData {
  attemptId: number;
  score: number;
  totalMarks: number;
  maxPossibleMarks: number;
  correctAnswers: number;
  totalQuestions?: number;
  timeTaken?: number;
  results: { isCorrect: boolean }[];
}

const LiveResultsScreen = () => {
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

  const incorrectCount = useMemo(() => {
    if (!resultData) return 0;
    const total =
      resultData.totalQuestions || resultData.results.length || 0;
    return Math.max(0, total - correctCount);
  }, [correctCount, resultData]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !resultData) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 px-6">
        <TouchableOpacity
          onPress={() => router.replace("/user")}
          className="mt-5 mb-8"
        >
          <Feather
            name="arrow-left"
            size={22}
            color={colorScheme === "dark" ? "#e2e8f0" : "#1e293b"}
          />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Feather name="alert-circle" size={44} color="#FF6B6B" />
          <Text className="text-slate-800 dark:text-white font-black text-xl mt-4 text-center">
            {error || "Unable to load results"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-900"
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
              className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mr-3"
            >
              <Feather name="chevron-left" size={24} color="#FF8A50" />
            </TouchableOpacity>
            <Text className="text-slate-900 dark:text-white text-2xl font-black leading-tight">
              Test Results
            </Text>
          </View>

          {/* Score Card */}
          <View className="mt-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm mb-3">
            <Text className="text-slate-600 dark:text-slate-300 font-black text-base mb-1">
              Your Score
            </Text>
            <Text className="text-primary text-5xl font-black tracking-tight">
              {Number(resultData.score).toFixed(2)}%
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 font-semibold text-lg mt-1">
              {correctCount} /{" "}
              {resultData.totalQuestions || resultData.results.length || 0}{" "}
              correct
            </Text>

            <View className="mt-3 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${scoreProgress}%` }}
              />
            </View>
          </View>

          {/* Stats Cards */}
          <View style={{ gap: 8 }}>
            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="check-circle" size={18} color="#22c55e" />
                  <Text className="ml-2 text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                    Correct
                  </Text>
                </View>
                <Text className="text-slate-900 dark:text-white text-3xl font-black">
                  {correctCount}
                </Text>
              </View>

              <View className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="x-circle" size={18} color="#ef4444" />
                  <Text className="ml-2 text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                    Incorrect
                  </Text>
                </View>
                <Text className="text-slate-900 dark:text-white text-3xl font-black">
                  {incorrectCount}
                </Text>
              </View>
            </View>

            <View className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3">
              <View className="flex-row items-center mb-1">
                <Feather name="clock" size={18} color="#0284c7" />
                <Text className="ml-2 text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                  Time Taken
                </Text>
              </View>
              <Text className="text-slate-900 dark:text-white text-3xl font-black">
                {formatDuration(resultData.timeTaken)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LiveResultsScreen;
