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
  discardAttempt,
  fetchSavedAttempt,
  resumeAttempt,
  SavedAttempt,
} from "@/utils/testProgress";
import {
  StartAttemptRequest,
  StartAttemptResponse,
  TestItemInstructionsResponse,
} from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type AttemptLimit = {
  key: string;
  scope: "subject" | "section";
  label: string;
  caption: string;
  limit: number;
  total: number;
};

type InstructionDetails = {
  id: number;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
  subjectWiseTiming: boolean;
  questionWiseTiming: boolean;
  attemptLimits: AttemptLimit[];
};

/**
 * The attempt caps that actually bind, mirroring `activeAttemptLimit` in
 * `portal/test/[attemptId].tsx` so the instructions never promise an allowance
 * the player then enforces differently.
 *
 * A section cap wins wherever a section declares one. The subject cap is only a
 * fallback, and only when no section in that subject declares one, otherwise an
 * individually-capped section would be counted twice.
 *
 * Caps that are not restrictive (at or above the question count) are dropped:
 * stating them tells the student nothing and would fire on the many tests whose
 * limit was set equal to their question count.
 */
const deriveAttemptLimits = (
  subjects: TestItemInstructionsResponse["subjects"] | undefined,
): AttemptLimit[] => {
  const rows: AttemptLimit[] = [];

  (subjects || []).forEach((subject) => {
    const sections = subject.sections || [];
    const hasSectionCap = sections.some(
      (section) => section.maxAttemptsAllowed != null,
    );

    if (hasSectionCap) {
      sections.forEach((section) => {
        const limit = section.maxAttemptsAllowed;
        if (limit == null) return;

        rows.push({
          key: `section-${section.id}`,
          scope: "section",
          label: section.sectionName || subject.subjectName,
          caption: subject.subjectName,
          limit,
          total: section.questionCount,
        });
      });
      return;
    }

    const limit = subject.maxAttemptsAllowed;
    if (limit == null) return;

    rows.push({
      key: `subject-${subject.id}`,
      scope: "subject",
      label: subject.subjectName,
      caption: "Subject",
      limit,
      // The player counts against the questions it actually loaded, so sum the
      // sections rather than trusting the separately-computed subject total.
      // A subject with no sections has all of its questions at the top level.
      total:
        sections.length > 0
          ? sections.reduce((sum, section) => sum + section.questionCount, 0)
          : subject.questionCount,
    });
  });

  return rows.filter((row) => row.limit < row.total);
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
  const [saved, setSaved] = useState<SavedAttempt | null>(null);
  const [resuming, setResuming] = useState(false);

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
        attemptLimits: deriveAttemptLimits(payload.subjects),
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

  // A paused attempt is optional: if it cannot be read the student still sees
  // the normal Start Test button.
  useEffect(() => {
    if (!token || !itemId || Number.isNaN(itemId)) return;
    let cancelled = false;
    fetchSavedAttempt(token, itemId)
      .then((attempt) => {
        if (!cancelled) setSaved(attempt);
      })
      .catch(() => {
        if (!cancelled) setSaved(null);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, token]);

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

  const handleResumeTest = useCallback(async () => {
    if (!token || !details?.id || !saved) return;

    try {
      setResuming(true);
      const resumed = await resumeAttempt(token, saved.attemptId);

      router.push({
        pathname: "/user/portal/test/[attemptId]",
        params: {
          attemptId: String(resumed.attemptId),
          testItemId: String(details.id),
          startedAt: encodeURIComponent(resumed.startedAt),
          durationMinutes: String(details.durationMinutes),
          resume: "1",
        },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not resume the test.");
    } finally {
      setResuming(false);
    }
  }, [details, router, saved, token]);

  const handleStartNewTest = useCallback(() => {
    if (!token || !saved) return;

    Alert.alert(
      "Start a new test?",
      "Your paused test and its answers will be deleted and a fresh attempt will begin.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start new",
          style: "destructive",
          onPress: async () => {
            try {
              setResuming(true);
              await discardAttempt(token, saved.attemptId);
              setSaved(null);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message || "Could not clear the saved test.",
              );
              return;
            } finally {
              setResuming(false);
            }
            void handleStartTest();
          },
        },
      ],
    );
  }, [handleStartTest, saved, token]);

  if (loading) {
    return (
      <View className="flex-1 bg-paper dark:bg-night items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView className="flex-1 bg-paper dark:bg-night px-6">
        <TouchableOpacity onPress={() => router.back()} className="mt-5 mb-8">
          <Feather
            name="chevron-left"
            size={22}
            color={colorScheme === "dark" ? "#E3DACB" : "#25231F"}
          />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center">
          <Feather name="alert-circle" size={44} color="#FF6B6B" />
          <Text className="w-full text-ink dark:text-white font-extrabold text-xl mt-4 text-center">
            {error || "Unable to load instructions"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Only a single whole-test clock has a meaningful time left to show.
  const timeLeftLabel =
    saved &&
    details.durationMinutes > 0 &&
    !details.subjectWiseTiming &&
    !details.questionWiseTiming
      ? `${Math.floor(
          Math.max(0, details.durationMinutes * 60 - saved.elapsedSeconds) / 60,
        )} min`
      : null;

  const attemptLimits = details.attemptLimits;
  const hasAttemptLimits = attemptLimits.length > 0;
  // "part" covers a test that mixes section-capped and subject-capped areas.
  const limitScopeWord = attemptLimits.every((row) => row.scope === "section")
    ? "section"
    : attemptLimits.every((row) => row.scope === "subject")
      ? "subject"
      : "part";

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
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-sand dark:bg-night-raised border border-line dark:border-night-line items-center justify-center"
            >
              <Feather
                name="chevron-left"
                size={22}
                color={colorScheme === "dark" ? "#E3DACB" : "#25231F"}
              />
            </TouchableOpacity>
            <View className="bg-clay-tint dark:bg-night-raised px-3 py-1 rounded-full border border-line dark:border-night-line">
              <Text className="text-primary-deep dark:text-primary text-[11px] font-extrabold uppercase tracking-wider">
                Test Instructions
              </Text>
            </View>
          </View>

          <Text
            className="text-4xl font-extrabold text-ink dark:text-white leading-tight"
            numberOfLines={2}
          >
            {details.title}
          </Text>
          <Text className="text-ink-soft dark:text-night-soft text-base mt-2">
            Review the details carefully before starting your attempt.
          </Text>

          <View className="flex-row mt-6 mb-8" style={{ gap: 10 }}>
            <View className="flex-1 bg-white dark:bg-night-raised border border-line dark:border-night-line rounded-2xl px-4 py-3">
              <View className="flex-row items-center mb-1">
                <Feather name="clock" size={16} color="#FF8A50" />
                <Text className="text-primary-deep dark:text-primary font-extrabold text-xs uppercase tracking-wider ml-2">
                  Duration
                </Text>
              </View>
              <Text
                className="text-ink dark:text-white text-xl font-extrabold"
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

            <View className="flex-1 bg-white dark:bg-night-raised border border-line dark:border-night-line rounded-2xl px-4 py-3">
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name="help-circle-outline"
                  size={17}
                  color="#FF8A50"
                />
                <Text className="text-primary-deep dark:text-primary font-extrabold text-xs uppercase tracking-wider ml-2">
                  Questions
                </Text>
              </View>
              <Text className="text-ink dark:text-white text-xl font-extrabold">
                {details.totalQuestions || 0} Questions
              </Text>
            </View>
          </View>

          {hasAttemptLimits && (
            <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 mb-8">
              <View className="flex-row items-center mb-2">
                <Feather name="alert-triangle" size={16} color="#f59e0b" />
                <Text className="text-amber-800 dark:text-amber-200 font-extrabold text-xs uppercase tracking-wider ml-2">
                  Attempt Limits
                </Text>
              </View>
              <Text className="text-amber-700 dark:text-amber-300 text-sm font-semibold leading-6 mb-4">
                This test does not let you answer every question. Only the
                counts below are accepted, so choose which questions to spend
                your attempts on.
              </Text>

              {attemptLimits.map((row, index) => (
                <View
                  key={row.key}
                  className={`flex-row items-center justify-between bg-white dark:bg-night-raised border border-amber-100 dark:border-amber-900/40 rounded-2xl px-4 py-3 ${
                    index < attemptLimits.length - 1 ? "mb-2" : ""
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className="text-ink dark:text-white text-base font-extrabold"
                      numberOfLines={1}
                    >
                      {row.label}
                    </Text>
                    <Text
                      className="text-ink-soft dark:text-night-soft text-[10px] font-extrabold uppercase tracking-wider mt-0.5"
                      numberOfLines={1}
                    >
                      {row.caption}
                    </Text>
                  </View>
                  <Text className="text-amber-700 dark:text-amber-300 text-base font-extrabold">
                    {row.limit} of {row.total}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View className="bg-white dark:bg-night-raised border border-line dark:border-night-line rounded-3xl p-5 shadow-sm">
            <Text className="text-ink dark:text-white text-3xl font-extrabold mb-4">
              Instructions
            </Text>
            <View className="mb-2">
              <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                {hasAttemptLimits
                  ? "• Answer only as many questions as the attempt limits above allow."
                  : "• Answer all questions to the best of your ability."}
              </Text>
              {hasAttemptLimits ? (
                <>
                  <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                    {`• Once a limit is reached, the remaining questions in that ${limitScopeWord} are locked.`}
                  </Text>
                  <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                    • Changed your mind? Clear an answer to free up an attempt
                    and use it on another question.
                  </Text>
                </>
              ) : null}
              <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                {details.questionWiseTiming
                  ? "• Once you answer or skip a question, you cannot return to it."
                  : "• You can navigate between questions anytime."}
              </Text>
              <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                {hasAttemptLimits
                  ? "• Click Submit Test once you have spent the attempts you want."
                  : "• Click Submit Test after completing all answers."}
              </Text>
              {!details.questionWiseTiming &&
              !details.subjectWiseTiming &&
              details.durationMinutes <= 0 ? (
                <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                  • No time limit is set — the test will auto-submit after 3
                  hours.
                </Text>
              ) : (
                <Text className="text-ink-soft dark:text-night-soft text-lg leading-8">
                  • Test auto-submits when the timer reaches zero.
                </Text>
              )}
            </View>
          </View>

          <View className="items-center mt-12">
            {saved ? (
              <View className="w-full bg-clay-tint dark:bg-night-raised border border-line dark:border-night-line rounded-3xl p-5">
                <View className="flex-row items-center mb-2">
                  <Feather name="pause-circle" size={18} color="#FF8A50" />
                  <Text className="text-ink dark:text-white text-lg font-extrabold ml-2">
                    You paused this test
                  </Text>
                </View>
                <Text className="text-ink-soft dark:text-night-soft text-sm font-semibold leading-5 mb-4">
                  {`${saved.answeredCount} of ${saved.totalQuestions} answered${
                    timeLeftLabel ? `, ${timeLeftLabel} left` : ""
                  }. Paused ${new Date(saved.savedAt).toLocaleString(
                    undefined,
                    {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    },
                  )}.`}
                </Text>
                <TouchableOpacity
                  onPress={handleResumeTest}
                  disabled={resuming || startingAttempt}
                  className="bg-primary-deep w-full h-14 rounded-2xl items-center justify-center shadow-sm"
                >
                  {resuming ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white text-xl font-extrabold">
                      Resume Test
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartNewTest}
                  disabled={resuming || startingAttempt}
                  className="w-full h-12 mt-3 rounded-2xl items-center justify-center border border-line dark:border-night-line"
                >
                  {startingAttempt ? (
                    <ActivityIndicator color="#FF8A50" />
                  ) : (
                    <Text className="text-ink dark:text-night-soft text-base font-extrabold">
                      Start a new test
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleStartTest}
                disabled={startingAttempt}
                className="bg-primary-deep w-full h-14 rounded-2xl items-center justify-center shadow-sm"
              >
                {startingAttempt ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-2xl font-extrabold">
                    Start Test
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Portal;
