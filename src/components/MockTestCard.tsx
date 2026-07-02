import Placeholder from "@/constants/placeholder";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface MockTestCardProps {
  test: {
    id: number;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    thumbnailUrl: string | null;
    creatorName?: string;
    teacherName?: string;
    teacherAvatarUrl?: string | null;
    teacherIsVerified?: boolean;
    rating?: number | null;
    reviewsCount?: number;
    views?: number;
  };
}

const formatInr = (amount: number) => amount.toLocaleString("en-IN");

const MockTestCard = ({ test }: MockTestCardProps) => {
  const displayImage = test.thumbnailUrl || Placeholder.TEST;
  const actualPrice =
    typeof test.discountPrice === "number" ? test.discountPrice : test.price;
  const isFree = actualPrice === 0;
  const hasDiscount =
    typeof test.discountPrice === "number" && test.discountPrice < test.price;
  const discountPercent =
    hasDiscount && test.price > 0
      ? Math.round(((test.price - actualPrice) / test.price) * 100)
      : null;
  const hasRatings = (test.reviewsCount ?? 0) > 0;
  const ratingDisplay =
    typeof test.rating === "number"
      ? Number.isInteger(test.rating)
        ? String(test.rating)
        : test.rating.toFixed(1)
      : null;
  const displayAuthor =
    test.teacherName || test.creatorName || "TestKart Expert";
  const teacherInitials =
    displayAuthor
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TE";
  const views = test.views || 0;

  const handlePress = () => {
    router.push(`/(main)/tests/${test.slug}` as any);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mx-4 mb-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      {/* Post Header: teacher avatar + name */}
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <View className="w-9 h-9 rounded-full bg-orange-50 dark:bg-slate-700 items-center justify-center overflow-hidden mr-3">
          {test.teacherAvatarUrl ? (
            <Image
              source={{ uri: test.teacherAvatarUrl }}
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
          {test.teacherIsVerified && (
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
        {test.title}
      </Text>

      {/* Thumbnail */}
      <View className="aspect-video relative bg-gray-100 dark:bg-slate-900">
        <Image
          source={{ uri: displayImage }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {discountPercent !== null && (
          <View className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 rounded-full shadow-sm">
            <Text className="text-white text-[10px] font-black">
              {discountPercent}% OFF
            </Text>
          </View>
        )}
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
                {ratingDisplay} ({test.reviewsCount})
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

export default memo(MockTestCard);
