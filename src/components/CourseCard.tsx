import { memo, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/context/AuthContext";
import Placeholder from "@/constants/placeholder";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    slug: string;
    price: number;
    thumbnailUrl: string | null;
    thumbnailImageUrl?: string | null;
    category: string;
    teacherName: string;
    level: string;
    totalEnrolled: number;
    enrollmentCount?: number;
    language: string;
    teacherIsVerified?: boolean;
    publishedAt: string;
    isEnrolled?: boolean;
    views?: number;
  };
}

const CourseCard = ({ course: initialCourse }: CourseCardProps) => {
  const [course, setCourse] = useState(initialCourse);
  const { user, token } = useAuth();
  const isFree = course.price === 0;
  const { addToCart, adding: addingToCart } = useAddToCart();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    enrollmentId?: number;
    message?: string;
  }>({ visible: false, success: false });

  const displayImage = course.thumbnailImageUrl || Placeholder.COURSE;

  const handlePress = () => {
    router.push(`/(main)/course/${course.slug}` as any);
  };

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
          credentials: "omit",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ json: { courseId: course.id } }),
        },
      );
      const data = await res.json();
      if (data.json?.success) {
        setCourse((prev) => ({ ...prev, isEnrolled: true }));
        setEnrollResult({
          visible: true,
          success: true,
          enrollmentId: data.json.enrollmentId,
        });
      } else {
        setEnrollResult({
          visible: true,
          success: false,
          message: data.json?.error || "Failed to enroll. Please try again.",
        });
      }
    } catch (err) {
      console.error("[CourseCard] Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const displayLevel =
    course.level || (course as any).difficulty || "All Levels";
  const displayStudents = course.enrollmentCount ?? course.totalEnrolled ?? 0;

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
      >
        {/* Category Badge */}
        <View className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-gray-100 dark:border-slate-700/50 shadow-sm">
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
            {course.category || "General"}
          </Text>
        </View>

        {/* Thumbnail */}
        <View className="aspect-video relative bg-gray-100 dark:bg-slate-900">
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Play Overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="w-12 h-12 bg-black/30 rounded-full items-center justify-center border border-white/40">
              <Feather name="play" size={24} color="white" />
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="p-6">
          <Text
            className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-7"
            numberOfLines={2}
          >
            {course.title}
          </Text>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                By:{" "}
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                {course.teacherName}
              </Text>
              {course.teacherIsVerified && (
                <MaterialIcons
                  name="verified"
                  size={14}
                  color="#22C55E"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <View className="flex-row items-center bg-gray-50 dark:bg-slate-700/50 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700">
              <Feather name="bar-chart" size={12} color="#FF8A50" />
              <Text className="ml-1.5 text-[10px] font-black text-slate-600 dark:text-slate-300 capitalize">
                {displayLevel}
              </Text>
            </View>
          </View>

          {/* Stats Linear */}
          <View className="flex-row items-center justify-between mb-6 pb-5 border-b border-gray-50 dark:border-slate-700/50">
            <View className="flex-row items-center">
              <Feather name="users" size={12} color="#FF8A50" />
              <Text className="ml-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {displayStudents} {displayStudents <= 1 ? "Student" : "Students"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="eye" size={12} color="#FF8A50" />
              <Text className="ml-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {course.views || 0} Views
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="globe" size={12} color="#FF8A50" />
              <Text className="ml-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {course.language || "English"}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={async () => {
                if (isFree) {
                  if (course.isEnrolled) {
                    router.push({ pathname: "/user/courses/[id]", params: { id: String(course.id) } });
                  } else {
                    handleFreeEnroll();
                  }
                } else {
                  const result = await addToCart(course.id, "course");
                  if (result.success) {
                    router.push("/user/cart");
                  }
                }
              }}
              disabled={addingToCart || enrolling}
              className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary shadow-orange-500/30"} flex-row items-center justify-center px-6 py-3.5 rounded-xl shadow-lg w-48 mr-4`}
            >
              {addingToCart || enrolling ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather
                    name={
                      isFree
                        ? course.isEnrolled
                          ? "play-circle"
                          : "book"
                        : "shopping-cart"
                    }
                    size={18}
                    color="white"
                  />
                  <Text className="text-white font-black ml-3 text-sm">
                    {isFree
                      ? course.isEnrolled
                        ? "Go to Course"
                        : "Enroll Free"
                      : "Buy Now"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text
              className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-2xl font-black`}
            >
              {isFree ? "FREE" : `₹${course.price}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

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
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-[340px] items-center shadow-2xl">
            {enrollResult.success ? (
              <>
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                  <Feather name="check-circle" size={32} color="#10B981" />
                </View>
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">
                  Enrollment Successful!
                </Text>
                {enrollResult.enrollmentId && (
                  <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-1">
                    ID #{enrollResult.enrollmentId}
                  </Text>
                )}
                <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                  You now have full access to this course. Start your learning
                  journey now!
                </Text>
                <TouchableOpacity
                  className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                  onPress={() => {
                    setEnrollResult((prev) => ({ ...prev, visible: false }));
                    router.push("/user");
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
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2 text-center">
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
    </View>
  );
};

export default memo(CourseCard);
