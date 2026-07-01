import Placeholder from "@/constants/placeholder";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type HomeContentKind = "course" | "test" | "note";

interface HomeContentItem {
  id: number;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  rating?: number | null;
  ratingsCount?: number;
  thumbnailUrl?: string | null;
  teacherName?: string;
  teacherIsVerified?: boolean;
  examName?: string | null;
  studentsEnrolled?: number;
  totalPurchases?: number;
  views?: number;
}

const KIND_META: Record<
  HomeContentKind,
  {
    placeholder: string;
    href: (item: HomeContentItem) => string;
    statIcon: string;
    stat: (item: HomeContentItem) => string;
  }
> = {
  course: {
    placeholder: Placeholder.COURSE,
    href: (item) => `/course/${item.slug}`,
    statIcon: "eye",
    stat: (item) => {
      const views = item.views ?? 0;
      return `${views} ${views === 1 ? "View" : "Views"}`;
    },
  },
  test: {
    placeholder: Placeholder.TEST,
    href: (item) => `/tests/${item.slug}`,
    statIcon: "users",
    stat: (item) => `${item.studentsEnrolled ?? 0} enrolled`,
  },
  note: {
    placeholder: Placeholder.NOTE,
    href: (item) => `/product/${item.slug}`,
    statIcon: "shopping-bag",
    stat: (item) => `${item.totalPurchases ?? 0} sold`,
  },
};

const formatInr = (amount: number) => amount.toLocaleString("en-IN");

const HomeContentCard = ({
  kind,
  item,
}: {
  kind: HomeContentKind;
  item: HomeContentItem;
}) => {
  const meta = KIND_META[kind];
  const showThumbnail = kind !== "note";
  const isCourse = kind === "course";
  const hasDiscount =
    typeof item.discountPrice === "number" && item.discountPrice < item.price;
  const actualPrice = hasDiscount ? (item.discountPrice as number) : item.price;
  const isFree = actualPrice === 0;
  const discountPercent =
    hasDiscount && item.price > 0
      ? Math.round(((item.price - actualPrice) / item.price) * 100)
      : null;
  const showExam =
    kind === "test" && !!item.examName && item.examName !== "Unspecified";
  const hasRatings = (item.ratingsCount ?? 0) > 0;
  const ratingDisplay =
    typeof item.rating === "number"
      ? Number.isInteger(item.rating)
        ? String(item.rating)
        : item.rating.toFixed(1)
      : null;

  return (
    <TouchableOpacity
      onPress={() => router.push(meta.href(item) as any)}
      activeOpacity={0.9}
      className="w-[172px] bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700/50 shadow-sm shadow-slate-200/60 dark:shadow-none"
    >
      {showThumbnail && (
        <View className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative">
          <Image
            source={{ uri: item.thumbnailUrl || meta.placeholder }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {discountPercent !== null && (
            <View className="absolute top-2 left-2 bg-emerald-500 px-2 py-0.5 rounded-full">
              <Text className="text-white text-[9px] font-black">
                {discountPercent}% OFF
              </Text>
            </View>
          )}

          {!isCourse && (
            <View className="absolute top-2 right-2 bg-white/95 dark:bg-slate-900/90 px-2 py-1 rounded-full">
              {isFree ? (
                <Text className="text-emerald-500 text-[10px] font-black">
                  FREE
                </Text>
              ) : (
                <Text className="text-slate-800 dark:text-white text-[10px] font-black">
                  ₹{formatInr(actualPrice)}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      <View className="p-3">
        {!showThumbnail && (
          <View className="flex-row items-center justify-between mb-2">
            {discountPercent !== null ? (
              <View className="bg-emerald-500 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[9px] font-black">
                  {discountPercent}% OFF
                </Text>
              </View>
            ) : (
              <View />
            )}
            {isFree ? (
              <Text className="text-emerald-500 text-[10px] font-black">
                FREE
              </Text>
            ) : (
              <Text className="text-slate-800 dark:text-white text-[10px] font-black">
                ₹{formatInr(actualPrice)}
              </Text>
            )}
          </View>
        )}
        {showExam && (
          <Text
            className="text-primary text-[9px] font-black uppercase tracking-widest mb-1"
            numberOfLines={1}
          >
            {item.examName}
          </Text>
        )}

        <Text
          className="text-sm font-black text-slate-800 dark:text-white leading-[18px] mb-2 h-9"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View className="flex-row items-center mb-2">
          <Text
            className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex-shrink"
            numberOfLines={1}
          >
            {item.teacherName || "TestKart Expert"}
          </Text>
          {item.teacherIsVerified && (
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
            <Feather name={meta.statIcon as any} size={11} color="#94a3b8" />
            <Text
              className="ml-1 text-slate-400 dark:text-slate-500 text-[10px] font-bold"
              numberOfLines={1}
            >
              {meta.stat(item)}
            </Text>
            {isCourse && hasRatings && (
              <View className="flex-row items-center ml-2">
                <Feather name="star" size={11} color="#F97316" />
                <Text className="ml-1 text-orange-500 text-[10px] font-black">
                  {ratingDisplay}
                </Text>
              </View>
            )}
          </View>
          {isCourse ? (
            <Text
              className={`${isFree ? "text-emerald-500" : "text-slate-800 dark:text-white"} text-[11px] font-black flex-shrink-0`}
            >
              {isFree ? "FREE" : `₹${formatInr(actualPrice)}`}
            </Text>
          ) : (
            typeof item.rating === "number" &&
            item.rating > 0 && (
              <View className="flex-row items-center">
                <Feather name="star" size={11} color="#F97316" />
                <Text className="ml-1 text-orange-500 text-[10px] font-black">
                  {item.rating}
                </Text>
              </View>
            )
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HomeContentCard;
