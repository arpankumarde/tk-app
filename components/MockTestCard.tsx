import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAddToCart } from "@/hooks/useAddToCart";

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
  const isFree = (test.discountPrice ?? test.price) === 0;
  const { addToCart, adding } = useAddToCart();

  const handlePress = () => {
    router.push(`/(main)/tests/${test.slug}` as any);
  };

  const displayImage =
    test.thumbnailUrl ||
    "https://ik.imagekit.io/testkart/placeholders/Mock%20Test.jpg";
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
      activeOpacity={0.9}
      className="bg-white dark:bg-slate-900 rounded-[32px] mx-5 mb-8 p-3.5 border border-gray-100 dark:border-slate-800"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 4,
      }}
    >
      <View>
        {/* Top Badges Row */}
        <View className="flex-row justify-between mb-2.5 px-1">
          <View className="bg-orange-50 dark:bg-orange-950/30 px-3.5 py-1.5 rounded-full border border-orange-100/50 dark:border-orange-900/30 max-w-[60%]">
            <Text
              className="text-orange-500 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest"
              numberOfLines={1}
            >
              {displaySubject}
            </Text>
          </View>
          <View className="bg-cyan-50 dark:bg-cyan-950/30 px-3.5 py-1.5 rounded-full border border-cyan-100/50 dark:border-cyan-900/30">
            <Text className="text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase tracking-widest">
              {test.language?.trim() || "ENGLISH"}
            </Text>
          </View>
        </View>

        {/* Thumbnail with floating action */}
        <View className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-4">
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute bottom-4 right-4 bg-orange-500/90 w-11 h-11 rounded-2xl items-center justify-center shadow-lg">
            <Feather name="plus" size={24} color="white" />
          </View>
        </View>

        {/* Content Section */}
        <View className="px-1.5">
          <Text
            className="text-[22px] font-black text-slate-800 dark:text-white mb-2 leading-tight"
            numberOfLines={2}
          >
            {test.title}
          </Text>

          {/* Author & Rating Row */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center flex-1">
              <Text className="text-slate-400 dark:text-slate-500 text-sm font-bold">
                By:{" "}
              </Text>
              <Text
                className="text-slate-600 dark:text-slate-300 text-sm font-black flex-1"
                numberOfLines={1}
              >
                {displayAuthor}
              </Text>
              <MaterialIcons
                name="verified"
                size={16}
                color="#22C55E"
                style={{ marginLeft: 4 }}
              />
            </View>
            
            <View className="flex-row items-center ml-4">
              <MaterialIcons name="star-outline" size={16} color="#F97316" />
              <Text className="ml-1 text-orange-500 font-black text-sm">
                {test.rating || "5.0"}
              </Text>
              <Text className="ml-1 text-slate-400 text-xs">
                ({test.reviewsCount || 0} {test.reviewsCount === 1 ? "Review" : "Reviews"})
              </Text>
            </View>
          </View>

          {/* Vertical Icon Stats */}
          <View className="gap-y-3 mb-6">
            <View className="flex-row items-center">
              <Feather name="file-text" size={17} color="#F97316" />
              <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
                Questions:{" "}
                <Text className="text-slate-800 dark:text-white font-black">
                  {test.actualQuestionCount || 0}
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center">
              <Feather name="clock" size={17} color="#F97316" />
              <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
                Total Time:{" "}
                <Text className="text-slate-800 dark:text-white font-black">
                  {test.durationMinutes || 0} Minutes
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center">
              <Feather name="trending-up" size={17} color="#F97316" />
              <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
                Test Items:{" "}
                <Text className="text-slate-800 dark:text-white font-black">
                  {test.totalTests || 0}
                </Text>
              </Text>
            </View>

            <View className="flex-row items-center">
              <Feather name="users" size={17} color="#F97316" />
              <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
                Students Enrolled:{" "}
                <Text className="text-slate-800 dark:text-white font-black">
                  {test.studentsEnrolled || 0}
                </Text>
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-slate-50 dark:bg-slate-800 mb-6" />

          {/* Footer: CTA + Price Row */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={async () => {
                if (isFree) {
                  router.push(`/tests/${test.slug}` as any);
                } else {
                  const result = await addToCart(test.id, "test");
                  if (result.success) {
                    router.push("/(user)/cart" as any);
                  }
                }
              }}
              disabled={adding}
              className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-orange-500 shadow-orange-500/40"} flex-row items-center px-6 py-3.5 rounded-xl shadow-lg w-48 mr-4`}
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

            <View className="items-end">
              <View className="flex-row items-center">
                {originalPrice && (
                  <Text className="text-slate-400 line-through text-xs mr-2">
                    ₹{originalPrice}
                  </Text>
                )}
                {actualPrice === 0 ? (
                  <Text className="text-3xl font-black text-emerald-500">FREE</Text>
                ) : (
                  <Text className="text-3xl font-black text-orange-500">
                    ₹{actualPrice}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MockTestCard;
