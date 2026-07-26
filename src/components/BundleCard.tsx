import Placeholder from "@/constants/placeholder";
import type { BundleListItem } from "@/types/bundle";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface BundleCardProps {
  bundle: BundleListItem;
  /** "rail" is the compact variant used in horizontal home rails. */
  variant?: "list" | "rail";
}

const formatInr = (amount: number) =>
  Math.round(amount).toLocaleString("en-IN");

export const bundleSavings = (price: number, originalPrice: number) => {
  const savings = Math.max(0, (originalPrice || 0) - (price || 0));
  const percent =
    originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
  return { savings, percent };
};

const BundleCard = ({ bundle, variant = "list" }: BundleCardProps) => {
  const displayImage = bundle.thumbnailUrl || Placeholder.COURSE;
  const isFree = (bundle.price ?? 0) === 0;
  const { savings, percent } = bundleSavings(
    bundle.price,
    bundle.originalPrice,
  );
  const discountPercent = Math.round(bundle.discountPercentage ?? percent);
  const showDiscount = discountPercent > 0 && savings > 0;
  const itemCount = bundle.itemCount ?? 0;
  const itemLabel = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  const displayAuthor = bundle.teacherName || "TestKart Expert";
  const teacherInitials =
    displayAuthor
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "TE";

  const handlePress = () => {
    router.push(`/bundles/${bundle.slug}` as any);
  };

  if (variant === "rail") {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        className="w-[172px] bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700/50 shadow-sm shadow-slate-200/60 dark:shadow-none"
      >
        <View className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative">
          <Image
            source={{ uri: displayImage }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {showDiscount && (
            <View className="absolute top-2 left-2 bg-emerald-500 px-2 py-0.5 rounded-full">
              <Text className="text-white text-[9px] font-black">
                {discountPercent}% OFF
              </Text>
            </View>
          )}

          <View className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/90 px-2 py-1 rounded-full">
            {isFree ? (
              <Text className="text-emerald-500 text-[10px] font-black">
                FREE
              </Text>
            ) : (
              <Text className="text-slate-800 dark:text-white text-[10px] font-black">
                ₹{formatInr(bundle.price)}
              </Text>
            )}
          </View>
        </View>

        <View className="p-3">
          <Text className="text-primary text-[9px] font-black uppercase tracking-widest mb-1">
            Bundle
          </Text>

          <Text
            className="text-sm font-black text-slate-800 dark:text-white leading-[18px] mb-2 h-9"
            numberOfLines={2}
          >
            {bundle.title}
          </Text>

          <View className="flex-row items-center mb-2">
            <Text
              className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex-shrink"
              numberOfLines={1}
            >
              {displayAuthor}
            </Text>
            {bundle.teacherIsVerified && (
              <MaterialIcons
                name="verified"
                size={11}
                color="#22C55E"
                style={{ marginLeft: 3 }}
              />
            )}
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-shrink">
              <Feather name="layers" size={11} color="#94a3b8" />
              <Text
                className="ml-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold"
                numberOfLines={1}
              >
                {itemLabel}
              </Text>
            </View>
            {savings > 0 && (
              <Text className="text-emerald-500 text-[10px] font-black flex-shrink-0">
                Save ₹{formatInr(savings)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      {/* Post Header: teacher avatar + name */}
      <View className="flex-row items-center px-5 pt-4 pb-3">
        <View className="w-9 h-9 rounded-full bg-orange-50 dark:bg-slate-700 items-center justify-center overflow-hidden mr-3">
          <Text className="text-primary text-xs font-black">
            {teacherInitials}
          </Text>
        </View>
        <View className="flex-row items-center flex-1">
          <Text
            className="text-slate-800 dark:text-white font-bold text-sm"
            numberOfLines={1}
          >
            {displayAuthor}
          </Text>
          {bundle.teacherIsVerified && (
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
        {bundle.title}
      </Text>

      {/* Thumbnail */}
      <View className="aspect-video relative bg-gray-100 dark:bg-slate-900">
        <Image
          source={{ uri: displayImage }}
          className="w-full h-full"
          resizeMode="cover"
        />

        <View className="absolute top-3 left-3 flex-row items-center px-3 py-1.5 bg-slate-900/85 rounded-full shadow-sm">
          <Feather name="layers" size={10} color="#FF8A50" />
          <Text className="ml-1.5 text-white text-[10px] font-black uppercase tracking-wider">
            Bundle · {itemLabel}
          </Text>
        </View>

        {showDiscount && (
          <View className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 rounded-full shadow-sm">
            <Text className="text-white text-[10px] font-black">
              {discountPercent}% OFF
            </Text>
          </View>
        )}
      </View>

      {/* Footer: savings (left) — price (right) */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center">
          <Feather name="tag" size={13} color="#94a3b8" />
          <Text className="ml-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold">
            {savings > 0 ? `You save ₹${formatInr(savings)}` : "Bundle deal"}
          </Text>
        </View>

        <View className="flex-row items-baseline">
          {!isFree && savings > 0 && (
            <Text className="mr-2 text-slate-400 dark:text-slate-500 text-xs font-bold line-through">
              ₹{formatInr(bundle.originalPrice)}
            </Text>
          )}
          <Text
            className={`${isFree ? "text-emerald-500" : "text-primary"} text-lg font-black`}
          >
            {isFree ? "FREE" : `₹${formatInr(bundle.price)}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(BundleCard);
