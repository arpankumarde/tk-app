import ScientificCalculator from "@/components/ScientificCalculator";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
  LatestAttemptResultsPayload,
  LatestAttemptResultsResponse,
  OptionLetter,
  Question,
  StudentAnswer,
  SubmitAttemptRequest,
  SubmitAttemptResponse,
} from "../../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const DEFAULT_DURATION_MINUTES = 30;
// Hard cap for tests with no time limit — auto-submit after 3 hours.
const NO_LIMIT_AUTO_SUBMIT_SECONDS = 3 * 60 * 60;

type QuestionsApiPayload = {
  questions: Question[];
  calculatorEnabled: boolean;
  subjectWiseTiming: boolean;
  questionWiseTiming: boolean;
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
  subjectId: number;
  sectionId: number | null;
  subjectOrderIndex: number;
  subjectDurationMinutes: number;
  sectionName: string | null;
  sectionOrderIndex: number | null;
  sectionMaxAttemptsAllowed: number | null;
};

interface SectionData {
  sectionName: string | null;
  sectionId: number | null;
  orderIndex: number;
  questions: NormalizedQuestion[];
  maxAttemptsAllowed?: number | null;
}

interface SubjectData {
  subjectName: string;
  subjectId: number;
  orderIndex: number;
  durationMinutes: number;
  sections: SectionData[];
}

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

// Height measurement is done via onLoadEnd + injectJavaScript (see HtmlContent).
// KaTeX is loaded from CDN to render data-type="mathematics" spans.
const getHtmlDocument = (html: string, isDark: boolean) => {
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#475569";
  const cleanedHtml = sanitizeHtml(html);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css" crossorigin="anonymous" />
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: transparent;
        color: ${textColor};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        line-height: 1.6;
      }
      p { margin-bottom: 8px; color: ${textColor}; }
      ol, ul { padding-left: 20px; margin-bottom: 8px; }
      li { margin-bottom: 4px; color: ${textColor}; }
      img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
      span, strong, em, b { color: ${textColor}; font-weight: normal; }
      .muted { color: ${mutedColor}; }
      table { width: 100%; border-collapse: collapse; }
      td, th { border: 1px solid #475569; padding: 6px; color: ${textColor}; }
      .katex { color: ${textColor}; }
    </style>
  </head>
  <body>${cleanedHtml}
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.js" crossorigin="anonymous"></script>
    <script>
      document.querySelectorAll('span[data-type="mathematics"]').forEach(function(el) {
        var math = el.getAttribute('data-math');
        if (math) {
          try {
            katex.render(math, el, { throwOnError: false, displayMode: false });
          } catch(e) {}
        }
      });
    </script>
  </body>
</html>`;
};

// Script injected via onLoadEnd — runs exactly once after full page load.
// Using body.scrollHeight ONLY (never html.* properties which equal viewport size).
const MEASURE_SCRIPT = `
(function() {
  var h = document.body.scrollHeight;
  if (h > 0) { window.ReactNativeWebView.postMessage(String(h)); }
})(); true;`;

const HtmlContent = ({ html, isDark }: { html: string; isDark: boolean }) => {
  const [contentHeight, setContentHeight] = useState(40);
  const webViewRef = useRef<any>(null);
  // Ref-based lock: synchronous mutation, never stale in closures.
  const lockedRef = useRef(false);

  useEffect(() => {
    setContentHeight(40);
    lockedRef.current = false;
  }, [html]);

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html: getHtmlDocument(html, isDark) }}
      style={{ height: contentHeight, backgroundColor: "transparent" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      // onLoadEnd fires once when the page (including images) finishes loading.
      // We then inject the measurement script programmatically — exactly one call.
      onLoadEnd={() => {
        webViewRef.current?.injectJavaScript(MEASURE_SCRIPT);
      }}
      onMessage={(event) => {
        if (lockedRef.current) return;
        const reported = Number(event.nativeEvent.data);
        if (!Number.isNaN(reported) && reported > 0) {
          setContentHeight(reported + 4);
          lockedRef.current = true;
        }
      }}
    />
  );
};

const TestAttemptScreen = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();
  const { attemptId, testItemId, startedAt, durationMinutes, mode } =
    useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [subjectWiseTiming, setSubjectWiseTiming] = useState(false);
  const [questionWiseTiming, setQuestionWiseTiming] = useState(false);
  const [isNoLimit, setIsNoLimit] = useState(false);
  const [testDurationMinutes, setTestDurationMinutes] = useState(() => {
    const raw = Array.isArray(durationMinutes)
      ? durationMinutes[0]
      : durationMinutes;
    const parsed = Number(raw);
    return parsed > 0 ? parsed : DEFAULT_DURATION_MINUTES;
  });
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedSubjectIds, setCompletedSubjectIds] = useState<number[]>([]);

  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, SelectedAnswer>
  >({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubjectFilterCollapsed, setIsSubjectFilterCollapsed] =
    useState(false);
  const [isQuestionNavigatorCollapsed, setIsQuestionNavigatorCollapsed] =
    useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [questionRemainingSeconds, setQuestionRemainingSeconds] = useState(0);
  const [isCalculatorVisible, setIsCalculatorVisible] = useState(false);
  const lastTimedSubjectIndex = useRef<number | null>(null);
  // Tracks question IDs already locked-in in QWT mode (once answered, answer is locked)
  const [lockedAnswers, setLockedAnswers] = useState<Set<number>>(new Set());

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

  // Fallback for attempts the API did not stamp with a start time: the attempt
  // effectively began when this screen opened.
  const [portalOpenedAt] = useState(() => Date.now());

  const attemptStartTime = useMemo(() => {
    if (!startedAtRaw) {
      return portalOpenedAt;
    }

    const parsed = new Date(startedAtRaw).getTime();
    return Number.isNaN(parsed) ? portalOpenedAt : parsed;
  }, [startedAtRaw, portalOpenedAt]);

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
          subjectId: q.subjectId,
          sectionId: q.sectionId,
          subjectOrderIndex: q.subjectOrderIndex ?? 0,
          subjectDurationMinutes: q.subjectDurationMinutes ?? 0,
          sectionName: q.sectionName,
          sectionOrderIndex: q.sectionOrderIndex ?? 0,
          sectionMaxAttemptsAllowed: q.sectionMaxAttemptsAllowed,
        };
      });

      // Group into subjects and sections
      const subjectMap = new Map<number, SubjectData>();

      transformedQuestions.forEach((q) => {
        if (!subjectMap.has(q.subjectId)) {
          subjectMap.set(q.subjectId, {
            subjectName: q.subjectName || "General",
            subjectId: q.subjectId,
            orderIndex: q.subjectOrderIndex,
            durationMinutes: q.subjectDurationMinutes,
            sections: [],
          });
        }

        const subject = subjectMap.get(q.subjectId)!;
        let section = subject.sections.find((s) => s.sectionId === q.sectionId);

        if (!section) {
          section = {
            sectionName: q.sectionName,
            sectionId: q.sectionId,
            orderIndex: q.sectionOrderIndex || 0,
            questions: [],
            maxAttemptsAllowed: q.sectionMaxAttemptsAllowed,
          };
          subject.sections.push(section);
        }

        section.questions.push(q);
      });

      // Sort subjects and sections by order index
      const sortedSubjects = Array.from(subjectMap.values()).sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );

      sortedSubjects.forEach((s) => {
        s.sections.sort((a, b) => a.orderIndex - b.orderIndex);
      });

      setSubjects(sortedSubjects);
      setSubjectWiseTiming(Boolean(payload.subjectWiseTiming));
      setQuestionWiseTiming(Boolean(payload.questionWiseTiming));

      // Calculate total duration if not explicitly provided.
      // The initial state already reflects the route-param duration (or DEFAULT
      // if none was passed). Only override when this response gives us a better
      // value — never fall back to DEFAULT here, that would clobber the param.
      const apiDuration = (payload as any).testDurationMinutes;
      const totalSubjectDuration = sortedSubjects.reduce(
        (sum, s) => sum + (s.durationMinutes || 0),
        0,
      );
      const rawDurationParam = Array.isArray(durationMinutes)
        ? durationMinutes[0]
        : durationMinutes;
      const routeDuration = Number(rawDurationParam);

      if (apiDuration) {
        setTestDurationMinutes(apiDuration);
      } else if (totalSubjectDuration > 0) {
        setTestDurationMinutes(totalSubjectDuration);
      }

      // No-limit mode: not subject/question-wise, no API duration, no subject
      // duration, and the route param is 0/missing. Timer counts up; auto-
      // submits at NO_LIMIT_AUTO_SUBMIT_SECONDS.
      const noLimit =
        !payload.subjectWiseTiming &&
        !payload.questionWiseTiming &&
        !apiDuration &&
        totalSubjectDuration <= 0 &&
        !(routeDuration > 0);
      setIsNoLimit(noLimit);

      setCalculatorEnabled(Boolean(payload.calculatorEnabled));
      setCurrentSubjectIndex(0);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setLockedAnswers(new Set());
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to load test questions.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [router, testItemNumericId, token, durationMinutes]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (subjects.length === 0) return;

    if (!subjectWiseTiming) {
      if (lastTimedSubjectIndex.current === null) {
        const totalElapsed = Math.floor((Date.now() - attemptStartTime) / 1000);
        if (isNoLimit) {
          // Count up: seed with elapsed time so resumed attempts continue.
          setRemainingSeconds(
            Math.min(Math.max(0, totalElapsed), NO_LIMIT_AUTO_SUBMIT_SECONDS),
          );
        } else {
          const initialRemaining = testDurationMinutes * 60 - totalElapsed;
          setRemainingSeconds(Math.max(0, initialRemaining));
        }
        lastTimedSubjectIndex.current = -1;
      }
    } else {
      if (lastTimedSubjectIndex.current !== currentSubjectIndex) {
        const currentSubjectDuration =
          (subjects[currentSubjectIndex]?.durationMinutes || 0) * 60;
        setRemainingSeconds(currentSubjectDuration);
        lastTimedSubjectIndex.current = currentSubjectIndex;
      }
    }
  }, [
    subjects,
    subjectWiseTiming,
    currentSubjectIndex,
    attemptStartTime,
    testDurationMinutes,
    isNoLimit,
  ]);

  const timerLabel = useMemo(() => {
    if (isNoLimit && remainingSeconds >= 3600) {
      const hours = Math.floor(remainingSeconds / 3600).toString();
      const minutes = Math.floor((remainingSeconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    }
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [remainingSeconds, isNoLimit]);

  const questionTimerLabel = useMemo(() => {
    const minutes = Math.floor(questionRemainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (questionRemainingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [questionRemainingSeconds]);

  const uniqueSubjects = useMemo(() => {
    return subjects.map((s) => s.subjectName);
  }, [subjects]);

  const currentSubject = subjects[currentSubjectIndex] || null;
  const currentSection = currentSubject?.sections[currentSectionIndex] || null;
  const currentQuestion =
    currentSection?.questions[currentQuestionIndex] || null;

  const allSubjectQuestions = useMemo(() => {
    if (!currentSubject) return [];
    return currentSubject.sections.flatMap((s) => s.questions);
  }, [currentSubject]);

  const currentGlobalIndex = useMemo(() => {
    if (!currentSubject) return 0;
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += currentSubject.sections[i].questions.length;
    }
    return count + currentQuestionIndex;
  }, [currentSubject, currentSectionIndex, currentQuestionIndex]);

  const navigatorData = useMemo(() => {
    if (!currentSubject) return [];
    const data: any[] = [];
    let qGlobalIndex = 0;
    currentSubject.sections.forEach((section, sIdx) => {
      if (section.sectionName) {
        data.push({
          type: "section",
          title: section.sectionName,
          isFirst: data.length === 0,
        });
      }
      section.questions.forEach((q, qIdx) => {
        data.push({
          type: "question",
          question: q,
          sIdx,
          qIdx,
          globalIndex: qGlobalIndex++,
        });
      });
    });
    return data;
  }, [currentSubject]);

  const isQuestionAnswered = useCallback(
    (question: NormalizedQuestion | null | undefined) => {
      if (!question) return false;
      const value = selectedAnswers[question.id];

      if (value === undefined || value === null) return false;

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

  const allQuestions = useMemo(() => {
    const qs: NormalizedQuestion[] = [];
    subjects.forEach((s) => {
      s.sections.forEach((sec) => {
        qs.push(...sec.questions);
      });
    });
    return qs;
  }, [subjects]);

  const sectionAttemptCounts = useMemo(() => {
    if (!currentSubject) return {};
    const counts: Record<number, number> = {};
    currentSubject.sections.forEach((section) => {
      const answeredCount = section.questions.filter((q) =>
        isQuestionAnswered(q),
      ).length;
      counts[section.sectionId || 0] = answeredCount;
    });
    return counts;
  }, [currentSubject, isQuestionAnswered]);

  const currentSectionAttemptCount =
    sectionAttemptCounts[currentSection?.sectionId || 0] || 0;
  const isSectionLimitReached =
    currentSection?.maxAttemptsAllowed != null &&
    currentSectionAttemptCount >= currentSection.maxAttemptsAllowed;

  const isCurrentQuestionAnswered = currentQuestion
    ? isQuestionAnswered(currentQuestion)
    : false;

  const showAttemptLimitWarning =
    currentQuestion && isSectionLimitReached && !isCurrentQuestionAnswered;

  const handleClearResponse = (questionId: number) => {
    // In question-wise timing mode, answers are locked once submitted
    if (questionWiseTiming && lockedAnswers.has(questionId)) return;
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleSelectSingleOption = (
    questionId: number,
    optionIndex: number,
  ) => {
    // In QWT mode, answer is locked after first selection
    if (questionWiseTiming && lockedAnswers.has(questionId)) return;
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

  const overallAnsweredCount = useMemo(() => {
    return allQuestions.filter((question) => isQuestionAnswered(question))
      .length;
  }, [isQuestionAnswered, allQuestions]);

  const subjectProgressRows = useMemo(() => {
    return subjects.map((subject) => {
      let answeredCount = 0;
      let totalCount = 0;

      subject.sections.forEach((section) => {
        totalCount += section.questions.length;
        answeredCount += section.questions.filter((q) =>
          isQuestionAnswered(q),
        ).length;
      });

      return {
        subjectName: subject.subjectName,
        answeredCount,
        totalCount,
      };
    });
  }, [isQuestionAnswered, subjects]);

  const currentSubjectProgress = useMemo(() => {
    if (!currentSubject) return { total: 0, answered: 0 };
    let total = 0;
    let answered = 0;
    currentSubject.sections.forEach((sec) => {
      total += sec.questions.length;
      answered += sec.questions.filter((q) => isQuestionAnswered(q)).length;
    });
    return { total, answered };
  }, [currentSubject, isQuestionAnswered]);

  const handleOpenSubmitConfirm = () => {
    setShowSubmitConfirm(true);
  };

  const indexToOptionLetter = (index: number): OptionLetter | null => {
    const option = ["A", "B", "C", "D"][index];
    return (option as OptionLetter) || null;
  };

  const buildSubmitAnswers = useCallback((): StudentAnswer[] => {
    const answers: StudentAnswer[] = [];

    allQuestions.forEach((question) => {
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
  }, [allQuestions, selectedAnswers]);

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

      // console.log("[TestAttempt] Submit payload:", payload);
      // console.log("[TestAttempt] Submit result:", submitResult);
      // console.log("[TestAttempt] Latest results:", latest);

      setShowSubmitConfirm(false);
      if (mode === "live") {
        router.replace({
          pathname: "/user/live-portal/results",
          params: {
            testItemId: String(testItemNumericId),
            submitResult: JSON.stringify(submitResult),
          },
        });
      } else {
        router.replace({
          pathname: "/user/portal/test/results",
          params: { testItemId: String(testItemNumericId) },
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to submit test.");
    } finally {
      setSubmitting(false);
    }
  }, [
    attemptNumericId,
    buildSubmitAnswers,
    fetchLatestResults,
    mode,
    router,
    testItemNumericId,
    token,
  ]);

  const handleSubmitSubject = useCallback(async () => {
    if (currentSubjectIndex < subjects.length - 1) {
      const nextIdx = currentSubjectIndex + 1;
      setCompletedSubjectIds((prev) => [
        ...prev,
        subjects[currentSubjectIndex].subjectId,
      ]);
      setCurrentSubjectIndex(nextIdx);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);

      // Reset timer for the next subject
      const nextSubjectDuration =
        (subjects[nextIdx]?.durationMinutes || 0) * 60;
      setRemainingSeconds(nextSubjectDuration);

      setShowSubmitConfirm(false);
    } else {
      await handleSubmitTest();
    }
  }, [currentSubjectIndex, subjects, handleSubmitTest]);

  useEffect(() => {
    if (subjects.length === 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (isNoLimit) {
          const next = prev + 1;
          if (next >= NO_LIMIT_AUTO_SUBMIT_SECONDS) {
            handleSubmitTest();
            return NO_LIMIT_AUTO_SUBMIT_SECONDS;
          }
          return next;
        }
        if (prev <= 1) {
          if (subjectWiseTiming) {
            handleSubmitSubject();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    subjects,
    subjectWiseTiming,
    handleSubmitSubject,
    isNoLimit,
    handleSubmitTest,
  ]);

  const handleQuestionJump = (sIdx: number, qIdx: number) => {
    // Jumping is disabled in question-wise timing mode
    if (questionWiseTiming) return;
    setCurrentSectionIndex(sIdx);
    setCurrentQuestionIndex(qIdx);
  };

  const handleNextFromFooter = () => {
    // 1. Next question in current section
    if (
      currentSection &&
      currentQuestionIndex < currentSection.questions.length - 1
    ) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // 2. Next section in current subject
    if (
      currentSubject &&
      currentSectionIndex < currentSubject.sections.length - 1
    ) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      return;
    }

    // 3. Next subject (only if NOT subject-wise timing)
    if (!subjectWiseTiming && currentSubjectIndex < subjects.length - 1) {
      if (questionWiseTiming) {
        setCompletedSubjectIds((prev) => [
          ...prev,
          subjects[currentSubjectIndex].subjectId,
        ]);
      }
      setCurrentSubjectIndex((prev) => prev + 1);
      setCurrentSectionIndex(0);
      setCurrentQuestionIndex(0);
      return;
    }

    // 4. End of test / End of subject
    handleOpenSubmitConfirm();
  };

  // Per-question countdown timer (only active in question-wise timing mode)
  useEffect(() => {
    if (!questionWiseTiming || !currentQuestion) return;
    const durationSecs = (currentQuestion as any).durationSeconds || 60;
    setQuestionRemainingSeconds(durationSecs);
  }, [questionWiseTiming, currentQuestion?.id]);

  // Log curret question details
  // useEffect(() => {
  //   if (!currentQuestion) return;
  //   console.log("[TestPortal] Question in view:");
  //   console.log("  id:", currentQuestion.id);
  //   console.log("  questionText:", currentQuestion.questionText);
  //   if (currentQuestion.paragraphText)
  //     console.log("  paragraphText:", currentQuestion.paragraphText);
  //   currentQuestion.options?.forEach((opt, i) =>
  //     console.log(`  option[${i}]:`, opt),
  //   );
  // }, [currentQuestion?.id]);

  useEffect(() => {
    if (!questionWiseTiming || questionRemainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setQuestionRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Time's up — auto advance to next question
          handleNextFromFooter();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questionWiseTiming, questionRemainingSeconds, handleNextFromFooter]);

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
    key?: string,
  ) => {
    if (!value) return null;

    if (hasHtmlTags(value) && shouldUseWebView(value)) {
      // key forces a remount on question change so contentHeight resets cleanly.
      return <HtmlContent key={key} html={value} isDark={isDark} />;
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
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="pt-4">
          <View className="px-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <View
              className="flex-row items-center justify-between mb-2"
              style={{ gap: 12 }}
            >
              <View className="h-12 flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 border border-slate-200 dark:border-slate-700 shrink-0">
                <Feather
                  name="clock"
                  size={18}
                  color={colorScheme === "dark" ? "#e2e8f0" : "#334155"}
                />
                <View className="ml-2 flex-row items-center">
                  {subjectWiseTiming && (
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase mr-1.5 mt-1">
                      Subject:
                    </Text>
                  )}
                  {questionWiseTiming && (
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase mr-1.5 mt-1">
                      Q:
                    </Text>
                  )}
                  <Text
                    className={`text-2xl font-black tracking-wider ${
                      questionWiseTiming && questionRemainingSeconds <= 10
                        ? "text-red-500"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {questionWiseTiming ? questionTimerLabel : timerLabel}
                  </Text>
                </View>
              </View>

              <View
                className="flex-row items-center flex-1 justify-end"
                style={{ gap: 8 }}
              >
                {calculatorEnabled && (
                  <TouchableOpacity
                    onPress={() => setIsCalculatorVisible(true)}
                    className="h-12 w-12 bg-orange-500 rounded-full items-center justify-center shadow-lg shadow-orange-500/30"
                  >
                    <Ionicons name="calculator" size={24} color="white" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleOpenSubmitConfirm}
                  disabled={submitting}
                  className="h-12 bg-red-500 rounded-xl items-center justify-center px-4 flex-shrink"
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      className="text-white text-base font-black"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {subjectWiseTiming
                        ? `Submit ${currentSubject?.subjectName}`
                        : "Submit Test"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-3 h-1 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
              <View
                className="h-full bg-primary"
                style={{
                  width: `${
                    ((currentGlobalIndex + 1) / allSubjectQuestions.length) *
                    100
                  }%`,
                }}
              />
            </View>
          </View>

          {/* Subject Selector */}
          <View className="px-6 pt-2">
            <TouchableOpacity
              onPress={() =>
                setIsSubjectFilterCollapsed(!isSubjectFilterCollapsed)
              }
              className="flex-row items-center justify-between"
            >
              <Text className="text-slate-800 dark:text-slate-100 font-black text-xs tracking-wider uppercase">
                Subjects
              </Text>
              <Feather
                name={isSubjectFilterCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>

            {!isSubjectFilterCollapsed && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
              >
                {subjects.map((subj, idx) => {
                  const isCompleted = completedSubjectIds.includes(
                    subj.subjectId,
                  );
                  const isActive = currentSubjectIndex === idx;
                  // If subjectWiseTiming or questionWiseTiming is true, ONLY the active subject is clickable.
                  // Completed or future subjects are locked.
                  const isLocked =
                    subjectWiseTiming || questionWiseTiming ? !isActive : false;

                  return (
                    <TouchableOpacity
                      key={subj.subjectId}
                      onPress={() => {
                        if (!isLocked) {
                          setCurrentSubjectIndex(idx);
                          setCurrentSectionIndex(0);
                          setCurrentQuestionIndex(0);
                        }
                      }}
                      disabled={isLocked}
                      className={`px-5 py-3 rounded-2xl border-2 flex-row items-center ${
                        isActive
                          ? "bg-primary/10 border-primary"
                          : isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20"
                            : isLocked
                              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50"
                              : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                      }`}
                    >
                      {isCompleted && (
                        <View className="mr-2 w-5 h-5 rounded-full bg-emerald-500 items-center justify-center">
                          <Feather name="check" size={12} color="white" />
                        </View>
                      )}
                      <Text
                        className={`text-sm font-black ${
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {subj.subjectName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Question Navigator */}
          <View className="px-6 pt-3 pb-2">
            <TouchableOpacity
              onPress={() => setIsQuestionNavigatorCollapsed((prev) => !prev)}
              className="flex-row items-center justify-between"
            >
              <Text className="text-slate-800 dark:text-slate-100 font-black text-xs tracking-wider uppercase">
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
                  data={navigatorData}
                  keyExtractor={(_, index) => String(index)}
                  showsHorizontalScrollIndicator={false}
                  ItemSeparatorComponent={() => <View className="w-2" />}
                  renderItem={({ item }) => {
                    if (item.type === "section") {
                      return (
                        <View className="flex-row items-center px-1">
                          {!item.isFirst && (
                            <View className="h-6 w-[1px] bg-gray-200 dark:bg-slate-700 mx-3" />
                          )}
                          <Text className="text-slate-400 dark:text-slate-500 font-black text-[10px] tracking-widest uppercase">
                            {item.title}
                          </Text>
                        </View>
                      );
                    }

                    const isCurrent =
                      item.sIdx === currentSectionIndex &&
                      item.qIdx === currentQuestionIndex;
                    const isAnswered = isQuestionAnswered(item.question);

                    return (
                      <TouchableOpacity
                        onPress={() => handleQuestionJump(item.sIdx, item.qIdx)}
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
                          {item.globalIndex + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            ) : null}
          </View>

          <View className="px-6 pt-4 pb-2">
            <View className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm mb-4">
              <View
                className="flex-row items-center justify-between mb-3"
                style={{ gap: 12 }}
              >
                <View className="flex-row items-center">
                  <Text className="text-primary text-sm font-black tracking-wider">
                    QUESTION
                  </Text>
                  <Text className="text-primary text-sm font-black tracking-wider ml-1">
                    {currentGlobalIndex + 1}
                  </Text>
                </View>

                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <Text
                    className="text-slate-500 dark:text-slate-400 text-[10px] font-bold"
                    numberOfLines={1}
                  >
                    {currentGlobalIndex + 1}/{allSubjectQuestions.length}
                  </Text>
                </View>
              </View>
              {currentQuestion.paragraphText
                ? renderHtmlOrText(
                    currentQuestion.paragraphText,
                    "text-slate-700 dark:text-slate-200 text-base font-semibold mb-4",
                    `para-${currentQuestion.id}`,
                  )
                : null}

              {renderHtmlOrText(
                currentQuestion.questionText,
                "text-slate-800 dark:text-white text-xl font-semibold leading-8",
                `q-${currentQuestion.id}`,
              )}
            </View>

            <View className="mb-4">
              {showAttemptLimitWarning && (
                <View className="flex-row items-center bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-2xl mb-4">
                  <Feather name="lock" size={16} color="#f97316" />
                  <Text className="ml-2 text-orange-700 dark:text-orange-300 text-xs font-bold leading-5 flex-1">
                    You have reached the maximum attempts for this section (
                    {currentSection?.maxAttemptsAllowed}/
                    {currentSection?.maxAttemptsAllowed}).
                  </Text>
                </View>
              )}

              {currentQuestion.category === "numeric" ? (
                <>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase">
                      Enter Answer
                    </Text>
                    {isCurrentQuestionAnswered ? (
                      <TouchableOpacity
                        onPress={() => handleClearResponse(currentQuestion.id)}
                        className="flex-row items-center bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-800/40"
                      >
                        <Feather name="rotate-ccw" size={12} color="#FF8A50" />
                        <Text className="ml-1.5 text-primary font-black text-[10px] uppercase tracking-wider">
                          Clear
                        </Text>
                      </TouchableOpacity>
                    ) : questionWiseTiming ? (
                      <TouchableOpacity
                        onPress={handleNextFromFooter}
                        className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        <Feather
                          name="skip-forward"
                          size={12}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                        <Text className="ml-1.5 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider">
                          Skip
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TextInput
                    value={numericAnswer}
                    onChangeText={(value) =>
                      handleNumericAnswerChange(currentQuestion.id, value)
                    }
                    placeholder="Type numeric answer"
                    keyboardType="decimal-pad"
                    editable={!showAttemptLimitWarning}
                    className={`rounded-2xl border px-4 py-4 text-base font-semibold ${
                      showAttemptLimitWarning
                        ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50"
                        : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                    } text-slate-800 dark:text-slate-100`}
                    placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                  />
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-500 dark:text-slate-400 font-black text-xs tracking-wider uppercase">
                      {currentQuestion.category === "multi"
                        ? "Select One or More Options"
                        : "Select One Option"}
                    </Text>
                    {isCurrentQuestionAnswered ? (
                      <TouchableOpacity
                        onPress={() => handleClearResponse(currentQuestion.id)}
                        className="flex-row items-center bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-md border border-orange-100 dark:border-orange-800/40"
                      >
                        <Feather name="rotate-ccw" size={12} color="#FF8A50" />
                        <Text className="ml-1.5 text-primary font-black text-[10px] uppercase tracking-wider">
                          Clear
                        </Text>
                      </TouchableOpacity>
                    ) : questionWiseTiming ? (
                      <TouchableOpacity
                        onPress={handleNextFromFooter}
                        className="flex-row items-center bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        <Feather
                          name="skip-forward"
                          size={12}
                          color={isDark ? "#94a3b8" : "#64748b"}
                        />
                        <Text className="ml-1.5 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider">
                          Skip
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
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
                        disabled={showAttemptLimitWarning}
                        className={`rounded-2xl border px-4 py-4 mb-3 flex-row items-center ${
                          isSelected
                            ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
                            : showAttemptLimitWarning
                              ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 opacity-50"
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
                              `opt-${currentQuestion.id}-${optionIndex}`,
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Navigation Footer */}
      <View
        className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {/* Prev button — hidden entirely in question-wise timing mode */}
          {!questionWiseTiming && (
            <TouchableOpacity
              onPress={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex((prev) => prev - 1);
                } else if (currentSectionIndex > 0) {
                  const prevSection =
                    currentSubject!.sections[currentSectionIndex - 1];
                  setCurrentSectionIndex(currentSectionIndex - 1);
                  setCurrentQuestionIndex(prevSection.questions.length - 1);
                } else if (!subjectWiseTiming && currentSubjectIndex > 0) {
                  const prevSubject = subjects[currentSubjectIndex - 1];
                  const prevSubjectLastSectionIdx =
                    prevSubject.sections.length - 1;
                  const prevSubjectLastSection =
                    prevSubject.sections[prevSubjectLastSectionIdx];
                  setCurrentSubjectIndex(currentSubjectIndex - 1);
                  setCurrentSectionIndex(prevSubjectLastSectionIdx);
                  setCurrentQuestionIndex(
                    prevSubjectLastSection.questions.length - 1,
                  );
                }
              }}
              disabled={
                currentQuestionIndex === 0 &&
                currentSectionIndex === 0 &&
                (subjectWiseTiming || currentSubjectIndex === 0)
              }
              className={`flex-1 py-3.5 rounded-2xl border items-center justify-center ${
                currentQuestionIndex === 0 &&
                currentSectionIndex === 0 &&
                (subjectWiseTiming || currentSubjectIndex === 0)
                  ? "border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/20"
                  : "border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
              }`}
            >
              <Text
                className={`font-black text-sm ${
                  currentQuestionIndex === 0 &&
                  currentSectionIndex === 0 &&
                  (subjectWiseTiming || currentSubjectIndex === 0)
                    ? "text-slate-400 dark:text-slate-600"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                Prev
              </Text>
            </TouchableOpacity>
          )}

          {!(
            currentGlobalIndex >= allSubjectQuestions.length - 1 &&
            (subjectWiseTiming || currentSubjectIndex >= subjects.length - 1)
          ) ? (
            <TouchableOpacity
              onPress={handleNextFromFooter}
              disabled={questionWiseTiming && !isCurrentQuestionAnswered}
              className={`flex-1 py-3.5 rounded-2xl shadow-sm items-center justify-center ${
                questionWiseTiming && !isCurrentQuestionAnswered
                  ? "bg-slate-300 dark:bg-slate-700 shadow-none"
                  : "bg-primary shadow-primary/20"
              }`}
            >
              <Text
                className={`font-black text-base ${
                  questionWiseTiming && !isCurrentQuestionAnswered
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-white"
                }`}
              >
                {questionWiseTiming && !isCurrentQuestionAnswered
                  ? "Answer or skip"
                  : "Next"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleOpenSubmitConfirm}
              disabled={submitting}
              className="flex-1 bg-green-600 py-3.5 rounded-2xl shadow-sm shadow-green-500/20 items-center justify-center"
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-black text-base">
                  {subjectWiseTiming ? "Submit Subject" : "Submit Test"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

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
        <View className="flex-1 bg-black/50 px-6 items-center justify-center">
          <View className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800">
            <View className="p-6 border-b border-gray-100 dark:border-slate-800">
              <View className="flex-row items-start justify-between mb-2">
                <Text className="flex-1 text-xl font-black text-slate-900 dark:text-white mr-4">
                  {subjectWiseTiming
                    ? `Submit ${currentSubject?.subjectName}`
                    : "Submit Test"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSubmitConfirm(false)}
                  disabled={submitting}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 items-center justify-center shrink-0"
                >
                  <Feather
                    name="x"
                    size={16}
                    color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                  />
                </TouchableOpacity>
              </View>
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-5">
                {subjectWiseTiming
                  ? "Are you sure you want to complete this subject? You cannot return to it once submitted."
                  : "Are you sure you want to submit the entire test?"}
              </Text>
            </View>

            <ScrollView
              className="p-6 max-h-96"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row flex-wrap justify-between mb-6">
                <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl w-[48%] mb-4 border border-slate-100 dark:border-slate-700">
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Questions
                  </Text>
                  <Text className="text-slate-900 dark:text-white text-xl font-black">
                    {subjectWiseTiming
                      ? currentSubjectProgress.total
                      : allQuestions.length}
                  </Text>
                </View>
                <View className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl w-[48%] mb-4 border border-slate-100 dark:border-slate-700">
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                    Answered
                  </Text>
                  <Text className="text-emerald-500 text-xl font-black">
                    {subjectWiseTiming
                      ? currentSubjectProgress.answered
                      : overallAnsweredCount}
                  </Text>
                </View>
              </View>

              <Text className="text-slate-900 dark:text-white font-bold mb-3">
                {subjectWiseTiming
                  ? "Current Subject Progress"
                  : "Subject Progress"}
              </Text>
              {subjectProgressRows
                .filter((row) =>
                  subjectWiseTiming
                    ? row.subjectName === currentSubject?.subjectName
                    : true,
                )
                .map((row) => (
                  <View
                    key={row.subjectName}
                    className="flex-row items-center justify-between py-3 border-b border-gray-50 dark:border-slate-800"
                  >
                    <Text className="flex-1 text-slate-700 dark:text-slate-300 font-medium mr-4">
                      {row.subjectName}
                    </Text>
                    <Text className="text-slate-900 dark:text-white font-bold shrink-0">
                      {row.answeredCount}/{row.totalCount}
                    </Text>
                  </View>
                ))}
            </ScrollView>

            <View className="p-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowSubmitConfirm(false)}
                className="flex-1 h-12 rounded-xl items-center justify-center border border-slate-200 dark:border-slate-700"
              >
                <Text className="text-slate-600 dark:text-slate-400 font-bold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={
                  subjectWiseTiming ? handleSubmitSubject : handleSubmitTest
                }
                disabled={submitting}
                className="flex-1 h-12 bg-primary rounded-xl items-center justify-center"
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-black">Yes, Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScientificCalculator
        visible={isCalculatorVisible}
        onClose={() => setIsCalculatorVisible(false)}
        isDark={colorScheme === "dark"}
      />
    </SafeAreaView>
  );
};

export default TestAttemptScreen;
