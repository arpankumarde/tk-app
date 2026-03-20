import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { WebView } from "react-native-webview";
import { useAuth } from "@/context/AuthContext";
import {
  LatestAttemptResultsResponse,
  LatestAttemptResultsPayload,
  OptionLetter,
  Question,
  StudentAnswer,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from "../../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const DEFAULT_DURATION_MINUTES = 60;

type QuestionsApiPayload = {
  questions: Question[];
  calculatorEnabled: boolean;
};

type QuestionCategory =
  | "single"
  | "multi"
  | "numeric"
  | "assertion_reason"
  | "comprehension"
  | "unknown";

type NormalizedQuestion = Question & {
  category: QuestionCategory;
};

type SelectedAnswer = number | number[] | string | null;

const mapQuestionCategory = (questionType?: string): QuestionCategory => {
  switch (questionType) {
    case "single_correct_mcq":
      return "single";
    case "multiple_correct_mcq":
      return "multi";
    case "numerical":
      return "numeric";
    case "assertion_reason":
      return "assertion_reason";
    case "comprehension":
      return "comprehension";
    default:
      return "unknown";
  }
};

const hasHtmlTags = (value?: string | null) => {
  if (!value) return false;
  return /<[^>]+>/.test(value);
};

const sanitizeHtml = (html: string) => {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<p>(\s|&nbsp;|<br\s*\/?\s*>)*<\/p>/gi, "");
};

const htmlToPlainText = (html: string) => {
  return sanitizeHtml(html)
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const shouldUseWebView = (html: string) => {
  const cleaned = sanitizeHtml(html);
  return /<img|data-type="mathematics"|<table|<ol|<ul|<video|<iframe/i.test(
    cleaned,
  );
};

const getHtmlDocument = (html: string, isDark: boolean) => {
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#475569";
  const bg = "transparent";

  const cleanedHtml = sanitizeHtml(html);

  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            margin: 0;
            padding: 0;
            color: ${textColor};
            background: ${bg};
            font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;
            font-size: 16px;
            line-height: 1.5;
          }
          p { margin: 0 0 10px 0; color: ${textColor}; }
          img { max-width: 100%; height: auto; border-radius: 8px; }
          span { color: ${textColor}; }
          .muted { color: ${mutedColor}; }
        </style>
      </head>
      <body>
        ${cleanedHtml}
        <script>
          function sendHeight() {
            var body = document.body;
            var html = document.documentElement;
            var height = Math.max(
              body ? body.scrollHeight : 0,
              body ? body.offsetHeight : 0,
              html ? html.clientHeight : 0,
              html ? html.scrollHeight : 0,
              html ? html.offsetHeight : 0
            );

            window.ReactNativeWebView.postMessage(String(height));
          }

          function watchImages() {
            var images = document.querySelectorAll('img');
            images.forEach(function (img) {
              if (!img.complete) {
                img.addEventListener('load', sendHeight);
                img.addEventListener('error', sendHeight);
              }
            });
          }

          document.addEventListener('DOMContentLoaded', function () {
            sendHeight();
            watchImages();
          });

          window.addEventListener('load', function () {
            sendHeight();
            setTimeout(sendHeight, 120);
            setTimeout(sendHeight, 300);
            setTimeout(sendHeight, 700);
          });

          var observer = new MutationObserver(function () {
            sendHeight();
          });

          observer.observe(document.body, { childList: true, subtree: true, attributes: true });

          sendHeight();
        </script>
      </body>
    </html>
  `;
};

const HtmlContent = ({ html, isDark }: { html: string; isDark: boolean }) => {
  const [contentHeight, setContentHeight] = useState(40);

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: getHtmlDocument(html, isDark) }}
      style={{ height: contentHeight, backgroundColor: "transparent" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      onMessage={(event) => {
        const nextHeight = Number(event.nativeEvent.data);
        if (!Number.isNaN(nextHeight) && nextHeight > 0) {
          setContentHeight(nextHeight + 8);
        }
      }}
    />
  );
};

const TestAttemptScreen = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();
  const { attemptId, testItemId, startedAt } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, SelectedAnswer>
  >({});
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubjectFilterCollapsed, setIsSubjectFilterCollapsed] =
    useState(false);
  const [isQuestionNavigatorCollapsed, setIsQuestionNavigatorCollapsed] =
    useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_DURATION_MINUTES * 60,
  );

  const attemptNumericId = useMemo(() => {
    const raw = Array.isArray(attemptId) ? attemptId[0] : attemptId;
    return Number(raw);
  }, [attemptId]);

  const testItemNumericId = useMemo(() => {
    const raw = Array.isArray(testItemId) ? testItemId[0] : testItemId;
    return Number(raw);
  }, [testItemId]);

  const startedAtRaw = useMemo(() => {
    const raw = Array.isArray(startedAt) ? startedAt[0] : startedAt;
    return typeof raw === "string" ? raw : "";
  }, [startedAt]);

  const startedAtDisplay = useMemo(() => {
    if (!startedAtRaw) {
      return "-";
    }

    const parsedDate = new Date(startedAtRaw);

    if (Number.isNaN(parsedDate.getTime())) {
      return startedAtRaw;
    }

    return parsedDate.toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [startedAtRaw]);

  const attemptStartTime = useMemo(() => {
    if (!startedAtRaw) {
      return Date.now();
    }

    const parsed = new Date(startedAtRaw).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }, [startedAtRaw]);

  const fetchQuestions = useCallback(async () => {
    if (!token || !testItemNumericId || Number.isNaN(testItemNumericId)) {
      setLoading(false);
      Alert.alert("Error", "Invalid test session.");
      return;
    }

    try {
      setLoading(true);

      const requestUrl = `${BASE_URL}/_api/student/test-item/questions?testItemId=${testItemNumericId}`;
      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch test questions");
      }

      const data = await response.json();
      const payload = (data.json || data) as QuestionsApiPayload;

      // Transform questions to convert individual options into array format
      const transformedQuestions: NormalizedQuestion[] = (
        payload.questions || []
      ).map((q: any) => {
        const optionsArray: string[] = [];

        // Convert optionA, optionB, optionC, optionD to array
        if (q.optionA) optionsArray.push(q.optionA);
        if (q.optionB) optionsArray.push(q.optionB);
        if (q.optionC) optionsArray.push(q.optionC);
        if (q.optionD) optionsArray.push(q.optionD);

        return {
          ...q,
          options: optionsArray,
          type: q.questionType,
          marks: q.positiveMarks ? parseFloat(String(q.positiveMarks)) : 0,
          negativeMarks: q.negativeMarks
            ? parseFloat(String(q.negativeMarks))
            : 0,
          category: mapQuestionCategory(q.questionType),
        };
      });

      console.log("[TestAttempt] Questions:", transformedQuestions);

      setQuestions(transformedQuestions);
      setCalculatorEnabled(Boolean(payload.calculatorEnabled));
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load test questions.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, testItemNumericId, token]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    const initialRemaining =
      DEFAULT_DURATION_MINUTES * 60 -
      Math.floor((Date.now() - attemptStartTime) / 1000);
    setRemainingSeconds(Math.max(0, initialRemaining));

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [attemptStartTime]);

  const timerLabel = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingSeconds]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Map<string, string>();
    questions.forEach((q) => {
      if (q.subjectName) {
        subjects.set(q.subjectName, q.subjectName);
      }
    });
    return Array.from(subjects.values());
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (!selectedSubject) return questions;
    return questions.filter((q) => q.subjectName === selectedSubject);
  }, [questions, selectedSubject]);

  const displayedQuestions =
    filteredQuestions.length > 0 ? filteredQuestions : questions;
  const currentQuestion = displayedQuestions[currentQuestionIndex] || null;

  const handleSelectSingleOption = (
    questionId: number,
    optionIndex: number,
  ) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleToggleMultiOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      const prevValue = prev[questionId];
      const selected = Array.isArray(prevValue) ? prevValue : [];
      const exists = selected.includes(optionIndex);

      return {
        ...prev,
        [questionId]: exists
          ? selected.filter((item) => item !== optionIndex)
          : [...selected, optionIndex],
      };
    });
  };

  const handleNumericAnswerChange = (questionId: number, value: string) => {
    // Keep it numeric but user-friendly while typing.
    if (!/^-?\d*\.?\d*$/.test(value)) {
      return;
    }

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const getSingleSelectedIndex = (questionId: number) => {
    const value = selectedAnswers[questionId];
    return typeof value === "number" ? value : null;
  };

  const getMultiSelectedIndexes = (questionId: number) => {
    const value = selectedAnswers[questionId];
    return Array.isArray(value) ? value : [];
  };

  const getNumericAnswer = (questionId: number) => {
    const value = selectedAnswers[questionId];
    return typeof value === "string" ? value : "";
  };

  const isQuestionAnswered = useCallback(
    (question: NormalizedQuestion) => {
      const value = selectedAnswers[question.id];

      if (question.category === "multi") {
        return Array.isArray(value) && value.length > 0;
      }

      if (question.category === "numeric") {
        return typeof value === "string" && value.trim().length > 0;
      }

      return typeof value === "number";
    },
    [selectedAnswers],
  );

  const overallAnsweredCount = useMemo(() => {
    return questions.filter((question) => isQuestionAnswered(question)).length;
  }, [isQuestionAnswered, questions]);

  const subjectProgressRows = useMemo(() => {
    const grouped = new Map<string, NormalizedQuestion[]>();

    questions.forEach((question) => {
      const key = question.subjectName || "General";
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, question]);
    });

    return Array.from(grouped.entries()).map(
      ([subjectName, subjectQuestions]) => {
        const answeredCount = subjectQuestions.filter((question) =>
          isQuestionAnswered(question),
        ).length;

        return {
          subjectName,
          answeredCount,
          totalCount: subjectQuestions.length,
        };
      },
    );
  }, [isQuestionAnswered, questions]);

  const handleOpenSubmitConfirm = () => {
    setShowSubmitConfirm(true);
  };

  const indexToOptionLetter = (index: number): OptionLetter | null => {
    const option = ["A", "B", "C", "D"][index];
    return (option as OptionLetter) || null;
  };

  const buildSubmitAnswers = useCallback((): StudentAnswer[] => {
    const answers: StudentAnswer[] = [];

    questions.forEach((question) => {
      const value = selectedAnswers[question.id];

      if (question.category === "multi") {
        if (Array.isArray(value) && value.length > 0) {
          const selectedOptions = value
            .map(indexToOptionLetter)
            .filter((item): item is OptionLetter => Boolean(item));

          if (selectedOptions.length === 0) {
            return;
          }

          answers.push({
            questionId: question.id,
            answerType: "multiple",
            selectedOptions,
          });
        }
        return;
      }

      if (question.category === "numeric") {
        if (typeof value === "string" && value.trim().length > 0) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            answers.push({
              questionId: question.id,
              answerType: "numerical",
              numericalAnswer: parsed,
            });
          }
        }
        return;
      }

      // single/assertion_reason/comprehension map to single answerType.
      if (typeof value === "number") {
        const selectedOption = indexToOptionLetter(value);
        if (!selectedOption) {
          return;
        }

        answers.push({
          questionId: question.id,
          answerType: "single",
          selectedOption,
        });
      }
    });

    return answers;
  }, [questions, selectedAnswers]);

  const fetchLatestResults = useCallback(async () => {
    if (!token || !testItemNumericId || Number.isNaN(testItemNumericId)) {
      return null;
    }

    const latestResponse = await fetch(
      `${BASE_URL}/_api/student/test-attempts/latest-results?testItemId=${testItemNumericId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!latestResponse.ok) {
      return null;
    }

    const latestData = await latestResponse.json();
    return (latestData.json || latestData) as
      | LatestAttemptResultsPayload
      | LatestAttemptResultsResponse;
  }, [testItemNumericId, token]);

  const handleSubmitTest = useCallback(async () => {
    if (!token) {
      Alert.alert("Error", "Please login again.");
      return;
    }

    if (!attemptNumericId || Number.isNaN(attemptNumericId)) {
      Alert.alert("Error", "Invalid attempt id.");
      return;
    }

    const answers = buildSubmitAnswers();

    if (answers.length === 0) {
      Alert.alert(
        "No Answers",
        "Please answer at least one question before submitting.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload: SubmitAttemptRequest = {
        attemptId: attemptNumericId,
        answers,
      };

      const submitResponse = await fetch(
        `${BASE_URL}/_api/student/test-item/submit-attempt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: payload }),
        },
      );

      if (!submitResponse.ok) {
        let message = `Failed to submit attempt (HTTP ${submitResponse.status})`;

        try {
          const errorData = await submitResponse.json();
          const backendMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.json?.message ||
            errorData?.json?.error;

          message = backendMessage || message;

          console.log("[TestAttempt] Submit payload failed:", payload);
          console.log("[TestAttempt] Submit error response:", errorData);
        } catch {
          // Some APIs return plain text on error.
          try {
            const errorText = await submitResponse.text();
            if (errorText) {
              message = `${message}: ${errorText}`;
              console.log("[TestAttempt] Submit payload failed:", payload);
              console.log("[TestAttempt] Submit error text:", errorText);
            }
          } catch {
            // Keep default message.
          }
        }

        throw new Error(message);
      }

      const submitData = await submitResponse.json();
      const submitResult = (submitData.json ||
        submitData) as SubmitAttemptResponse;

      const latest = await fetchLatestResults();

      console.log("[TestAttempt] Submit payload:", payload);
      console.log("[TestAttempt] Submit result:", submitResult);
      console.log("[TestAttempt] Latest results:", latest);

      setShowSubmitConfirm(false);
      router.replace(
        `/(user)/portal/test/results?testItemId=${testItemNumericId}` as any,
      );
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to submit test.");
    } finally {
      setSubmitting(false);
    }
  }, [
    attemptNumericId,
    buildSubmitAnswers,
    fetchLatestResults,
    router,
    testItemNumericId,
    token,
  ]);

  const handleQuestionJump = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleNextFromFooter = () => {
    const isLastQuestionInCurrentView =
      currentQuestionIndex >= displayedQuestions.length - 1;

    if (!isLastQuestionInCurrentView) {
      setCurrentQuestionIndex((prev) =>
        Math.min(displayedQuestions.length - 1, prev + 1),
      );
      return;
    }

    if (!selectedSubject) {
      handleOpenSubmitConfirm();
      return;
    }

    const currentSubjectIndex = uniqueSubjects.findIndex(
      (subject) => subject === selectedSubject,
    );
    const nextSubject =
      currentSubjectIndex >= 0
        ? uniqueSubjects[currentSubjectIndex + 1]
        : undefined;

    if (nextSubject) {
      setSelectedSubject(nextSubject);
      setCurrentQuestionIndex(0);
      return;
    }

    // No next subject exists, so switch back to all questions.
    setSelectedSubject(null);
    setCurrentQuestionIndex(0);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 px-6 items-center justify-center">
        <Text className="text-slate-700 dark:text-slate-200 text-lg font-bold text-center">
          No questions found for this test.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-5 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-black">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const selectedOptionIndex = getSingleSelectedIndex(currentQuestion.id);
  const selectedMultiIndexes = getMultiSelectedIndexes(currentQuestion.id);
  const numericAnswer = getNumericAnswer(currentQuestion.id);
  const isDark = colorScheme === "dark";

  const renderHtmlOrText = (
    value: string | null | undefined,
    className: string,
  ) => {
    if (!value) return null;

    if (hasHtmlTags(value) && shouldUseWebView(value)) {
      return <HtmlContent html={value} isDark={isDark} />;
    }

    const displayValue = hasHtmlTags(value) ? htmlToPlainText(value) : value;
    return <Text className={className}>{displayValue}</Text>;
  };

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
        <View className="pt-4">
          <View className="px-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <View
              className="flex-row items-center justify-between mb-2"
              style={{ gap: 12 }}
            >
              <View className="h-12 flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 border border-slate-200 dark:border-slate-700">
                <Feather
                  name="clock"
                  size={18}
                  color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
                />
                <Text className="ml-2 text-slate-900 dark:text-white text-2xl font-black tracking-wider">
                  {timerLabel}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleOpenSubmitConfirm}
                disabled={submitting}
                className="h-12 bg-red-500 rounded-xl items-center justify-center px-5"
              >
                <Text className="text-white text-base font-black">
                  {submitting ? "Submitting..." : "Submit Test"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-3 h-1 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{
                  width: `${((currentQuestionIndex + 1) / displayedQuestions.length) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* Subject Selector */}
          {uniqueSubjects.length > 1 && (
            <View className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-800">
              <TouchableOpacity
                onPress={() => setIsSubjectFilterCollapsed((prev) => !prev)}
                className="flex-row items-center justify-between"
              >
                <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase">
                  Filter by Subject
                </Text>
                <Feather
                  name={
                    isSubjectFilterCollapsed ? "chevron-down" : "chevron-up"
                  }
                  size={18}
                  color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                />
              </TouchableOpacity>

              {!isSubjectFilterCollapsed ? (
                <View className="mt-3">
                  <FlatList
                    horizontal
                    scrollEnabled
                    data={[
                      { name: "All" },
                      ...uniqueSubjects.map((s) => ({ name: s })),
                    ]}
                    keyExtractor={(item) => item.name}
                    showsHorizontalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View className="w-2" />}
                    renderItem={({ item }) => {
                      const isSelected =
                        selectedSubject === item.name ||
                        (item.name === "All" && selectedSubject === null);

                      return (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedSubject(
                              item.name === "All" ? null : item.name,
                            );
                            setCurrentQuestionIndex(0);
                          }}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          <Text
                            className={`font-semibold text-sm ${
                              isSelected
                                ? "text-white"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              ) : null}
            </View>
          )}

          {/* Question Navigator */}
          <View className="px-6 pt-5 pb-4">
            <TouchableOpacity
              onPress={() => setIsQuestionNavigatorCollapsed((prev) => !prev)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase">
                Question Navigator
              </Text>
              <Feather
                name={
                  isQuestionNavigatorCollapsed ? "chevron-down" : "chevron-up"
                }
                size={18}
                color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>

            {!isQuestionNavigatorCollapsed ? (
              <View className="mt-3">
                <FlatList
                  horizontal
                  scrollEnabled
                  data={displayedQuestions}
                  keyExtractor={(item) => String(item.id)}
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View className="w-2" />}
                  renderItem={({ index, item }) => {
                    const isCurrent = index === currentQuestionIndex;
                    const isAnswered = isQuestionAnswered(item);

                    return (
                      <TouchableOpacity
                        onPress={() => handleQuestionJump(index)}
                        className={`w-12 h-12 rounded-xl border items-center justify-center ${
                          isCurrent
                            ? "border-primary bg-orange-50 dark:bg-orange-900/20"
                            : isAnswered
                              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                        }`}
                      >
                        <Text
                          className={`font-black text-base ${
                            isCurrent
                              ? "text-primary"
                              : isAnswered
                                ? "text-green-700 dark:text-green-300"
                                : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {index + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            ) : null}
          </View>

          <View className="px-6 pt-6 pb-4">
            <View className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm mb-6">
              <View
                className="flex-row items-center justify-between mb-3"
                style={{ gap: 12 }}
              >
                <View className="flex-row items-center">
                  <Text className="text-primary text-sm font-black tracking-wider">
                    QUESTION
                  </Text>
                  <Text className="text-primary text-sm font-black tracking-wider ml-1">
                    {currentQuestionIndex + 1}
                  </Text>
                </View>
                <Text
                  className="text-slate-500 dark:text-slate-400 text-xs font-semibold"
                  numberOfLines={1}
                >
                  {currentQuestionIndex + 1}/{displayedQuestions.length}
                </Text>
              </View>
              {currentQuestion.paragraphText
                ? renderHtmlOrText(
                    currentQuestion.paragraphText,
                    "text-slate-700 dark:text-slate-200 text-base font-semibold mb-4",
                  )
                : null}

              {renderHtmlOrText(
                currentQuestion.questionText,
                "text-slate-800 dark:text-white text-2xl font-black leading-9",
              )}

              {currentQuestion.subjectName && (
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-4">
                  Subject: {currentQuestion.subjectName}
                </Text>
              )}
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-2 uppercase tracking-wider">
                Type: {currentQuestion.questionType || "unknown"}
              </Text>
            </View>

            <View className="mb-6">
              {currentQuestion.category === "numeric" ? (
                <>
                  <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase mb-3">
                    Enter Answer
                  </Text>
                  <TextInput
                    value={numericAnswer}
                    onChangeText={(value) =>
                      handleNumericAnswerChange(currentQuestion.id, value)
                    }
                    placeholder="Type numeric answer"
                    keyboardType="decimal-pad"
                    className="rounded-2xl border px-4 py-4 text-base font-semibold bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                  />
                </>
              ) : (
                <>
                  <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase mb-3">
                    {currentQuestion.category === "multi"
                      ? "Select One or More Options"
                      : "Select One Option"}
                  </Text>
                  {currentQuestion.options?.map((option, optionIndex) => {
                    const isSelected =
                      currentQuestion.category === "multi"
                        ? selectedMultiIndexes.includes(optionIndex)
                        : selectedOptionIndex === optionIndex;
                    const useCircularIndicator =
                      currentQuestion.category !== "multi";

                    return (
                      <TouchableOpacity
                        key={`${currentQuestion.id}-${optionIndex}`}
                        onPress={() =>
                          currentQuestion.category === "multi"
                            ? handleToggleMultiOption(
                                currentQuestion.id,
                                optionIndex,
                              )
                            : handleSelectSingleOption(
                                currentQuestion.id,
                                optionIndex,
                              )
                        }
                        className={`rounded-2xl border px-4 py-4 mb-3 flex-row items-center ${
                          isSelected
                            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
                            : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        <View
                          className={`w-6 h-6 border mr-3 items-center justify-center ${
                            useCircularIndicator ? "rounded-full" : "rounded-md"
                          } ${
                            isSelected
                              ? "border-primary"
                              : "border-gray-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected ? (
                            <View
                              className={`w-3 h-3 bg-primary ${
                                useCircularIndicator
                                  ? "rounded-full"
                                  : "rounded-sm"
                              }`}
                            />
                          ) : null}
                        </View>

                        <View className="flex-1 flex-row items-start">
                          <Text
                            className={`text-base leading-6 font-black mr-2 ${
                              isSelected
                                ? "text-primary"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}.
                          </Text>
                          <View className="flex-1">
                            {renderHtmlOrText(
                              option,
                              `text-base font-semibold ${
                                isSelected
                                  ? "text-primary"
                                  : "text-slate-700 dark:text-slate-200"
                              }`,
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>

            <View className="mt-8 flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-3 rounded-xl border ${
                  currentQuestionIndex === 0
                    ? "border-gray-100 dark:border-slate-700"
                    : "border-gray-200 dark:border-slate-600"
                }`}
              >
                <Text
                  className={`font-bold text-base ${
                    currentQuestionIndex === 0
                      ? "text-slate-400 dark:text-slate-600"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              {currentQuestionIndex < displayedQuestions.length - 1 ||
              selectedSubject ? (
                <TouchableOpacity
                  onPress={handleNextFromFooter}
                  className="bg-primary px-8 py-3 rounded-xl"
                >
                  <Text className="text-white font-black text-base">Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleOpenSubmitConfirm}
                  disabled={submitting}
                  className="bg-green-600 px-8 py-3 rounded-xl"
                >
                  <Text className="text-white font-black text-base">
                    {submitting ? "Submitting..." : "Submit Test"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold mb-2">
                Started at: {startedAtDisplay}
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
                Calculator: {calculatorEnabled ? "Enabled" : "Disabled"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={showSubmitConfirm}
        onRequestClose={() => {
          if (!submitting) {
            setShowSubmitConfirm(false);
          }
        }}
      >
        <View className="flex-1 bg-black/40 px-5 items-center justify-center">
          <View className="w-full max-w-[430px] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-gray-200 dark:border-slate-700">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-slate-900 dark:text-white text-3xl font-black">
                Confirm Submission
              </Text>
              <TouchableOpacity
                onPress={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center"
              >
                <Feather
                  name="x"
                  size={20}
                  color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
                />
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 dark:text-slate-400 text-lg font-semibold mb-4">
              Are you sure you want to submit your test?
            </Text>

            <View className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 mb-3 flex-row items-center justify-between">
              <Text className="text-slate-800 dark:text-slate-100 font-black text-lg">
                Overall Progress
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 font-black text-xl">
                {overallAnsweredCount} / {questions.length} answered
              </Text>
            </View>

            <View className="mb-5" style={{ gap: 8 }}>
              {subjectProgressRows.map((row) => (
                <View
                  key={row.subjectName}
                  className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 flex-row items-center justify-between"
                >
                  <Text
                    className="text-slate-800 dark:text-slate-100 font-black text-lg flex-1 pr-3"
                    numberOfLines={1}
                  >
                    {row.subjectName}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-300 font-black text-2xl">
                    {row.answeredCount}/{row.totalCount}
                  </Text>
                </View>
              ))}
            </View>

            <View
              className="flex-row items-center justify-end"
              style={{ gap: 12 }}
            >
              <TouchableOpacity
                onPress={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="px-4 py-3 rounded-xl"
              >
                <Text className="text-slate-700 dark:text-slate-300 text-2xl font-semibold">
                  Go Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitTest}
                disabled={submitting}
                className="bg-red-500 px-5 py-3 rounded-2xl"
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-2xl font-black">
                    Submit Test
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TestAttemptScreen;
