import { View, Text, Image, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
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
      className="bg-white dark:bg-night p-4 rounded-2xl border border-line dark:border-night-line shadow-sm flex-row items-center mb-4"
    >
      <View className="w-28 aspect-video rounded-xl bg-sand dark:bg-night-raised mr-4 overflow-hidden relative">
        <Image
          source={{
            uri:
              course.thumbnailUrl || Placeholder.COURSE,
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 items-center justify-center bg-black/10">
          <Feather name="play" size={16} color="white" />
        </View>
      </View>

      {/* Content Section */}
      <View className="flex-1">
        <Text
          className="text-ink dark:text-white font-extrabold text-lg mb-0.5"
          numberOfLines={1}
        >
          {course.title}
        </Text>
        <Text className="text-ink-soft dark:text-night-soft font-bold text-xs mb-2">
          By: {course.teacherName || "Testkart Expert"}
        </Text>
        {/* Progress Bar */}
        <View className="flex-row items-center">
          <View className="flex-1 h-1.5 bg-sand dark:bg-night-raised rounded-full mr-3 overflow-hidden">
            <View
              className={`h-full ${course.completionPercentage >= 100 ? "bg-emerald-500" : "bg-primary-deep"}`}
              style={{
                width: `${Math.min(course.completionPercentage, 100)}%`,
              }}
            />
          </View>
          <Text className="text-ink-soft dark:text-night-soft font-extrabold text-[10px]">
            {Math.round(course.completionPercentage)}%
          </Text>
        </View>
        {course.totalLessons > 0 && (
          <Text className="text-ink-soft dark:text-night-soft font-bold text-[10px] mt-1">
            {course.completedLessons} of {course.totalLessons} Lessons completed
          </Text>
        )}
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color="#B5AEA3"
        className="ml-2"
      />
    </TouchableOpacity>
  );
};

export default EnrolledCourseCard;
