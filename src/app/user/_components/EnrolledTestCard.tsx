import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity
} from "react-native";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { EnrolledTest } from "../types";
import Placeholder from "@/constants/placeholder";
import { formatScore, calculateAverageScore } from "@/utils/scoreFormatter";

interface EnrolledTestCardProps {
  test: EnrolledTest;
}

const EnrolledTestCard = ({ test }: EnrolledTestCardProps) => {
  const displayThumbnail =
    test.thumbnailUrl ||
    test.thumbnailImageUrl ||
    test.teacherAvatar ||
    Placeholder.TEST;
  const displayExamName = test.examName || test.category || "Mock Test";

  const formattedDate = test.enrolledAt
    ? new Date(test.enrolledAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const handlePress = () => {
    if (test.pdfUrl) {
      router.push(`/product/${test.slug}` as any);
    } else {
      router.push({ pathname: "/user/tests/[slug]", params: { slug: test.slug } });
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white dark:bg-night p-5 rounded-2xl border border-line dark:border-night-line shadow-sm mb-5"
    >
      <View className="flex-row items-center mb-4">
        {/* Small Thumbnail */}
        <View className="w-24 aspect-video rounded-xl bg-clay-tint dark:bg-night-raised mr-4 overflow-hidden relative items-center justify-center">
          <Image
            source={{ uri: displayThumbnail }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Title and Date */}
        <View className="flex-1">
          <View className="bg-clay-tint dark:bg-night-raised px-2 py-0.5 rounded-md self-start mb-1">
            <Text className="text-primary-deep dark:text-primary font-extrabold text-[10px]">
              {displayExamName}
            </Text>
          </View>
          <Text
            className="text-ink dark:text-white font-extrabold text-base"
            numberOfLines={1}
          >
            {test.title}
          </Text>
          {formattedDate && (
            <Text className="text-ink-soft dark:text-night-soft font-bold text-[10px] mt-0.5">
              Enrolled on {formattedDate}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={20} color="#B5AEA3" />
      </View>

      {/* Progress Section */}
      <View className="pt-3 border-t border-line dark:border-night-line">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-ink dark:text-white font-extrabold text-[11px]">
            Overall Progress
          </Text>
          <Text className="text-ink-soft dark:text-night-soft font-bold text-[10px]">
            {test.completedItems || 0} of {test.totalItems || 0} tests completed
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-1.5 bg-sand dark:bg-night-raised rounded-full overflow-hidden mb-4">
          <View
            className="h-full bg-primary-deep"
            style={{ width: `${Math.min(test.progressPercentage || 0, 100)}%` }}
          />
        </View>

        {/* Stats Grid */}
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <Text className="text-ink dark:text-white font-extrabold text-sm">
              {test.totalItems || 0}
            </Text>
            <Text className="text-ink-soft font-bold text-[9px] uppercase tracking-wider">
              Total Tests
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-sand dark:bg-night-raised" />
          <View className="items-center flex-1">
            <Text className="text-ink dark:text-white font-extrabold text-sm">
              {test.completedItems || 0}
            </Text>
            <Text className="text-ink-soft font-bold text-[9px] uppercase tracking-wider">
              Completed
            </Text>
          </View>
          <View className="w-[1px] h-6 bg-sand dark:bg-night-raised" />
          <View className="items-center flex-1">
            <Text className="text-ink dark:text-white font-extrabold text-sm">
              {formatScore(calculateAverageScore(test))}
            </Text>
            <Text className="text-ink-soft font-bold text-[9px] uppercase tracking-wider">
              Avg Score
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EnrolledTestCard;
