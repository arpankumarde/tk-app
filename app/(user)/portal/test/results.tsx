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
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { WebView } from "react-native-webview";
import { useAuth } from "@/context/AuthContext";
import {
  EnrolledTest,
  LatestAttemptResultItem,
  LatestAttemptResultsPayload,
  OptionLetter,
} from "../../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

type EnrolledTestsApiPayload = {
  enrolledTests?: EnrolledTest[];
  tests?: EnrolledTest[];
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
            font-size: 14px;
            line-height: 1.45;
            overflow-x: hidden;
          }
          * { max-width: 100%; box-sizing: border-box; }
          p { margin: 0 0 8px 0; color: ${textColor}; }
          img {
            display: block;
            max-width: 100%;
            width: 100%;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            margin: 4px 0;
          }
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
  const [contentHeight, setContentHeight] = useState(24);

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
          setContentHeight(Math.max(24, nextHeight + 4));
        }
      }}
    />
  );
};

const ResultsScreen = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();
  const { testItemId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] =
    useState<LatestAttemptResultsPayload | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<
    Record<number, boolean>
  >({});

  const testItemNumericId = useMemo(() => {
    const raw = Array.isArray(testItemId) ? testItemId[0] : testItemId;
    return Number(raw);
  }, [testItemId]);

  const isDark = colorScheme === "dark";

  const formatOptionList = (options?: string[] | null) => {
    if (!options || options.length === 0) return "-";
    return options.join(", ");
  };

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const normalizePayload = (raw: any): LatestAttemptResultsPayload => {
    if (raw?.attemptId && Array.isArray(raw?.results)) {
      return raw as LatestAttemptResultsPayload;
    }

    // Fallback for older shape where attempt metadata is nested.
    return {
      attemptId: raw?.attempt?.id || 0,
      completedAt: raw?.attempt?.completedAt,
      score: raw?.attempt?.score || 0,
      totalMarks: raw?.attempt?.totalMarks || 0,
      maxPossibleMarks: raw?.attempt?.maxPossibleMarks || 0,
      correctAnswers: 0,
      results: raw?.results || [],
    };
  };

  const fetchLatestResults = useCallback(async () => {
    if (!token || !testItemNumericId || Number.isNaN(testItemNumericId)) {
      setLoading(false);
      setError("Invalid test item.");
      return;
    }

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
      const payload = normalizePayload(data.json || data);

      setResultData(payload);
    } catch (err: any) {
      setError(err.message || "Unable to load test results.");
    } finally {
      setLoading(false);
    }
  }, [testItemNumericId, token]);

  useEffect(() => {
    fetchLatestResults();
  }, [fetchLatestResults]);

  const handleBackToEnrolledTest = useCallback(async () => {
    if (!token || !testItemNumericId || Number.isNaN(testItemNumericId)) {
      router.replace("/(user)" as any);
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/_api/student/enrolled-tests?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        const payload = (data.json || data) as EnrolledTestsApiPayload;
        const enrolledTests = payload.enrolledTests || payload.tests || [];

        const matchedTestPack = enrolledTests.find((testPack) =>
          (testPack.testItems || []).some(
            (item) => item.id === testItemNumericId,
          ),
        );

        if (matchedTestPack?.slug) {
          router.replace(
            `/(user)/enrolled-test/${matchedTestPack.slug}` as any,
          );
          return;
        }
      }
    } catch {
      // Fallback navigation below.
    }

    router.replace("/(user)" as any);
  }, [router, testItemNumericId, token]);

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

  const toggleExplanation = (questionId: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const scoreProgress = useMemo(() => {
    if (!resultData || !resultData.maxPossibleMarks) return 0;
    const raw = (resultData.totalMarks / resultData.maxPossibleMarks) * 100;
    return Math.max(0, Math.min(100, raw));
  }, [resultData]);

  const correctCount = useMemo(() => {
    if (!resultData) return 0;
    return (
      resultData.correctAnswers ??
      resultData.results.filter((item) => item.isCorrect).length
    );
  }, [resultData]);

  const incorrectCount = useMemo(() => {
    if (!resultData) return 0;
    return Math.max(0, resultData.results.length - correctCount);
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
          onPress={handleBackToEnrolledTest}
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
      className="flex-1 bg-slate-50 dark:bg-slate-950"
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
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={handleBackToEnrolledTest}
              className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 items-center justify-center"
            >
              <Feather
                name="arrow-left"
                size={20}
                color={colorScheme === "dark" ? "#e2e8f0" : "#1e293b"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={fetchLatestResults}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl"
            >
              <Text className="text-slate-700 dark:text-slate-200 font-bold text-base">
                Refresh
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-slate-900 dark:text-white text-2xl font-black leading-tight">
            Test Results
          </Text>

          <View className="mt-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm mb-3">
            <Text className="text-slate-600 dark:text-slate-300 font-black text-base mb-1">
              Your Score
            </Text>
            <Text className="text-primary text-5xl font-black tracking-tight">
              {Number(resultData.score).toFixed(2)}%
            </Text>
            <Text className="text-slate-800 dark:text-slate-100 text-2xl font-black mt-1">
              {Number(resultData.totalMarks).toFixed(2)} /{" "}
              {resultData.maxPossibleMarks} marks
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 font-semibold text-lg mt-1">
              {correctCount} /{" "}
              {resultData.results.length || resultData.totalQuestions || 0}{" "}
              correct
            </Text>

            <View className="mt-3 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{ width: `${scoreProgress}%` }}
              />
            </View>
          </View>

          <View className="mb-4" style={{ gap: 8 }}>
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

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="clock" size={18} color="#0284c7" />
                  <Text className="ml-2 text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                    Time
                  </Text>
                </View>
                <Text className="text-slate-900 dark:text-white text-3xl font-black">
                  {formatDuration(resultData.timeTaken)}
                </Text>
              </View>

              <View className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3">
                <View className="flex-row items-center mb-1">
                  <Feather name="award" size={18} color="#fb923c" />
                  <Text className="ml-2 text-slate-500 dark:text-slate-400 font-black text-xs uppercase">
                    Marks
                  </Text>
                </View>
                <Text className="text-slate-900 dark:text-white text-3xl font-black">
                  {resultData.totalMarks}/{resultData.maxPossibleMarks}
                </Text>
              </View>
            </View>
          </View>

          <View>
            <Text className="text-slate-900 dark:text-white font-black text-2xl mb-2">
              Question Review
            </Text>

            {resultData.results.map((item: LatestAttemptResultItem, index) => {
              const answerText =
                item.selectedOption ||
                (item.selectedOptions
                  ? formatOptionList(item.selectedOptions)
                  : null) ||
                (item.studentNumericalAnswer !== null &&
                item.studentNumericalAnswer !== undefined
                  ? String(item.studentNumericalAnswer)
                  : "-");

              const correctText =
                item.correctOption ||
                (item.correctOptions
                  ? formatOptionList(item.correctOptions)
                  : null) ||
                (item.correctNumericalAnswer !== null &&
                item.correctNumericalAnswer !== undefined
                  ? String(item.correctNumericalAnswer)
                  : "-");

              const isCorrect = Boolean(item.isCorrect);
              const selectedLetters = item.selectedOptions
                ? item.selectedOptions
                : item.selectedOption
                  ? [item.selectedOption]
                  : [];
              const correctLetters = item.correctOptions
                ? item.correctOptions
                : item.correctOption
                  ? [item.correctOption]
                  : [];
              const optionMap = [
                { letter: "A" as OptionLetter, value: item.optionA },
                { letter: "B" as OptionLetter, value: item.optionB },
                { letter: "C" as OptionLetter, value: item.optionC },
                { letter: "D" as OptionLetter, value: item.optionD },
              ].filter((entry) => Boolean(entry.value));

              return (
                <View
                  key={`${item.questionId}-${index}`}
                  className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-3 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-primary font-black text-2xl">
                      {index + 1}.
                    </Text>
                    <Text
                      className={`font-black text-sm ${isCorrect ? "text-green-600" : "text-red-500"}`}
                    >
                      {isCorrect
                        ? `+${item.marksObtained ?? 0} marks`
                        : `${item.marksObtained ?? 0} marks`}
                    </Text>
                  </View>

                  {item.paragraphText
                    ? renderHtmlOrText(
                        item.paragraphText,
                        "text-slate-700 dark:text-slate-200 text-sm font-semibold mb-2",
                      )
                    : null}

                  {renderHtmlOrText(
                    item.questionText,
                    "text-slate-800 dark:text-white text-lg font-bold",
                  )}

                  {optionMap.length > 0 ? (
                    <View className="mt-2" style={{ gap: 8 }}>
                      {optionMap.map((option) => {
                        const isSelectedOption = selectedLetters.includes(
                          option.letter,
                        );
                        const isCorrectOption = correctLetters.includes(
                          option.letter,
                        );

                        const optionClass = isCorrectOption
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                          : isSelectedOption
                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                            : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700";

                        const letterClass = isCorrectOption
                          ? "text-green-700 dark:text-green-300"
                          : isSelectedOption
                            ? "text-red-700 dark:text-red-300"
                            : "text-slate-700 dark:text-slate-200";

                        return (
                          <View
                            key={`${item.questionId}-${option.letter}`}
                            className={`rounded-xl border px-3 py-2.5 ${optionClass}`}
                          >
                            <View className="flex-row items-start">
                              <Text
                                className={`font-black text-2xl mr-3 ${letterClass}`}
                              >
                                {option.letter}:
                              </Text>
                              <View className="flex-1">
                                {renderHtmlOrText(
                                  option.value,
                                  `text-base font-semibold ${letterClass}`,
                                )}
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

                  <View className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase mb-1">
                      Your Answer
                    </Text>
                    <Text className="text-slate-900 dark:text-slate-100 text-lg font-black">
                      {answerText}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase mb-1 mt-2">
                      Correct Answer
                    </Text>
                    <Text className="text-green-700 dark:text-green-300 text-lg font-black">
                      {correctText}
                    </Text>
                  </View>

                  {item.explanation ? (
                    <View className="mt-3">
                      <TouchableOpacity
                        onPress={() => toggleExplanation(item.questionId)}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 flex-row items-center justify-between"
                      >
                        <Text className="text-slate-700 dark:text-slate-200 font-black text-sm">
                          {expandedExplanations[item.questionId]
                            ? "Hide Explanation"
                            : "Show Explanation"}
                        </Text>
                        <Feather
                          name={
                            expandedExplanations[item.questionId]
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={16}
                          color={isDark ? "#e2e8f0" : "#334155"}
                        />
                      </TouchableOpacity>

                      {expandedExplanations[item.questionId] ? (
                        <View className="mt-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-700 px-3 py-3">
                          <Text className="text-cyan-700 dark:text-cyan-300 text-xs font-black uppercase mb-1">
                            Explanation
                          </Text>
                          {renderHtmlOrText(
                            item.explanation,
                            "text-slate-700 dark:text-slate-200 text-sm font-semibold",
                          )}
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResultsScreen;
