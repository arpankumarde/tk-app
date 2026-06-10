import Placeholder from "@/constants/placeholder";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export type FeaturedKind = "test" | "course" | "liveTest" | "product";

interface FeaturedItem {
  id: number;
  slug: string;
  thumbnailUrl?: string | null;
  price: number;
  discountPrice?: number | null;
  teacherName?: string;
  teacherIsVerified?: boolean;
}

const KIND_META: Record<
  FeaturedKind,
  {
    label: string;
    icon: string;
    accent: string;
    placeholder: string;
    href: (item: FeaturedItem) => string;
  }
> = {
  test: {
    label: "Mock Test",
    icon: "file-text",
    accent: "#FF8A50",
    placeholder: Placeholder.TEST,
    href: (item) => `/(main)/tests/${item.slug}`,
  },
  course: {
    label: "Course",
    icon: "book",
    accent: "#38BDF8",
    placeholder: Placeholder.COURSE,
    href: (item) => `/(main)/course/${item.slug}`,
  },
  liveTest: {
    label: "Live Test",
    icon: "radio",
    accent: "#FB7185",
    placeholder: Placeholder.LIVE,
    href: (item) => `/live/${item.id}`,
  },
  product: {
    label: "Notes",
    icon: "shopping-bag",
    accent: "#C084FC",
    placeholder: Placeholder.NOTE,
    href: (item) => `/product/${item.slug}`,
  },
};

const formatInr = (amount: number) => amount.toLocaleString("en-IN");

const FeaturedBannerCard = ({
  kind,
  item,
}: {
  kind: FeaturedKind;
  item: FeaturedItem;
}) => {
  const meta = KIND_META[kind];
  const hasDiscount =
    typeof item.discountPrice === "number" && item.discountPrice < item.price;
  const actualPrice = hasDiscount ? (item.discountPrice as number) : item.price;
  const isFree = actualPrice === 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(meta.href(item) as any)}
      activeOpacity={0.92}
      className="mx-4 rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800"
    >
      <View className="w-full aspect-[16/9]">
        <Image
          source={{ uri: item.thumbnailUrl || meta.placeholder }}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Type tag */}
        <View className="absolute top-4 left-4 flex-row items-center bg-black/50 px-3 py-1.5 rounded-full">
          <Feather name={meta.icon as any} size={11} color={meta.accent} />
          <Text
            className="ml-1.5 text-[10px] font-black uppercase tracking-widest"
            style={{ color: meta.accent }}
          >
            {meta.label}
          </Text>
        </View>

        {/* Publisher + price bar */}
        <View className="absolute bottom-0 left-0 right-0 bg-black/55 px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <Text className="text-white/90 text-xs font-bold" numberOfLines={1}>
              {item.teacherName || "TestKart Expert"}
            </Text>
            {item.teacherIsVerified && (
              <MaterialIcons
                name="verified"
                size={13}
                color="#22C55E"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          <View className="flex-row items-center">
            {hasDiscount && (
              <Text className="text-white/50 line-through text-[10px] mr-1.5">
                ₹{formatInr(item.price)}
              </Text>
            )}
            {isFree ? (
              <Text className="text-emerald-400 font-black text-sm">FREE</Text>
            ) : (
              <Text className="text-white font-black text-sm">
                ₹{formatInr(actualPrice)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedBannerCard;
