import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import {
  EnrolledTest,
  StartAttemptRequest,
  StartAttemptResponse,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type EnrolledTestItem = NonNullable<EnrolledTest["testItems"]>[number];

type EnrolledTestsApiPayload = {
  enrolledTests?: EnrolledTest[];
  tests?: EnrolledTest[];
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const Portal = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();

  const [details, setDetails] = useState<EnrolledTestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemId = useMemo(() => {
    const rawSlug = Array.isArray(slug) ? slug[0] : slug;
    return Number(rawSlug);
  }, [slug]);

  const fetchInstructionsDetails = useCallback(async () => {
    if (!token || !itemId || Number.isNaN(itemId)) {
      setLoading(false);
      setError("Invalid test item.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BASE_URL}/_api/student/enrolled-tests?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch test details");
      }

      const data = await response.json();
      const payload = (data.json || data) as EnrolledTestsApiPayload;
      const enrolledTests = payload.enrolledTests || payload.tests || [];
      const allItems: EnrolledTestItem[] = enrolledTests.flatMap(
        (testPack) => testPack.testItems || [],
      );

      const matchedItem = allItems.find((item) => item.id === itemId);

      if (!matchedItem) {
        throw new Error("Test details not found");
      }

      setDetails(matchedItem);
    } catch (err: any) {
      setError(err.message || "Could not load test instructions");
    } finally {
      setLoading(false);
    }
  }, [itemId, token]);

  useEffect(() => {
    fetchInstructionsDetails();
  }, [fetchInstructionsDetails]);

  const handleStartTest = useCallback(async () => {
    if (!token || !details?.id) {
      Alert.alert("Error", "Unable to start test. Please login again.");
      return;
    }

    try {
      setStartingAttempt(true);

      const startPayload: StartAttemptRequest = {
        testItemId: details.id,
      };

      const startResponse = await fetch(
        `${BASE_URL}/_api/student/test-item/start-attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: startPayload }),
        },
      );

      if (!startResponse.ok) {
        let startAttemptError = `Failed to start test attempt (HTTP ${startResponse.status})`;

        try {
          const errorData = (await startResponse.json()) as ApiErrorPayload;
          startAttemptError =
            errorData.message || errorData.error || startAttemptError;
        } catch {
          // Ignore parse errors and use default status-based message.
        }

        throw new Error(startAttemptError);
      }

      const startData = await startResponse.json();
      const startAttempt = (startData.json ||
        startData) as StartAttemptResponse;

      const startedAtParam = encodeURIComponent(startAttempt.startedAt);
      router.push(
        `/(user)/portal/test/${startAttempt.attemptId}?testItemId=${details.id}&startedAt=${startedAtParam}` as any,
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not start the test.");
    } finally {
      setStartingAttempt(false);
    }
  }, [details?.id, router, token]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mt-5 mb-8">
          <Feather
            name="arrow-left"
            size={22}
            color={colorScheme === "dark" ? "#e2e8f0" : "#1e293b"}
          />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Feather name="alert-circle" size={44} color="#FF6B6B" />
          <Text className="text-slate-800 dark:text-white font-black text-xl mt-4 text-center">
            {error || "Unable to load instructions"}
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
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 items-center justify-center"
            >
              <Feather
                name="arrow-left"
                size={20}
                color={colorScheme === "dark" ? "#e2e8f0" : "#1e293b"}
              />
            </TouchableOpacity>
            <View className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-800/40">
              <Text className="text-primary text-[11px] font-black uppercase tracking-wider">
                Test Instructions
              </Text>
            </View>
          </View>

          <Text
            className="text-4xl font-black text-slate-800 dark:text-white leading-tight"
            numberOfLines={2}
          >
            {details.title}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-base mt-2">
            Review the details carefully before starting your attempt.
          </Text>

          <View className="flex-row mt-6 mb-8" style={{ gap: 10 }}>
            <View className="flex-1 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl px-4 py-3">
              <View className="flex-row items-center mb-1">
                <Feather name="clock" size={16} color="#FF8A50" />
                <Text className="text-primary font-black text-xs uppercase tracking-wider ml-2">
                  Duration
                </Text>
              </View>
              <Text className="text-slate-800 dark:text-white text-xl font-black">
                {details.durationMinutes || 0} Minutes
              </Text>
            </View>

            <View className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="help-circle-outline"
                  size={17}
                  color="#FF8A50"
                />
                <Text className="text-primary font-black text-xs uppercase tracking-wider ml-2">
                  Questions
                </Text>
              </View>
              <Text className="text-slate-800 dark:text-white text-xl font-black">
                {details.totalQuestions || 0} Questions
              </Text>
            </View>
          </View>

          <View className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
            <Text className="text-slate-900 dark:text-white text-3xl font-black mb-4">
              Instructions
            </Text>
            <View className="mb-2">
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                • Answer all questions to the best of your ability.
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                • You can navigate between questions anytime.
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                • Click Submit Test after completing all answers.
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                • Test auto-submits when the timer reaches zero.
              </Text>
            </View>
          </View>

          <View className="items-center mt-12">
            <TouchableOpacity
              onPress={handleStartTest}
              disabled={startingAttempt}
              className="bg-primary w-full py-4 rounded-2xl items-center shadow-sm"
            >
              {startingAttempt ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-2xl font-black">
                  Start Test
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-10 flex-row items-center"
            >
              <Feather
                name="arrow-left"
                size={22}
                color={colorScheme === "dark" ? "#e2e8f0" : "#1e293b"}
              />
              <Text className="text-slate-800 dark:text-slate-200 text-2xl font-bold ml-3">
                Back to Dashboard
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Portal;
