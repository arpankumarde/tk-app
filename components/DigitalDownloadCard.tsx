import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useAddToCart } from "@/hooks/useAddToCart";

interface DigitalDownloadCardProps {
  product: {
    id: number;
    title: string;
    slug: string;
    price: number;
    thumbnailUrl: string | null;
    category: string;
    totalPurchases: number;
    teacherName: string;
    teacherAvatar: string | null;
    teacherIsVerified: boolean;
  };
}

const DigitalDownloadCard = ({ product }: DigitalDownloadCardProps) => {
  const { colorScheme } = useColorScheme();
  const isFree = (product.price ?? 0) === 0;
  const { addToCart, adding } = useAddToCart();

  const displayImage = product.thumbnailUrl || undefined;
  const displayAuthor = product.teacherName || "TestKart Expert";
  const displayCategory = product.category || "Study Material";
  const displayPrice = product.price ?? 0;
  const displaySales = product.totalPurchases || 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/shop?slug=${product.slug}` as any)}
      className="bg-white dark:bg-slate-800 rounded-[32px] mx-5 mb-5 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      <View className="p-4">
        {/* Category Badge */}
        <View className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full border border-gray-100 dark:border-slate-700/50 shadow-sm">
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
            {displayCategory}
          </Text>
        </View>

        {/* Image / Thumbnail Container */}
        <View className="w-full h-[240px] bg-slate-50 dark:bg-slate-900 rounded-[24px] overflow-hidden mb-5">
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <View className="px-1 pb-2">
          <Text
            className="text-xl font-black text-slate-800 dark:text-white mb-4 leading-tight"
            numberOfLines={2}
          >
            {product.title}
          </Text>

          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 mr-3 items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
              <Image
                source={{
                  uri:
                    product.teacherAvatar ||
                    `https://ui-avatars.com/api/?name=${displayAuthor}&background=random`,
                }}
                className="w-full h-full"
              />
            </View>
            <View className="flex-row items-center">
              <Text className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                {displayAuthor}
              </Text>
              {product.teacherIsVerified && (
                <MaterialIcons name="verified" size={16} color="#22C55E" className="ml-1" />
              )}
            </View>
          </View>

          <View className="flex-row items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700/50">
            <TouchableOpacity
              onPress={async () => {
                if (isFree) {
                  router.push(`/shop?slug=${product.slug}` as any);
                } else {
                  const result = await addToCart(product.id, "digitalProduct");
                  if (result.success) {
                    router.push("/(user)/cart" as any);
                  }
                }
              }}
              disabled={adding}
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
              {isFree ? "Free" : `₹${product.price}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default DigitalDownloadCard;
