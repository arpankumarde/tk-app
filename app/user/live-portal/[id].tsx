import { useCallback, useEffect, useState } from "react";
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
import BlinkingDot from "@/components/BlinkingDot";
import { StartAttemptRequest, StartAttemptResponse } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface LiveTestDetails {
  id: number;
  mockTestId: number;
  title: string;
  description: string;
  price: number;
  startTime: string | null;
  endTime: string;
  registrationDeadline: string | null;
  maxSeats: number;
  enrolledCount: number;
  isEnrolled: boolean;
  canEnroll: boolean;
  hasAttempted: boolean;
  hasPrizes: boolean;
  totalPrizePool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  mockTestDurationMinutes: number;
  mockTestDetails: {
    id: number;
    title: string;
    description: string;
    durationMinutes: number;
    totalQuestions: number;
    subject: string;
    firstTestItemId: number;
  };
}

const LivePortal = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();

  const [details, setDetails] = useState<LiveTestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [startingAttempt, setStartingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveTestId = Array.isArray(id) ? id[0] : id;

  const fetchLiveTestDetails = useCallback(async () => {
    if (!token || !liveTestId) {
      setLoading(false);
      setError("Invalid live test.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BASE_URL}/_api/live-tests/details?id=${liveTestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch live test details");
      }

      const data = await response.json();
      const payload = data.json || data;
      console.log("[LivePortal] Details response:", JSON.stringify(payload, null, 2));

      if (!payload.isEnrolled) {
        throw new Error("You are not enrolled in this live test.");
      }

      if (payload.hasAttempted) {
        throw new Error("You have already attempted this live test.");
      }

      setDetails(payload);
    } catch (err: any) {
      setError(err.message || "Could not load live test details");
    } finally {
      setLoading(false);
    }
  }, [liveTestId, token]);

  useEffect(() => {
    fetchLiveTestDetails();
  }, [fetchLiveTestDetails]);

  const handleStartTest = useCallback(async () => {
    if (!token || !details?.mockTestDetails?.firstTestItemId) {
      Alert.alert("Error", "Unable to start test. Please login again.");
      return;
    }

    try {
      setStartingAttempt(true);

      const startPayload: StartAttemptRequest = {
        testItemId: details.mockTestDetails.firstTestItemId,
      };

      console.log("[LivePortal] Starting attempt with payload:", startPayload);

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
          const errorData = await startResponse.json();
          startAttemptError =
            errorData.message || errorData.error || startAttemptError;
        } catch {
          // Ignore parse errors
        }

        throw new Error(startAttemptError);
      }

      const startData = await startResponse.json();
      const startAttempt = (startData.json ||
        startData) as StartAttemptResponse;
      console.log("[LivePortal] Start attempt response:", JSON.stringify(startAttempt, null, 2));

      const startedAtParam = encodeURIComponent(startAttempt.startedAt);
      router.push({
        pathname: "/user/portal/test/[attemptId]",
        params: {
          attemptId: String(startAttempt.attemptId),
          testItemId: String(details.mockTestDetails.firstTestItemId),
          startedAt: startedAtParam,
          durationMinutes: String(details.mockTestDetails.durationMinutes || 60),
          mode: "live",
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not start the test.");
    } finally {
      setStartingAttempt(false);
    }
  }, [details, router, token]);

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

  const { mockTestDetails } = details;

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
            <View className="bg-red-500 px-3 py-1.5 rounded-full flex-row items-center border border-red-400 shadow-lg">
              <BlinkingDot />
              <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                LIVE
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
                {mockTestDetails.durationMinutes} Minutes
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
                {mockTestDetails.totalQuestions} Questions
              </Text>
            </View>
          </View>

          {/* Instructions Card */}
          <View className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm">
            <Text className="text-slate-900 dark:text-white text-3xl font-black mb-4">
              Instructions
            </Text>
            <Text className="text-slate-600 dark:text-slate-300 text-base leading-7">
              This is a live, competitive test. You can attempt it only once.
              Once you start, the timer begins immediately and cannot be paused.
              The test will be submitted automatically when the timer runs out.
              Make sure you are fully prepared before starting. Good luck!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <SafeAreaView edges={["bottom"]} className="px-6 pt-3 pb-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
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
      </SafeAreaView>
    </SafeAreaView>
  );
};

export default LivePortal;
