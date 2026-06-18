import Feather, {
  type FeatherIconName,
} from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PDFPreview from "@/components/PDFPreview";
import { useAuth } from "@/context/AuthContext";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import { useColorScheme } from "nativewind";
import { WebView } from "react-native-webview";

interface CourseLesson {
  id: number;
  sectionId: number;
  title: string;
  description: string | null;
  contentType: "video" | "text" | "quiz" | "pdf";
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
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  return match
    ? `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&controls=1&playsinline=1&autoplay=1`
    : url;
};

const getYouTubePlayerHTML = (embedUrl: string) => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; }
    iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
  </style>
</head><body>
  <iframe src="${embedUrl}" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>
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
  const [markingComplete, setMarkingComplete] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const drawerWidth = screenWidth * 0.82;

  const videoPlayer = useVideoPlayer(
    videoUrl && !isYouTubeUrl(videoUrl) ? videoUrl : null,
    (player) => {
      player.loop = false;
    },
  );

  const totalLessons = useMemo(
    () => sections.reduce((sum, s) => sum + s.lessons.length, 0),
    [sections],
  );

  const allLessons = useMemo(
    () => sections.flatMap((s) => s.lessons),
    [sections],
  );

  const currentLessonIndex = useMemo(() => {
    if (!selectedLesson) return -1;
    return allLessons.findIndex((l) => l.id === selectedLesson.id);
  }, [allLessons, selectedLesson]);

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

        // DEBUG: log every lesson's content URL returned by the lessons API
        // console.log(
        //   "[CourseContent] lessons loaded:",
        //   JSON.stringify(
        //     (lessonsPayload.sections || []).flatMap((s: CourseSection) =>
        //       s.lessons.map((l) => ({
        //         id: l.id,
        //         title: l.title,
        //         contentType: l.contentType,
        //         contentUrl: l.contentUrl,
        //       })),
        //     ),
        //     null,
        //     2,
        //   ),
        // );
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
      // DEBUG: log the input video URL and the signed URL returned by the API
      // console.log("[CourseContent] signed-video-url request:", {
      //   lessonId,
      //   courseId,
      //   inputVideoUrl: videoUrl,
      // });
      // console.log(
      //   "[CourseContent] signed-video-url returned:",
      //   payload.signedUrl || null,
      // );
      return payload.signedUrl || null;
    } catch (err) {
      console.error("Failed to fetch signed video URL:", err);
      return null;
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleLessonPress = async (lesson: CourseLesson) => {
    // Clear previous lesson state
    setVideoUrl(null);
    setQuizAnswers({});
    setShowQuizResults(false);
    setSelectedLesson(lesson);

    // DEBUG: log the lesson that was clicked and its raw content URL
    // console.log("[CourseContent] lesson clicked:", {
    //   id: lesson.id,
    //   title: lesson.title,
    //   contentType: lesson.contentType,
    //   contentUrl: lesson.contentUrl,
    // });

    if (lesson.contentType === "video") {
      if (lesson.contentUrl && isYouTubeUrl(lesson.contentUrl)) {
        // console.log(
        //   "[CourseContent] YouTube video URL (used directly):",
        //   lesson.contentUrl,
        // );
        // console.log(
        //   "[CourseContent] YouTube iframe embed URL:",
        //   getYouTubeEmbedUrl(lesson.contentUrl),
        // );
        setVideoUrl(lesson.contentUrl);
        return;
      }
      const signedUrl = await fetchSignedVideoUrl(
        lesson.id,
        lesson.contentUrl || "",
      );
      if (signedUrl) {
        setVideoUrl(signedUrl);
      }
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
    closeDrawer();
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const handleDrawerLessonPress = (lesson: CourseLesson) => {
    closeDrawer();
    handleLessonPress(lesson);
  };

  const isLessonCompleted = (lessonId: number) =>
    progress?.completedLessonIds.includes(lessonId) ?? false;

  const isCurrentLessonCompleted = selectedLesson
    ? isLessonCompleted(selectedLesson.id)
    : false;

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      handleLessonPress(allLessons[currentLessonIndex - 1]);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      handleLessonPress(allLessons[currentLessonIndex + 1]);
    }
  };

  const handleMarkComplete = async (autoNavigate = true) => {
    if (!selectedLesson || !token) return;
    try {
      setMarkingComplete(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/course/mark-complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { lessonId: selectedLesson.id } }),
        },
      );
      const data = await res.json();
      const payload = data.json || data;

      if (payload.success) {
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedLessonIds: [...prev.completedLessonIds, selectedLesson.id],
            completionPercentage: payload.completionPercentage,
          };
        });
        // Auto-navigate to next lesson
        if (autoNavigate && currentLessonIndex < allLessons.length - 1) {
          setTimeout(() => {
            handleLessonPress(allLessons[currentLessonIndex + 1]);
          }, 400);
        }
      } else if (payload.error) {
        const msg =
          typeof payload.error === "string"
            ? payload.error
            : Array.isArray(payload.error)
              ? payload.error[0]?.message
              : "Failed to mark complete";
        Alert.alert("Error", msg || "Failed to mark complete");
      }
    } catch {
      Alert.alert("Error", "Failed to mark lesson as complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleMarkIncomplete = async () => {
    if (!selectedLesson || !token) return;
    try {
      setMarkingComplete(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/student/course/mark-incomplete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { lessonId: selectedLesson.id } }),
        },
      );
      const data = await res.json();
      const payload = data.json || data;

      if (payload.success) {
        setProgress((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedLessonIds: prev.completedLessonIds.filter(
              (id) => id !== selectedLesson!.id,
            ),
            completionPercentage: payload.completionPercentage,
          };
        });
      } else if (payload.error) {
        const msg =
          typeof payload.error === "string"
            ? payload.error
            : Array.isArray(payload.error)
              ? payload.error[0]?.message
              : "Failed to update";
        Alert.alert("Error", msg || "Failed to mark incomplete");
      }
    } catch {
      Alert.alert("Error", "Failed to mark lesson as incomplete");
    } finally {
      setMarkingComplete(false);
    }
  };

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
  ): { name: FeatherIconName; color: string } => {
    if (completed) return { name: "check-circle", color: "#10b981" };
    switch (contentType) {
      case "video":
        return { name: "play-circle", color: "#FF8A50" };
      case "quiz":
        return { name: "help-circle", color: "#FF8A50" };
      case "pdf":
        return { name: "file", color: "#FF8A50" };
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
    <SafeAreaView
      className="flex-1 bg-white dark:bg-slate-900"
      edges={["top", "left", "right"]}
    >
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
          <View className="flex-row items-center mt-1 gap-1.5">
            <View className="bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-md">
              <Text className="text-primary text-[9px] font-black uppercase">
                {course.category}
              </Text>
            </View>
            <View className="bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md">
              <Text className="text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase">
                {course.level}
              </Text>
            </View>
            <View className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase">
                {totalLessons} Lessons
              </Text>
            </View>
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
                {(progress?.completionPercentage ?? 0) >= 100
                  ? "You've completed this course!"
                  : "Keep it up! Almost there."}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className={`font-black text-2xl ${(progress?.completionPercentage ?? 0) >= 100 ? "text-emerald-500" : "text-primary"}`}
              >
                {Math.round(progress?.completionPercentage ?? 0)}%
              </Text>
            </View>
          </View>

          <View className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
            <View
              className={`h-full rounded-full ${(progress?.completionPercentage ?? 0) >= 100 ? "bg-emerald-500" : "bg-primary"}`}
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
            const completedCount = section.lessons.filter((l) =>
              isLessonCompleted(l.id),
            ).length;
            const isFullyCompleted =
              completedCount === section.lessons.length &&
              section.lessons.length > 0;

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
                      <Text
                        className={`text-slate-800 dark:text-white font-black text-lg ${isFullyCompleted ? "text-slate-400 dark:text-slate-500" : ""}`}
                      >
                        {section.title}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {section.lessons.length} Lessons • {completedCount}{" "}
                        Completed
                      </Text>
                    </View>
                  </View>
                  <View
                    className={`w-10 h-10 rounded-xl items-center justify-center ${isExpanded ? "bg-primary" : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"}`}
                  >
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
                                  <Feather
                                    name="clock"
                                    size={10}
                                    color="#94a3b8"
                                  />
                                  <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold ml-1">
                                    {lesson.durationMinutes} min
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                          <View
                            className={`w-8 h-8 rounded-full items-center justify-center ${completed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-gray-50 dark:bg-slate-800"}`}
                          >
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

      {/* Lesson Content Modal */}
      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        onRequestClose={closeLesson}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
          {/* ── Navbar ── */}
          <View className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <TouchableOpacity
              onPress={closeLesson}
              className="w-10 h-10 rounded-xl items-center justify-center mr-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
            >
              <Feather name="chevron-left" size={20} color="#FF8A50" />
            </TouchableOpacity>
            <View className="flex-1 mr-3">
              <Text
                className="text-slate-800 dark:text-white font-black text-base"
                numberOfLines={1}
              >
                {selectedLesson?.title}
              </Text>
              <Text className="text-slate-400 dark:text-slate-500 text-[11px] font-bold mt-0.5">
                Lesson {currentLessonIndex + 1} of {allLessons.length}
              </Text>
            </View>
            {isCurrentLessonCompleted && (
              <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 mr-2">
                <Feather name="check-circle" size={14} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black ml-1 uppercase">
                  Done
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={openDrawer}
              className="w-10 h-10 rounded-xl items-center justify-center bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
            >
              <Feather name="menu" size={20} color="#FF8A50" />
            </TouchableOpacity>
          </View>

          {/* ── Content Area ── */}
          {/* Video */}
          {selectedLesson?.contentType === "video" ? (
            loadingVideo && !videoUrl ? (
              <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#FF8A50" />
                <Text className="text-slate-400 font-bold text-sm mt-4">
                  Loading video...
                </Text>
              </View>
            ) : videoUrl ? (
              isYouTubeUrl(videoUrl) ? (
                <WebView
                  source={{
                    html: getYouTubePlayerHTML(getYouTubeEmbedUrl(videoUrl)),
                    baseUrl: "https://testkart.in",
                  }}
                  style={{ flex: 1, backgroundColor: "#000" }}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsFullscreenVideo
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
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
            ) : (
              <View className="flex-1 items-center justify-center bg-black">
                <Feather name="video-off" size={32} color="#64748b" />
                <Text className="text-slate-500 mt-3 text-sm font-medium">
                  Video not available
                </Text>
              </View>
            )
          ) : null}

          {/* Text Content */}
          {selectedLesson?.contentType === "text" ? (
            selectedLesson.textContent ? (
              <ScrollView
                className="flex-1 bg-white dark:bg-slate-900"
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                <Text className="text-slate-700 dark:text-slate-300 text-base leading-7">
                  {selectedLesson.textContent}
                </Text>
              </ScrollView>
            ) : (
              <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
                <Feather name="file-text" size={32} color="#64748b" />
                <Text className="text-slate-400 mt-3 text-sm font-medium">
                  No content available
                </Text>
              </View>
            )
          ) : null}

          {/* PDF Content */}
          {selectedLesson?.contentType === "pdf" ? (
            selectedLesson.contentUrl ? (
              <PDFPreview
                pdfUrl={selectedLesson.contentUrl}
                maxPages={Infinity}
                style={{ flex: 1 }}
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
                <Feather name="file" size={32} color="#64748b" />
                <Text className="text-slate-400 mt-3 text-sm font-medium">
                  PDF not available
                </Text>
              </View>
            )
          ) : null}

          {/* Quiz Content */}
          {selectedLesson?.contentType === "quiz" ? (
            selectedLesson.textContent ? (
              <ScrollView
                className="flex-1 bg-white dark:bg-slate-900"
                contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {(() => {
                  const questions = parseQuizQuestions(
                    selectedLesson.textContent,
                  );
                  if (questions.length === 0) {
                    return (
                      <View className="items-center justify-center py-20">
                        <Feather
                          name="alert-circle"
                          size={32}
                          color="#64748b"
                        />
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
                          <View key={q.id} className="mb-6">
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
                          onPress={() =>
                            Alert.alert(
                              "Submit Quiz",
                              "Are you sure you want to submit your answers?",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Submit",
                                  onPress: () => {
                                    setShowQuizResults(true);
                                    if (!isCurrentLessonCompleted) {
                                      handleMarkComplete(false);
                                    }
                                  },
                                },
                              ],
                            )
                          }
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
            ) : (
              <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
                <Feather name="help-circle" size={32} color="#64748b" />
                <Text className="text-slate-400 mt-3 text-sm font-medium">
                  No quiz available
                </Text>
              </View>
            )
          ) : null}

          {/* ── Sticky Bottom Bar ── */}
          <View className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 px-4 py-3">
            <View className="flex-row items-center justify-between">
              {/* Previous */}
              <TouchableOpacity
                onPress={goToPreviousLesson}
                disabled={currentLessonIndex <= 0 || loadingVideo}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-2.5 rounded-xl border ${
                  currentLessonIndex <= 0
                    ? "border-gray-100 dark:border-slate-800"
                    : "border-primary/30 bg-orange-50/50 dark:bg-orange-950/20"
                }`}
                style={{ opacity: currentLessonIndex <= 0 ? 0.35 : 1 }}
              >
                <Feather
                  name="chevron-left"
                  size={16}
                  color={currentLessonIndex <= 0 ? "#94a3b8" : "#FF8A50"}
                />
                <Text
                  className={`font-bold text-sm ml-0.5 ${
                    currentLessonIndex <= 0
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-primary"
                  }`}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              {/* Mark Complete / Incomplete */}
              <TouchableOpacity
                onPress={
                  isCurrentLessonCompleted
                    ? handleMarkIncomplete
                    : () => handleMarkComplete()
                }
                disabled={markingComplete}
                activeOpacity={0.7}
                className={`flex-row items-center px-5 py-2.5 rounded-xl ${
                  isCurrentLessonCompleted ? "bg-emerald-500" : "bg-primary"
                }`}
              >
                {markingComplete ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons
                      name={
                        isCurrentLessonCompleted
                          ? "checkmark-circle"
                          : "checkmark-circle-outline"
                      }
                      size={18}
                      color="white"
                    />
                    <Text className="text-white font-black text-sm ml-1.5">
                      {isCurrentLessonCompleted ? "Completed" : "Mark Complete"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity
                onPress={goToNextLesson}
                disabled={
                  currentLessonIndex >= allLessons.length - 1 || loadingVideo
                }
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-2.5 rounded-xl border ${
                  currentLessonIndex >= allLessons.length - 1
                    ? "border-gray-100 dark:border-slate-800"
                    : "border-primary/30 bg-orange-50/50 dark:bg-orange-950/20"
                }`}
                style={{
                  opacity:
                    currentLessonIndex >= allLessons.length - 1 ? 0.35 : 1,
                }}
              >
                <Text
                  className={`font-bold text-sm mr-0.5 ${
                    currentLessonIndex >= allLessons.length - 1
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-primary"
                  }`}
                >
                  Next
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={
                    currentLessonIndex >= allLessons.length - 1
                      ? "#94a3b8"
                      : "#FF8A50"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Lesson Drawer (slides from right) ── */}
          {drawerOpen && (
            <View className="absolute inset-0" style={{ zIndex: 50 }}>
              {/* Backdrop */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.45)",
                  opacity: drawerAnim,
                }}
              >
                <TouchableOpacity
                  className="flex-1"
                  activeOpacity={1}
                  onPress={closeDrawer}
                />
              </Animated.View>

              {/* Panel */}
              <Animated.View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: drawerWidth,
                  transform: [
                    {
                      translateX: drawerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [drawerWidth, 0],
                      }),
                    },
                  ],
                  backgroundColor:
                    colorScheme === "dark" ? "#0f172a" : "#ffffff",
                  borderLeftWidth: 1,
                  borderLeftColor:
                    colorScheme === "dark" ? "#334155" : "#e5e7eb",
                  shadowColor: "#000",
                  shadowOffset: { width: -4, height: 0 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 20,
                }}
              >
                {/* Drawer Header */}
                <SafeAreaView edges={["top"]}>
                  <View className="flex-row items-center px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                    <Text
                      className="flex-1 text-slate-800 dark:text-white font-black text-base"
                      numberOfLines={1}
                    >
                      {course?.title}
                    </Text>
                    <TouchableOpacity
                      onPress={closeDrawer}
                      className="w-9 h-9 rounded-lg items-center justify-center bg-gray-50 dark:bg-slate-800"
                    >
                      <Feather
                        name="x"
                        size={18}
                        color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Progress */}
                  <View className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-black mb-2">
                      {Math.round(progress?.completionPercentage ?? 0)}%
                      Complete
                    </Text>
                    <View className="h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(progress?.completionPercentage ?? 0, 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                </SafeAreaView>

                {/* Sections & Lessons */}
                <ScrollView
                  className="flex-1"
                  showsVerticalScrollIndicator={false}
                >
                  {sections.map((section) => (
                    <View key={section.id}>
                      {/* Section Header */}
                      <View className="px-5 pt-5 pb-2">
                        <Text className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {section.title}
                        </Text>
                      </View>

                      {/* Lessons */}
                      {section.lessons.map((lesson) => {
                        const completed = isLessonCompleted(lesson.id);
                        const isCurrent = selectedLesson?.id === lesson.id;

                        return (
                          <TouchableOpacity
                            key={lesson.id}
                            onPress={() => handleDrawerLessonPress(lesson)}
                            activeOpacity={0.6}
                            className={`flex-row items-center px-5 py-3 mx-2 rounded-xl ${
                              isCurrent
                                ? "bg-orange-50 dark:bg-orange-950/30 border border-primary/20"
                                : ""
                            }`}
                          >
                            <View className="mr-3">
                              {completed ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={22}
                                  color="#10b981"
                                />
                              ) : isCurrent ? (
                                <Feather
                                  name="play-circle"
                                  size={22}
                                  color="#FF8A50"
                                />
                              ) : (
                                <Feather
                                  name="circle"
                                  size={22}
                                  color={
                                    colorScheme === "dark"
                                      ? "#475569"
                                      : "#cbd5e1"
                                  }
                                />
                              )}
                            </View>
                            <View className="flex-1">
                              <Text
                                className={`text-sm font-bold ${
                                  isCurrent
                                    ? "text-primary"
                                    : completed
                                      ? "text-slate-400 dark:text-slate-500"
                                      : "text-slate-700 dark:text-slate-300"
                                }`}
                                numberOfLines={2}
                              >
                                {lesson.title}
                              </Text>
                              {lesson.durationMinutes ? (
                                <Text className="text-slate-400 dark:text-slate-600 text-[10px] font-bold mt-0.5">
                                  {lesson.durationMinutes} min
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                  <View className="h-8" />
                </ScrollView>
              </Animated.View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default CourseLessons;
