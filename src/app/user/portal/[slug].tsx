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
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import {
  StartAttemptRequest,
  StartAttemptResponse,
  TestItemInstructionsResponse,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type InstructionDetails = {
  id: number;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  subjectWiseTiming: boolean;
  questionWiseTiming: boolean;
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

const Portal = () => {
  const params = useLocalSearchParams();
  const { slug } = params;
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();

  const [details, setDetails] = useState<InstructionDetails | null>(null);
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
        `${BASE_URL}/_api/student/test-item/instructions?testItemId=${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        let fallback: string;
        switch (response.status) {
          case 400:
            fallback = "Invalid test item.";
            break;
          case 403:
            fallback = "You don't have access to this test.";
            break;
          case 404:
            fallback = "Test not found.";
            break;
          case 500:
            fallback = "Server error. Please try again.";
            break;
          default:
            fallback = `Failed to load instructions (HTTP ${response.status})`;
        }

        try {
          const errorData = (await response.json()) as ApiErrorPayload;
          fallback = errorData.message || errorData.error || fallback;
        } catch {
          // Ignore parse errors and use status-based message.
        }

        throw new Error(fallback);
      }

      const data = await response.json();
      console.log("[test-item/instructions] response:", data);
      const payload = (data.json ?? data) as TestItemInstructionsResponse;

      if (!payload?.testItem) {
        throw new Error("Test details not found");
      }

      setDetails({
        id: payload.testItem.id,
        title: payload.testItem.title,
        durationMinutes: payload.testItem.durationMinutes,
        totalQuestions: payload.testItem.totalQuestions,
        subjectWiseTiming: !!payload.testItem.subjectWiseTiming,
        questionWiseTiming: !!payload.testItem.questionWiseTiming,
      });
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
      router.push({
        pathname: "/user/portal/test/[attemptId]",
        params: {
          attemptId: String(startAttempt.attemptId),
          testItemId: String(details.id),
          startedAt: startedAtParam,
          durationMinutes: String(details.durationMinutes),
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not start the test.");
    } finally {
      setStartingAttempt(false);
    }
  }, [details?.id, details?.durationMinutes, router, token]);

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
            <View className="flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3">
              <View className="flex-row items-center mb-1">
                <Feather name="clock" size={16} color="#FF8A50" />
                <Text className="text-primary font-black text-xs uppercase tracking-wider ml-2">
                  Duration
                </Text>
              </View>
              <Text
                className="text-slate-800 dark:text-white text-xl font-black"
                numberOfLines={1}
              >
                {details.questionWiseTiming
                  ? "Question wise"
                  : details.subjectWiseTiming
                    ? "Subject wise"
                    : details.durationMinutes > 0
                      ? `${details.durationMinutes} Minutes`
                      : "No limit"}
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
                {details.questionWiseTiming
                  ? "• Once you answer or skip a question, you cannot return to it."
                  : "• You can navigate between questions anytime."}
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                • Click Submit Test after completing all answers.
              </Text>
              {!details.questionWiseTiming &&
              !details.subjectWiseTiming &&
              details.durationMinutes <= 0 ? (
                <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                  • No time limit is set — the test will auto-submit after 3
                  hours.
                </Text>
              ) : (
                <Text className="text-slate-600 dark:text-slate-300 text-lg leading-8">
                  • Test auto-submits when the timer reaches zero.
                </Text>
              )}
            </View>
          </View>

          <View className="items-center mt-12">
            <TouchableOpacity
              onPress={handleStartTest}
              disabled={startingAttempt}
              className="bg-primary w-full h-14 rounded-2xl items-center justify-center shadow-sm"
            >
              {startingAttempt ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-2xl font-black">
                  Start Test
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Portal;
