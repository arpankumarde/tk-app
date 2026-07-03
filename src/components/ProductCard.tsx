import { memo } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    slug: string;
    price: number;
    category?: string;
    teacherName?: string;
    teacherAvatar?: string | null;
    teacherIsVerified?: boolean;
    rating?: number | null;
    ratingsCount?: number;
    views?: number;
  };
}

const formatInr = (amount: number) => amount.toLocaleString("en-IN");

const ProductCard = ({ product }: ProductCardProps) => {
  const isFree = (product.price ?? 0) === 0;
  const hasRatings = (product.ratingsCount ?? 0) > 0;
  const ratingDisplay =
    typeof product.rating === "number"
      ? Number.isInteger(product.rating)
        ? String(product.rating)
        : product.rating.toFixed(1)
      : null;
  const displayAuthor = product.teacherName || "TestKart Expert";
  const teacherInitials =
    displayAuthor
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TE";
  const views = product.views || 0;

  const handlePress = () => {
    router.push(`/product/${product.slug}` as any);
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
          {product.teacherAvatar ? (
            <Image
              source={{ uri: product.teacherAvatar }}
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
          {product.teacherIsVerified && (
            <MaterialIcons
              name="verified"
              size={14}
              color="#22C55E"
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>

      {!!product.category && (
        <View className="self-start ml-5 mb-2 px-3 py-1 bg-orange-50 dark:bg-slate-700/50 rounded-full">
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
            {product.category}
          </Text>
        </View>
      )}

      {/* Title */}
      <Text
        className="text-lg font-black text-slate-800 dark:text-white px-5 mb-4 leading-6"
        numberOfLines={2}
      >
        {product.title}
      </Text>

      {/* Footer: views / rating (left) — price (right) */}
      <View className="flex-row items-center justify-between px-5 py-4 border-t border-gray-50 dark:border-slate-700/50">
        <View className="flex-row items-center">
          <Feather name="eye" size={13} color="#94a3b8" />
          <Text className="ml-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold">
            {views} {views === 1 ? "View" : "Views"}
          </Text>

          {hasRatings && (
            <View className="flex-row items-center ml-3">
              <Feather name="star" size={13} color="#F59E0B" />
              <Text className="ml-1 text-amber-600 dark:text-amber-500 text-xs font-black">
                {ratingDisplay} ({product.ratingsCount})
              </Text>
            </View>
          )}
        </View>

        <Text
          className={`${isFree ? "text-emerald-500" : "text-primary"} text-lg font-black`}
        >
          {isFree ? "FREE" : `₹${formatInr(product.price)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default memo(ProductCard);
