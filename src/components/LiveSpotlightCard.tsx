import BlinkingDot from "@/components/BlinkingDot";
import { useCountdown } from "@/hooks/useCountdown";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface LiveSpotlightItem {
  id: number;
  title: string;
  price: number;
  startTime: string;
  endTime: string;
  enrolledCount: number;
  examName?: string | null;
  teacherName?: string;
  teacherAvatarUrl?: string | null;
  teacherIsVerified?: boolean;
  teacherTagline?: string | null;
}

const LiveSpotlightCard = ({ item }: { item: LiveSpotlightItem }) => {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startMs = new Date(item.startTime).getTime();
  const endMs = new Date(item.endTime).getTime();
  const isEnded = now !== null && endMs < now;
  const isLive = now !== null && !isEnded && startMs <= now;

  const timeLeft = useCountdown(isLive ? item.endTime : item.startTime);
  const countdownText = isEnded
    ? "Ended"
    : timeLeft
      ? `${isLive ? "Ends in" : "Starts in"} ${timeLeft}`
      : isLive
        ? "Live now"
        : "";

  const teacherName = item.teacherName || "TestKart Expert";
  const avatarUri =
    item.teacherAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherName)}&background=FF8A50&color=fff`;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/live/${item.id}` as any)}
      activeOpacity={0.92}
      className="mx-4 mb-3 rounded-3xl overflow-hidden bg-slate-900"
    >
      {/* Signature target-ring motif — no thumbnail exists for live spotlight items,
          so the card leans on a decorative aim/precision motif instead of a photo. */}
      <View
        pointerEvents="none"
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-[16px] border-primary/10"
      />
      <View
        pointerEvents="none"
        className="absolute -right-3 -top-3 w-24 h-24 rounded-full border-[10px] border-primary/20"
      />

      <View className="p-5">
        <View className="flex-row items-center justify-between mb-5">
          {isLive ? (
            <View className="flex-row items-center bg-red-500 px-3 py-1.5 rounded-full">
              <BlinkingDot />
              <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                Live Now
              </Text>
            </View>
          ) : isEnded ? (
            <View className="flex-row items-center bg-slate-700 px-3 py-1.5 rounded-full">
              <Feather
                name="check-circle"
                size={10}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                Ended
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center bg-blue-500 px-3 py-1.5 rounded-full">
              <Feather
                name="clock"
                size={10}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                Upcoming
              </Text>
            </View>
          )}

          {item.examName && (
            <View className="bg-white/10 px-3 py-1.5 rounded-full">
              <Text
                className="text-white/70 text-[10px] font-black uppercase tracking-widest"
                numberOfLines={1}
              >
                {item.examName}
              </Text>
            </View>
          )}
        </View>

        <Text
          className="text-2xl font-black text-white leading-8 mb-5 h-16"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/15 mr-3">
            <Image
              source={{ uri: avatarUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-sm" numberOfLines={1}>
                {teacherName}
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
            <View className="h-4 justify-center">
              {!!item.teacherTagline && (
                <Text
                  className="text-white/50 text-xs font-medium"
                  numberOfLines={1}
                >
                  {item.teacherTagline}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-white/10">
          <View className="flex-row items-center">
            <Feather name="clock" size={13} color="#FF8A50" />
            <Text className="ml-1.5 text-white/80 text-xs font-bold">
              {countdownText}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Feather name="users" size={13} color="#FF8A50" />
            <Text className="ml-1.5 text-white/80 text-xs font-bold">
              {item.enrolledCount} enrolled
            </Text>
          </View>
          {item.price === 0 ? (
            <Text className="text-emerald-400 font-black text-base">FREE</Text>
          ) : (
            <Text className="text-white font-black text-base">
              ₹{item.price}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveSpotlightCard;
