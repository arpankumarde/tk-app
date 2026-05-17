import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { EnrolledCourse } from "../types";
import Placeholder from "@/constants/placeholder";

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
}

const EnrolledCourseCard = ({ course }: EnrolledCourseCardProps) => {
  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/user/courses/[id]",
          params: { id: String(course.id) },
        })
      }
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex-row items-center mb-4"
    >
      <View className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 mr-4 overflow-hidden relative">
        <Image
          source={{
            uri:
              course.thumbnailUrl || Placeholder.COURSE,
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 items-center justify-center bg-black/10">
          <Ionicons name="play" size={16} color="white" />
        </View>
      </View>

      {/* Content Section */}
      <View className="flex-1">
        <Text
          className="text-slate-800 dark:text-white font-black text-lg mb-0.5"
          numberOfLines={1}
        >
          {course.title}
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
          By: {course.teacherName || "TestKart Expert"}
        </Text>
        {/* Progress Bar */}
        <View className="flex-row items-center">
          <View className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mr-3 overflow-hidden">
            <View
              className={`h-full ${course.completionPercentage >= 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{
                width: `${Math.min(course.completionPercentage, 100)}%`,
              }}
            />
          </View>
          <Text className="text-slate-500 dark:text-slate-400 font-black text-[10px]">
            {Math.round(course.completionPercentage)}%
          </Text>
        </View>
        {course.totalLessons > 0 && (
          <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] mt-1">
            {course.completedLessons} of {course.totalLessons} Lessons completed
          </Text>
        )}
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color="#CBD5E1"
        className="ml-2"
      />
    </TouchableOpacity>
  );
};

export default EnrolledCourseCard;
