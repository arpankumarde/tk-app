import { memo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

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
    publishedAt: string;
  };
}

const CourseCard = ({ course }: CourseCardProps) => {
  const isFree = course.price === 0;

  const displayImage =
    course.thumbnailImageUrl ||
    "https://ik.imagekit.io/testkart/placeholders/Online%20Course.jpg";

  const handlePress = () => {
    router.push(`/(main)/course/${course.slug}` as any);
  };

  const displayLevel =
    course.level || (course as any).difficulty || "All Levels";
  const displayStudents = course.enrollmentCount ?? course.totalEnrolled ?? 0;

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      {/* Category Badge */}
      <View className="absolute top-4 left-4 z-10 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-gray-100 dark:border-slate-700/50 shadow-sm">
        <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
          {course.category || "General"}
        </Text>
      </View>

      {/* Thumbnail */}
      <View className="h-56 relative bg-gray-100 dark:bg-slate-900">
        {displayImage ? (
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Feather name="book-open" size={48} color="#cbd5e1" />
          </View>
        )}

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

        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-4 font-medium">
          By:{" "}
          <Text className="text-slate-600 dark:text-slate-300 font-bold">
            {course.teacherName}
          </Text>
        </Text>

        {/* Stats */}
        <View className="flex-row items-center justify-between mb-6 pb-4 border-b border-gray-50 dark:border-slate-700/50">
          <View className="flex-row items-center">
            <Feather name="bar-chart" size={14} color="#FF8A50" />
            <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">
              {displayLevel}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="users" size={14} color="#FF8A50" />
            <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              {displayStudents} Students
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="globe" size={14} color="#FF8A50" />
            <Text className="ml-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              {course.language || "English"}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary shadow-orange-500/30"} flex-row items-center px-6 py-3.5 rounded-xl shadow-lg w-48 mr-4`}
          >
            <Feather
              name={isFree ? "book" : "shopping-cart"}
              size={18}
              color="white"
            />
            <Text className="text-white font-black ml-3 text-sm">
              {isFree ? "Enroll Free" : "Buy Now"}
            </Text>
          </TouchableOpacity>

          <Text
            className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-xl font-black`}
          >
            {isFree ? "Free" : `₹${course.price}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CourseCard);
