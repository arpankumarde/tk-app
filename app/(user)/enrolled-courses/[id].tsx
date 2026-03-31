import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { WebView } from "react-native-webview";
import { useVideoPlayer, VideoView } from "expo-video";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAuth } from "@/context/AuthContext";

interface CourseLesson {
  id: number;
  sectionId: number;
  title: string;
  description: string | null;
  contentType: "video" | "text" | "quiz";
  contentUrl: string | null;
  textContent: string | null;
  durationMinutes: number | null;
  orderIndex: number;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
  contentFileId: string | null;
}

interface CourseSection {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: CourseLesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  thumbnailImageUrl: string | null;
  price: number;
  category: string;
  level: string;
  slug: string;
  language: string;
}

interface CourseProgress {
  enrollmentId: number;
  completionPercentage: number;
  completedLessonIds: number[];
}

interface QuizQuestion {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

const isYouTubeUrl = (url: string) =>
  url.includes("youtube.com/") || url.includes("youtu.be/");

const getYouTubeEmbedUrl = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const getYouTubePlayerHTML = (embedUrl: string) => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
    body { display: flex; align-items: center; justify-content: center; height: 100vh; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head><body>
  <iframe src="${embedUrl}?autoplay=1&playsinline=1" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
</body></html>`;

const CourseLessons = () => {
  const { id } = useLocalSearchParams();
  const courseId = useMemo(
    () => (Array.isArray(id) ? Number(id[0]) : Number(id)),
    [id],
  );
  const { colorScheme } = useColorScheme();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [expandedSections, setExpandedSections] = useState<number[]>([0]);
  const [selectedLesson, setSelectedLesson] = useState<CourseLesson | null>(
    null,
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const videoPlayer = useVideoPlayer(videoUrl && !isYouTubeUrl(videoUrl) ? videoUrl : null, (player) => {
    player.loop = false;
  });

  const totalLessons = useMemo(
    () => sections.reduce((sum, s) => sum + s.lessons.length, 0),
    [sections],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [lessonsRes, progressRes] = await Promise.all([
          fetch(
            `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/course/lessons?courseId=${courseId}`,
            { headers },
          ),
          fetch(
            `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/course/progress?courseId=${courseId}`,
            { headers },
          ),
        ]);

        const lessonsData = await lessonsRes.json();
        const progressData = await progressRes.json();

        const lessonsPayload = lessonsData.json || lessonsData;
        const progressPayload = progressData.json || progressData;

        if (lessonsPayload.course) setCourse(lessonsPayload.course);
        if (lessonsPayload.sections) setSections(lessonsPayload.sections);
        if (progressPayload) setProgress(progressPayload);
      } catch (err: any) {
        setError(err.message || "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (courseId && token) fetchData();
  }, [courseId, token]);

  useEffect(() => {
    if (selectedLesson?.contentType === "video") {
      ScreenOrientation.unlockAsync();
    } else {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    }
    return () => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP,
      );
    };
  }, [selectedLesson]);

  const fetchSignedVideoUrl = async (lessonId: number, videoUrl: string) => {
    try {
      setLoadingVideo(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/course/signed-video-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { lessonId, courseId, videoUrl } }),
        },
      );
      const data = await res.json();
      const payload = data.json || data;
      console.log("Signed video URL payload:", payload);
      return payload.signedUrl || null;
    } catch (err) {
      console.error("Failed to fetch signed video URL:", err);
      return null;
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleLessonPress = async (lesson: CourseLesson) => {
    if (lesson.contentType === "video") {
      if (lesson.contentUrl && isYouTubeUrl(lesson.contentUrl)) {
        setVideoUrl(lesson.contentUrl);
        setSelectedLesson(lesson);
        return;
      }
      const signedUrl = await fetchSignedVideoUrl(
        lesson.id,
        lesson.contentUrl || "",
      );
      if (signedUrl) {
        setVideoUrl(signedUrl);
        setSelectedLesson(lesson);
      }
    } else {
      setQuizAnswers({});
      setShowQuizResults(false);
      setSelectedLesson(lesson);
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setVideoUrl(null);
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  const isLessonCompleted = (lessonId: number) =>
    progress?.completedLessonIds.includes(lessonId) ?? false;

  const parseQuizQuestions = (textContent: string | null): QuizQuestion[] => {
    if (!textContent) return [];
    try {
      const parsed = JSON.parse(textContent);
      return parsed.questions || [];
    } catch {
      return [];
    }
  };

  const getLessonIcon = (
    contentType: string,
    completed: boolean,
  ): { name: keyof typeof Feather.glyphMap; color: string } => {
    if (completed) return { name: "check-circle", color: "#10b981" };
    switch (contentType) {
      case "video":
        return { name: "play-circle", color: "#FF8A50" };
      case "quiz":
        return { name: "help-circle", color: "#FF8A50" };
      default:
        return { name: "file-text", color: "#FF8A50" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 items-center justify-center p-6">
        <Text className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">
          {error || "Something went wrong"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 bg-primary rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top", "left", "right"]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View className="px-6 pt-6 pb-6 flex-row items-center bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 bg-gray-50 dark:bg-slate-800 rounded-xl items-center justify-center mr-4 border border-gray-100 dark:border-slate-700"
        >
          <Feather name="chevron-left" size={26} color="#FF8A50" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text
            className="text-slate-800 dark:text-white font-black text-xl tracking-tight"
            numberOfLines={1}
          >
            {course.title}
          </Text>
          <View className="flex-row items-center mt-0.5">
            <View className="bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md mr-2">
              <Text className="text-primary text-[9px] font-black uppercase">
                {course.category}
              </Text>
            </View>
            <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
              {course.level} • {totalLessons} Lessons
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Progress Card */}
        <View className="mx-6 mt-6 mb-8 p-6 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-100 dark:border-slate-700/50">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-slate-800 dark:text-white font-black text-xl">
                Course Progress
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">
                Keep it up! Almost there.
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-primary font-black text-2xl">
                {Math.round(progress?.completionPercentage ?? 0)}%
              </Text>
            </View>
          </View>

          <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
            <View
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(progress?.completionPercentage ?? 0, 100)}%`,
              }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-slate-700 flex-1 mr-3">
              <Feather name="book-open" size={16} color="#FF8A50" />
              <View className="ml-3">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">
                  Completed
                </Text>
                <Text className="text-slate-700 dark:text-slate-200 text-xs font-black">
                  {progress?.completedLessonIds.length ?? 0} / {totalLessons}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center bg-white dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-gray-100 dark:border-slate-700 flex-1">
              <Feather name="clock" size={16} color="#FF8A50" />
              <View className="ml-3">
                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">
                  Sections
                </Text>
                <Text className="text-slate-700 dark:text-slate-200 text-xs font-black">
                  {sections.length} Ready
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sections & Lessons */}
        <View className="px-6 mb-10">
          <View className="flex-row items-baseline justify-between mb-6">
            <Text className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              Course Content
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold">
              {sections.length} Sections
            </Text>
          </View>

          {sections.map((section, sectionIdx) => {
            const isExpanded = expandedSections.includes(sectionIdx);
            const completedCount = section.lessons.filter((l) => isLessonCompleted(l.id)).length;
            const isFullyCompleted = completedCount === section.lessons.length && section.lessons.length > 0;

            return (
              <View
                key={section.id}
                className={`mb-4 bg-gray-50 dark:bg-slate-800/20 border border-gray-100 dark:border-slate-700/50 rounded-2xl overflow-hidden ${isExpanded ? "border-primary/30 bg-white dark:bg-slate-800/40" : ""}`}
              >
                <TouchableOpacity
                  onPress={() => toggleSection(sectionIdx)}
                  activeOpacity={0.7}
                  className="px-5 py-4 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                      {isFullyCompleted && (
                        <View className="bg-emerald-500 rounded-full w-4 h-4 items-center justify-center mr-2">
                          <Feather name="check" size={10} color="white" />
                        </View>
                      )}
                      <Text className={`text-slate-800 dark:text-white font-black text-lg ${isFullyCompleted ? "text-slate-400 dark:text-slate-500" : ""}`}>
                        {section.title}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {section.lessons.length} Lessons • {completedCount} Completed
                      </Text>
                    </View>
                  </View>
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${isExpanded ? "bg-primary" : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"}`}>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={isExpanded ? "white" : "#FF8A50"}
                    />
                  </View>
                </TouchableOpacity>

              {expandedSections.includes(sectionIdx) && (
                <View className="px-5 pb-5 pt-2">
                  {section.lessons.map((lesson, lessonIdx) => {
                    const completed = isLessonCompleted(lesson.id);
                    const icon = getLessonIcon(lesson.contentType, completed);

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        onPress={() => handleLessonPress(lesson)}
                        disabled={loadingVideo}
                        activeOpacity={0.6}
                        className={`flex-row items-center py-4 ${lessonIdx !== section.lessons.length - 1 ? "border-b border-gray-100 dark:border-slate-700/30" : ""}`}
                      >
                        <View
                          className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${completed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-orange-50 dark:bg-orange-900/10"}`}
                        >
                          <Feather
                            name={icon.name}
                            size={20}
                            color={icon.color}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-[15px] font-bold leading-tight ${completed ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700" : "text-slate-700 dark:text-slate-200"}`}
                          >
                            {lesson.title}
                          </Text>
                          <View className="flex-row items-center mt-1.5">
                            <View className="bg-gray-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md mr-2">
                              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">
                                {lesson.contentType}
                              </Text>
                            </View>
                            {lesson.durationMinutes ? (
                              <View className="flex-row items-center">
                                <Feather name="clock" size={10} color="#94a3b8" />
                                <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold ml-1">
                                  {lesson.durationMinutes} min
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <View className={`w-8 h-8 rounded-full items-center justify-center ${completed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-slate-800"}`}>
                          {completed ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#10b981"
                            />
                          ) : lesson.contentType === "video" ? (
                            <Feather
                              name="play"
                              size={14}
                              color="#FF8A50"
                              style={{ marginLeft: 2 }}
                            />
                          ) : (
                            <Feather
                              name="chevron-right"
                              size={20}
                              color="#cbd5e1"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              </View>
            );
          })}
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Loading overlay for video fetch */}
      {loadingVideo && (
        <View className="absolute inset-0 bg-black/30 items-center justify-center">
          <View className="bg-white dark:bg-slate-800 rounded-2xl p-6 items-center">
            <ActivityIndicator size="large" color="#FF8A50" />
            <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm mt-3">
              Loading video...
            </Text>
          </View>
        </View>
      )}

      {/* Lesson Content Modal */}
      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        onRequestClose={closeLesson}
      >
        <SafeAreaView className="flex-1 bg-black">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <Text
              className="text-white font-bold text-base flex-1 mr-3"
              numberOfLines={1}
            >
              {selectedLesson?.title}
            </Text>
            <TouchableOpacity onPress={closeLesson}>
              <Feather name="x" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Video Content */}
          {selectedLesson?.contentType === "video" && videoUrl ? (
            isYouTubeUrl(videoUrl) ? (
              <WebView
                source={{
                  html: getYouTubePlayerHTML(getYouTubeEmbedUrl(videoUrl)),
                }}
                style={{ flex: 1, backgroundColor: "#000" }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                originWhitelist={["*"]}
              />
            ) : (
              <VideoView
                player={videoPlayer}
                style={{ flex: 1, backgroundColor: "#000" }}
                nativeControls
                contentFit="contain"
              />
            )
          ) : null}

          {/* Text Content */}
          {selectedLesson?.contentType === "text" &&
          selectedLesson.textContent ? (
            <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-6 py-5">
              <Text className="text-slate-700 dark:text-slate-300 text-base leading-7">
                {selectedLesson.textContent}
              </Text>
            </ScrollView>
          ) : null}

          {/* Quiz Content */}
          {selectedLesson?.contentType === "quiz" &&
          selectedLesson.textContent ? (
            <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-6 py-5">
              {(() => {
                const questions = parseQuizQuestions(
                  selectedLesson.textContent,
                );
                if (questions.length === 0) {
                  return (
                    <View className="items-center justify-center py-20">
                      <Feather name="alert-circle" size={32} color="#64748b" />
                      <Text className="text-slate-400 mt-3 text-sm">
                        No quiz questions available
                      </Text>
                    </View>
                  );
                }
                return (
                  <>
                    <Text className="text-slate-800 dark:text-white font-black text-xl mb-6">
                      Quiz • {questions.length} Questions
                    </Text>
                    {questions.map((q, qIdx) => {
                      const options = [
                        { key: "A", text: q.optionA },
                        { key: "B", text: q.optionB },
                        { key: "C", text: q.optionC },
                        { key: "D", text: q.optionD },
                      ];
                      const selectedAnswer = quizAnswers[q.id];
                      return (
                        <View
                          key={q.id}
                          className="mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700"
                        >
                          <Text className="text-slate-800 dark:text-white font-bold text-sm mb-3">
                            Q{qIdx + 1}. {q.questionText}
                          </Text>
                          {options.map((opt) => {
                            const isSelected = selectedAnswer === opt.key;
                            const isCorrectOption =
                              showQuizResults && opt.key === q.correctAnswer;

                            let optionStyle =
                              "border-gray-200 dark:border-slate-600";
                            if (showQuizResults && isCorrectOption) {
                              optionStyle =
                                "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
                            } else if (
                              showQuizResults &&
                              isSelected &&
                              !isCorrectOption
                            ) {
                              optionStyle =
                                "border-red-500 bg-red-50 dark:bg-red-900/20";
                            } else if (isSelected && !showQuizResults) {
                              optionStyle =
                                "border-primary bg-orange-50 dark:bg-orange-900/20";
                            }

                            return (
                              <TouchableOpacity
                                key={opt.key}
                                disabled={showQuizResults}
                                onPress={() =>
                                  setQuizAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: opt.key,
                                  }))
                                }
                                className={`flex-row items-center p-3 mb-2 rounded-xl border ${optionStyle}`}
                              >
                                <View
                                  className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                    isSelected
                                      ? showQuizResults
                                        ? isCorrectOption
                                          ? "border-emerald-500 bg-emerald-500"
                                          : "border-red-500 bg-red-500"
                                        : "border-primary bg-primary"
                                      : "border-gray-300 dark:border-slate-600"
                                  }`}
                                >
                                  {isSelected && (
                                    <Text className="text-white text-[10px] font-black">
                                      {opt.key}
                                    </Text>
                                  )}
                                  {!isSelected && (
                                    <Text className="text-slate-400 text-[10px] font-bold">
                                      {opt.key}
                                    </Text>
                                  )}
                                </View>
                                <Text
                                  className={`flex-1 text-sm font-medium ${
                                    showQuizResults && isCorrectOption
                                      ? "text-emerald-700 dark:text-emerald-400"
                                      : "text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {opt.text}
                                </Text>
                                {showQuizResults && isCorrectOption && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color="#10b981"
                                  />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                          {showQuizResults && q.explanation ? (
                            <View className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <Text className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                                {q.explanation}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}

                    {!showQuizResults ? (
                      <TouchableOpacity
                        onPress={() => setShowQuizResults(true)}
                        className="bg-primary h-14 rounded-2xl items-center justify-center mb-6"
                      >
                        <Text className="text-white font-black text-base">
                          Submit Quiz
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="mb-6 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 items-center">
                        <Text className="text-slate-800 dark:text-white font-black text-lg mb-1">
                          Score:{" "}
                          {
                            questions.filter(
                              (q) => quizAnswers[q.id] === q.correctAnswer,
                            ).length
                          }{" "}
                          / {questions.length}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setQuizAnswers({});
                            setShowQuizResults(false);
                          }}
                          className="mt-3 px-6 py-2.5 bg-primary rounded-full"
                        >
                          <Text className="text-white font-bold text-sm">
                            Retry Quiz
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          ) : null}

          {/* No content fallback */}
          {selectedLesson &&
          !(selectedLesson.contentType === "video" && videoUrl) &&
          !(
            selectedLesson.contentType === "text" && selectedLesson.textContent
          ) &&
          !(
            selectedLesson.contentType === "quiz" && selectedLesson.textContent
          ) ? (
            <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
              <Feather name="alert-circle" size={32} color="#64748b" />
              <Text className="text-slate-400 mt-3 text-sm">
                No content available for this lesson
              </Text>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default CourseLessons;
