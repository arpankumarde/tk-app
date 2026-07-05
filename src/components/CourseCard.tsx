import { memo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import Placeholder from "@/constants/placeholder";

interface CourseCardProps {
  course: {
    id: number;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    thumbnailUrl: string | null;
    thumbnailImageUrl?: string | null;
    teacherName: string;
    teacherAvatarUrl?: string | null;
    teacherIsVerified?: boolean;
    rating?: number | null;
    avgRating?: number | null;
    ratingsCount?: number;
    views?: number;
  };
}

const formatInr = (amount: number) => amount.toLocaleString("en-IN");

const CourseCard = ({ course }: CourseCardProps) => {
  const displayImage =
    course.thumbnailImageUrl || course.thumbnailUrl || Placeholder.COURSE;
  const actualPrice =
    typeof course.discountPrice === "number"
      ? course.discountPrice
      : course.price;
  const isFree = actualPrice === 0;
  const hasRatings = (course.ratingsCount ?? 0) > 0;
  const displayRating = course.avgRating ?? course.rating;
  const ratingDisplay =
    typeof displayRating === "number"
      ? Number.isInteger(displayRating)
        ? String(displayRating)
        : displayRating.toFixed(1)
      : null;
  const displayAuthor = course.teacherName || "TestKart Expert";
  const teacherInitials =
    displayAuthor
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TE";
  const views = course.views || 0;

  const handlePress = () => {
    router.push(`/(main)/course/${course.slug}` as any);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      {/* Post Header: teacher avatar + name */}
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <View className="w-9 h-9 rounded-full bg-orange-50 dark:bg-slate-700 items-center justify-center overflow-hidden mr-3">
          {course.teacherAvatarUrl ? (
            <Image
              source={{ uri: course.teacherAvatarUrl }}
              className="w-full h-full"
            />
          ) : (
            <Text className="text-primary text-xs font-black">
              {teacherInitials}
            </Text>
          )}
        </View>
        <View className="flex-row items-center flex-1">
          <Text
            className="text-slate-800 dark:text-white font-bold text-sm"
            numberOfLines={1}
          >
            {displayAuthor}
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
      </View>

      {/* Title */}
      <Text
        className="text-lg font-black text-slate-800 dark:text-white px-5 mb-3 leading-6"
        numberOfLines={2}
      >
        {course.title}
      </Text>

      {/* Thumbnail */}
      <View className="aspect-video relative bg-gray-100 dark:bg-slate-900">
        <Image
          source={{ uri: displayImage }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Footer: views / rating (left) — price (right) */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center">
          <Feather name="eye" size={13} color="#94a3b8" />
          <Text className="ml-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold">
            {views} {views === 1 ? "View" : "Views"}
          </Text>

          {hasRatings && (
            <View className="flex-row items-center ml-3">
              <Feather name="star" size={13} color="#F59E0B" />
              <Text className="ml-1 text-amber-600 dark:text-amber-500 text-xs font-black">
                {ratingDisplay} ({course.ratingsCount})
              </Text>
            </View>
          )}
        </View>

        <Text
          className={`${isFree ? "text-emerald-500" : "text-primary"} text-lg font-black`}
        >
          {isFree ? "FREE" : `₹${formatInr(actualPrice)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CourseCard);
