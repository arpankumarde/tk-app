import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import BottomTabs from "@/components/BottomTabs";
import { WebView } from "react-native-webview";
import PDFPreview from "@/components/PDFPreview";
import { useAuth } from "@/context/AuthContext";

export type CourseStatus = "published" | "draft" | "archived";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type LessonContentType = "video" | "pdf" | "text";

export interface Teacher {
  id: number;
  displayName: string;
  profilePicture: string | null;
  isVerified: boolean;
  slug: string;
}

export interface Lesson {
  id: number;
  sectionId: number;
  title: string;
  contentType: LessonContentType;
  durationMinutes: number | null;
  isPreview: boolean;
  orderIndex: number;
  contentUrl?: string; // present for pdf lessons
  textContent?: string | null; // present for text lessons
}

export interface Section {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  teacherId: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  thumbnailImageUrl: string | null;
  thumbnailFileId: string | null;
  thumbnailImageFileId: string | null;
  introVideoUrl: string | null;
  introVideoFileId: string | null;
  price: number;
  status: CourseStatus;
  category: string;
  level: CourseLevel;
  estimatedDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  slug: string;
  language: string;
  teacherDisplayName: string;
  teacherProfilePicture: string | null;
  teacherIsVerified: boolean;
  teacher: Teacher;
  sections: Section[];
  isEnrolled: boolean;
}

const CourseDetails = () => {
  const { slug } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<number[]>([0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    enrollmentId?: number;
    message?: string;
  }>({ visible: false, success: false });

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    try {
      setEnrolling(true);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/_api/courses/enroll-free`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { courseId: course?.id } }),
        },
      );
      const data = await res.json();
      console.log(data, course?.id);
      if (data.json?.success) {
        setCourse((prev) => (prev ? { ...prev, isEnrolled: true } : prev));
        setEnrollResult({
          visible: true,
          success: true,
          enrollmentId: data.json.enrollmentId,
        });
      } else {
        console.error("Enrollment failed:", data.json?.error);
        setEnrollResult({
          visible: true,
          success: false,
          message: data.json?.error || "Failed to enroll. Please try again.",
        });
      }
    } catch (err) {
      console.error("Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const fetchUrl = `${process.env.EXPO_PUBLIC_BASE_URL}/_api/courses/details?slug=${slug}`;
        console.log("Fetching course details from:", fetchUrl);

        const response = await fetch(fetchUrl);
        const data = await response.json();

        // Robust extraction handle nested json, data, or direct fields
        const payload = data.json || data;

        // Determine if payload is the course itself or contains it
        let details = null;
        if (payload.id && payload.slug && payload.title) {
          details = payload; // Payload IS the course
        } else {
          details =
            payload.course ||
            payload.data?.course ||
            (Array.isArray(payload.courses) ? payload.courses[0] : null);
        }

        const apiError =
          payload.error || payload.data?.error || payload.message;

        if (details) {
          console.log("Course ID:", details.id, "Title:", details.title);
        }

        if (!details) {
          console.warn(
            "No course details found. Full keys:",
            Object.keys(data),
            "Payload keys:",
            Object.keys(payload),
          );
          throw new Error(apiError || "Course not found");
        }

        setCourse(details);
        console.log(details);
      } catch (err: any) {
        console.error("Fetch Course Error:", err);
        setError(err.message || "Failed to load course details.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCourseDetails();
  }, [slug]);

  const isYouTubeUrl = (url: string) =>
    url.includes("youtube.com/") || url.includes("youtu.be/");

  const getVideoPlayerHTML = (url: string) => `<!DOCTYPE html>
<html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
    body { display: flex; align-items: center; justify-content: center; height: 100vh; }
    video { width: 100%; max-height: 100vh; outline: none; }
  </style>
</head><body>
  <video autoplay playsinline src="${url}"></video>
</body></html>`;

  const toggleModule = (index: number) => {
    if (expandedModules.includes(index)) {
      setExpandedModules(expandedModules.filter((i) => i !== index));
    } else {
      setExpandedModules([...expandedModules, index]);
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

  const isFree = course.price === 0;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900" edges={["top"]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Custom Navigation Header */}
        <View className="px-6 py-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mr-4"
          >
            <Feather name="chevron-left" size={24} color="#FF8A50" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <Text className="text-slate-400 dark:text-slate-500 text-xs">
              Courses
            </Text>
            <Feather
              name="chevron-right"
              size={12}
              color="#94a3b8"
              className="mx-2"
            />
            <Text className="text-primary text-xs font-bold" numberOfLines={1}>
              {course.category || "Details"}
            </Text>
          </View>
        </View>

        {/* Course Main Title & Info */}
        <View className="px-6 pt-2 pb-6">
          <Text className="text-3xl font-black text-slate-800 dark:text-white leading-[42px] mb-4">
            {course.title}
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-base font-medium leading-6 mb-6">
            {course.description ||
              "Master this subject with our expert-led comprehensive course modules and practical exercises."}
          </Text>

          <View className="flex-row items-center mb-6">
            <View className="px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-full border border-emerald-100 dark:border-emerald-800/30 flex-row items-center">
              <Feather name="award" size={14} color="#10b981" />
              <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest ml-2 capitalize">
                {course.level}
              </Text>
            </View>
            <Text className="mx-3 text-slate-300">|</Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold">
              Created by{" "}
              <Link
                href={`/course/${course?.teacher?.slug}`}
                className="text-primary"
              >
                {course?.teacher?.displayName}
              </Link>
            </Text>
          </View>

          <View className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 rounded-[24px] p-5 border border-gray-100 dark:border-slate-700">
            <View className="ml-4 flex-1">
              <Text className="text-slate-800 dark:text-white font-black text-lg">
                Course Package
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                {course.sections?.length || 0} sections •{" "}
                {course.sections?.[0]?.lessons?.length || 0} lessons • Lifetime
                access
              </Text>
            </View>
          </View>
        </View>

        {/* Video Preview Section */}
        <View className="px-6 mb-8">
          <View className="h-56 w-full rounded-[40px] overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-2xl">
            {course.thumbnailImageUrl || course.thumbnailUrl ? (
              <Image
                source={{
                  uri:
                    course?.thumbnailImageUrl ||
                    course?.thumbnailUrl ||
                    undefined,
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Feather name="video" size={64} color="#e2e8f0" />
              </View>
            )}
            <View className="absolute inset-0 bg-black/20 items-center justify-center">
              <TouchableOpacity className="w-20 h-20 bg-primary/95 rounded-full items-center justify-center shadow-2xl border-[6px] border-white/30">
                <Feather name="play" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* What you'll learn */}
        <View className="px-6 mb-10">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-6">
            What you&apos;ll learn
          </Text>
          {[
            "Master all concepts covered in this course",
            "Learn through structured and comprehensive lessons",
            "Access high-quality video content and materials",
            "Build practical skills with hands-on exercises",
            "Track your progress throughout the course",
            "Get lifetime access to all course materials",
          ].map((item, id) => (
            <View key={id} className="flex-row items-center mb-4">
              <View className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mr-4">
                <Feather name="check" size={14} color="#10b981" />
              </View>
              <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium flex-1">
                {item}
              </Text>
            </View>
          ))}
        </View>

        {/* Course Curriculum */}
        <View className="px-6 mb-10">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
            Course Curriculum
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">
            {course.sections?.length || 0} sections •{" "}
            {course.sections?.[0]?.lessons?.length || 0} lessons • 1h 45m total
            length
          </Text>

          {course.sections?.map((section, sectionIdx: number) => (
            <View
              key={sectionIdx}
              className="mb-4 bg-gray-50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-700/50 rounded-[32px] overflow-hidden"
            >
              <TouchableOpacity
                onPress={() => toggleModule(sectionIdx)}
                className="p-6 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-slate-800 dark:text-white font-black text-lg">
                    {section.title}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold mt-1">
                    {section.lessons?.length || 0} lessons
                  </Text>
                </View>
                <Feather
                  name={
                    expandedModules.includes(sectionIdx)
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#FF8A50"
                />
              </TouchableOpacity>

              {expandedModules.includes(sectionIdx) && (
                <View className="px-6 pb-6 pt-2">
                  {section.lessons?.map((lesson, lessonIdx: number) => (
                    <TouchableOpacity
                      key={lessonIdx}
                      disabled={!lesson.isPreview}
                      onPress={() => {
                        if (!lesson.isPreview) return;
                        if (
                          lesson.contentType === "video" &&
                          lesson.contentUrl &&
                          isYouTubeUrl(lesson.contentUrl)
                        ) {
                          Linking.openURL(lesson.contentUrl);
                        } else {
                          setSelectedLesson(lesson);
                        }
                      }}
                      className="flex-row items-center py-4 border-t border-gray-100 dark:border-slate-700/30"
                    >
                      <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/10 items-center justify-center mr-4">
                        {lesson.contentType === "video" ? (
                          <Feather
                            name="play-circle"
                            size={16}
                            color="#FF8A50"
                          />
                        ) : lesson.contentType === "pdf" ? (
                          <Feather name="file-text" size={16} color="#FF8A50" />
                        ) : (
                          <Feather name="file" size={16} color="#FF8A50" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-700 dark:text-slate-300 text-sm font-bold">
                          {lesson.title}
                        </Text>
                        {lesson.durationMinutes ? (
                          <Text className="text-slate-400 text-xs mt-1">
                            {lesson.durationMinutes} min`
                          </Text>
                        ) : null}
                      </View>
                      {lesson.isPreview ? (
                        <Feather name="eye" size={14} color="#cbd5e1" />
                      ) : (
                        <Feather name="lock" size={14} color="#cbd5e1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Requirements & Description */}
        <View className="px-6 mb-20">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
            Requirements
          </Text>
          <View className="mb-8">
            {[
              "Basic understanding of the subject matter",
              "Commitment to learning and completion",
              "Internet connection for access",
            ].map((req, rid) => (
              <View key={rid} className="flex-row items-center mb-3">
                <View className="w-1.5 h-1.5 bg-primary rounded-full mr-3" />
                <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                  {req}
                </Text>
              </View>
            ))}
          </View>

          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
            Description
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-6">
            {course.description || "No detailed description provided."}
          </Text>
        </View>

        {/* Meet your instructor */}
        <View className="px-6 mb-10">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
            Meet your instructor
          </Text>
          <TouchableOpacity
            onPress={() => router.push(`/expert/${course.teacher.slug}`)}
            className="flex-row items-center bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-[24px] p-5"
          >
            <Image
              source={{
                uri:
                  course.teacher.profilePicture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(course.teacher.displayName)}&background=FF8A50&color=fff`,
              }}
              className="w-14 h-14 rounded-2xl"
            />
            <View className="ml-4 flex-1">
              <Text className="text-slate-800 dark:text-white font-black text-base">
                {course.teacher.displayName}
              </Text>
              {course.teacher.isVerified && (
                <View className="flex-row items-center mt-1">
                  <Feather name="check-circle" size={12} color="#10b981" />
                  <Text className="text-emerald-500 text-xs font-bold ml-1">
                    Verified Instructor
                  </Text>
                </View>
              )}
            </View>
            <Feather name="chevron-right" size={20} color="#FF8A50" />
          </TouchableOpacity>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 p-6 flex-row items-center">
        <View className="flex-1">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-tighter">
            Current Price
          </Text>
          <Text className="text-2xl font-black text-slate-800 dark:text-white mt-1">
            {isFree ? "Free" : `₹${course.price}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={isFree ? handleFreeEnroll : undefined}
          disabled={enrolling || (isFree && course.isEnrolled)}
          className={`${isFree ? "bg-orange-500" : "bg-primary"} h-14 px-8 rounded-2xl items-center justify-center shadow-lg shadow-orange-500/30 disabled:opacity-60`}
        >
          {enrolling ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black">
              {isFree
                ? course.isEnrolled
                  ? "Enrolled"
                  : "Enroll Free"
                : "Buy Now"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <BottomTabs />

      {/* Enrollment Result Modal */}
      <Modal
        visible={enrollResult.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEnrollResult((prev) => ({ ...prev, visible: false }))
        }
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white dark:bg-slate-800 rounded-[28px] p-8 w-full max-w-sm items-center shadow-2xl">
            {enrollResult.success ? (
              <>
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                  <Feather name="check-circle" size={32} color="#10B981" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                  Enrollment Successful!
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">
                  Enrollment ID #{enrollResult.enrollmentId}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  You now have full access to this course. Head to your
                  dashboard to start learning.
                </Text>
                <TouchableOpacity
                  className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                  onPress={() => {
                    setEnrollResult((prev) => ({ ...prev, visible: false }));
                    router.push("/(user)" as any);
                  }}
                >
                  <Text className="text-white font-black text-base">
                    Go to Dashboard
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-full h-12 rounded-2xl items-center justify-center"
                  onPress={() =>
                    setEnrollResult((prev) => ({ ...prev, visible: false }))
                  }
                >
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                    Continue Browsing
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-5">
                  <Feather name="alert-circle" size={32} color="#EF4444" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                  Enrollment Failed
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  {enrollResult.message}
                </Text>
                <TouchableOpacity
                  className="bg-primary w-full h-14 rounded-2xl items-center justify-center"
                  onPress={() =>
                    setEnrollResult((prev) => ({ ...prev, visible: false }))
                  }
                >
                  <Text className="text-white font-black text-base">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedLesson}
        animationType="slide"
        onRequestClose={() => setSelectedLesson(null)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <Text
              className="text-white font-bold text-base flex-1 mr-3"
              numberOfLines={1}
            >
              {selectedLesson?.title}
            </Text>
            <TouchableOpacity onPress={() => setSelectedLesson(null)}>
              <Feather name="x" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {selectedLesson?.contentType === "pdf" &&
          selectedLesson.contentUrl ? (
            <PDFPreview
              pdfUrl={selectedLesson.contentUrl}
              maxPages={99}
              style={{ flex: 1 }}
            />
          ) : selectedLesson?.contentType === "video" &&
            selectedLesson.contentUrl ? (
            <WebView
              source={{ html: getVideoPlayerHTML(selectedLesson.contentUrl) }}
              style={{ flex: 1, backgroundColor: "#000" }}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={["*"]}
            />
          ) : selectedLesson?.contentType === "text" &&
            selectedLesson.textContent ? (
            <ScrollView className="flex-1 bg-white dark:bg-slate-900 px-6 py-5">
              <Text className="text-slate-700 dark:text-slate-300 text-base leading-7">
                {selectedLesson.textContent}
              </Text>
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Feather name="alert-circle" size={32} color="#64748b" />
              <Text className="text-slate-400 mt-3 text-sm">
                No preview available
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default CourseDetails;
