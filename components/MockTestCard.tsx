import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

interface MockTestCardProps {
  test: {
    id: number;
    title: string;
    slug: string;
    creatorName: string;
    thumbnailUrl: string | null;
    subject?: string | null;
    language?: string | null;
    actualQuestionCount?: string | number;
    durationMinutes?: string | number;
    totalTests?: number;
    freeTestsCount?: number;
    studentsEnrolled?: number;
    price: number;
    discountPrice?: number | null;
    rating?: number | null;
    reviewsCount?: number;
    examName?: string;
    teacherName?: string;
  };
}

const MockTestCard = ({ test }: MockTestCardProps) => {
  const { colorScheme } = useColorScheme();

  const handlePress = () => {
    router.push(`/(main)/tests/${test.slug}` as any);
  };

  const displayImage =
    test.thumbnailUrl ||
    "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png";
  const displayAuthor =
    test.teacherName || test.creatorName || "TestKart Expert";

  const actualPrice = test.discountPrice ?? test.price;
  const originalPrice = test.discountPrice ? test.price : null;
  const discountPercent = originalPrice
    ? Math.round(((originalPrice - actualPrice) / originalPrice) * 100)
    : null;

  // Handle subject which might be "[]" string
  let displaySubject = test.examName || "Mock Test";
  if (test.subject && test.subject !== "[]") {
    displaySubject = test.subject;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      className="bg-white dark:bg-slate-800 rounded-[32px] mx-5 mb-6 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      <View className="p-4">
        {/* Badges */}
        <View
          className="flex-row items-center justify-between mb-3"
          style={{ gap: 8 }}
        >
          <View className="max-w-[72%] px-4 py-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-full border border-orange-100 dark:border-orange-800/30">
            <Text
              className="text-primary text-[10px] font-black uppercase tracking-widest"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {displaySubject}
            </Text>
          </View>

          <View className="max-w-[34%] px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/30 rounded-full border border-cyan-100 dark:border-cyan-800/30">
            <Text
              className="text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {test.language?.trim() || "English"}
            </Text>
          </View>
        </View>

        {/* Thumbnail with floating action */}
        <View className="relative w-full h-[220px] rounded-[24px] overflow-hidden bg-slate-100 dark:bg-slate-900 mb-4">
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-2xl items-center justify-center shadow-lg shadow-orange-500/40"
            onPress={() => router.push(`/(main)/tests/${test.slug}` as any)}
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="px-1">
          <Text
            className="text-xl font-black text-slate-800 dark:text-white mb-2 leading-tight"
            numberOfLines={2}
          >
            {test.title}
          </Text>

          <View className="flex-row items-center mb-4">
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              By: {displayAuthor}
            </Text>
            <View className="ml-2 w-4 h-4 bg-orange-500 rounded-full items-center justify-center">
              <Feather name="check" size={10} color="white" />
            </View>
            <View className="flex-row items-center ml-auto">
              <Feather name="star" size={14} color="#f59e0b" fill="#f59e0b" />
              <Text className="ml-1 text-amber-500 font-bold text-sm">
                {test.rating || "5.0"}
              </Text>
              <Text className="ml-1 text-slate-400 dark:text-slate-500 text-xs">
                ({test.reviewsCount || 0} reviews)
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View className="space-y-2.5 mb-6">
            <View className="flex-row items-center">
              <View className="w-6">
                <Feather name="file-text" size={16} color="#FF8A50" />
              </View>
              <Text className="text-slate-600 dark:text-slate-300 font-bold flex-1">
                Questions:{" "}
                <Text className="font-black text-slate-800 dark:text-white">
                  {test.actualQuestionCount || 0}
                </Text>
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6">
                <Feather name="clock" size={16} color="#FF8A50" />
              </View>
              <Text className="text-slate-600 dark:text-slate-300 font-bold flex-1">
                Total Time:{" "}
                <Text className="font-black text-slate-800 dark:text-white">
                  {test.durationMinutes || 0} Minutes
                </Text>
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6">
                <Feather name="trending-up" size={16} color="#FF8A50" />
              </View>
              <Text className="text-slate-600 dark:text-slate-300 font-bold flex-1">
                Test Items:{" "}
                <Text className="font-black text-slate-800 dark:text-white">
                  {test.totalTests || 0}
                </Text>
                {test.freeTestsCount && test.freeTestsCount > 0 ? (
                  <Text className="text-green-500 ml-1">
                    {" "}
                    ({test.freeTestsCount} Free Test)
                  </Text>
                ) : null}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-6">
                <Feather name="users" size={16} color="#FF8A50" />
              </View>
              <Text className="text-slate-600 dark:text-slate-300 font-bold flex-1">
                Students Enrolled:{" "}
                <Text className="font-black text-slate-800 dark:text-white">
                  {test.studentsEnrolled || 0}
                </Text>
              </Text>
            </View>
          </View>

          {/* Price & CTA */}
          <View className="flex-row items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700/50">
            <TouchableOpacity
              className="bg-primary flex-row items-center px-8 py-4 rounded-2xl shadow-lg shadow-orange-500/30 grow mr-4"
              onPress={() => router.push(`/tests/${test.slug}` as any)}
            >
              <Feather name="shopping-cart" size={20} color="white" />
              <Text className="ml-2 text-white font-black text-lg">
                Buy Now
              </Text>
            </TouchableOpacity>

            <View className="items-end">
              <View className="flex-row items-center mb-1">
                {originalPrice && (
                  <>
                    <Text className="text-slate-400 dark:text-slate-500 line-through text-base mr-2">
                      ₹ {originalPrice}
                    </Text>
                    <View className="bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                      <Text className="text-green-600 dark:text-green-400 font-black text-[10px]">
                        {discountPercent}% OFF
                      </Text>
                    </View>
                  </>
                )}
              </View>
              {actualPrice === 0 ? (
                <Text className="text-3xl font-black text-green-500">FREE</Text>
              ) : (
                <Text className="text-3xl font-black text-primary">
                  ₹ {actualPrice}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MockTestCard;
