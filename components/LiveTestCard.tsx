import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCountdown } from "@/hooks/useCountdown";
import BlinkingDot from "@/components/BlinkingDot";
import type { LiveTest } from "@/app/(main)/live/index";
import Placeholder from "@/constants/placeholder";

const LiveTestCard = ({
  test,
  colorScheme,
}: {
  test: LiveTest;
  colorScheme: "light" | "dark" | undefined;
}) => {
  const isLive =
    test.status?.toLowerCase().includes("live") ||
    (new Date(test.startTime) <= new Date() &&
      new Date(test.endTime) >= new Date());

  const isDeadlineActive =
    test.registrationDeadline &&
    new Date(test.registrationDeadline).getTime() > Date.now();

  const countdownTarget = isDeadlineActive
    ? test.registrationDeadline
    : test.endTime;

  const timeLeft = useCountdown(countdownTarget);
  const countdownLabel = isDeadlineActive ? "Registration Closes In" : "Ends In";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/live/${test.id}` as any)}
      activeOpacity={0.9}
      className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50"
    >
      <View>
        {/* Thumbnail with floating badges */}
        <View className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900">
          <Image
            source={{
              uri:
                test.thumbnailUrl || Placeholder.LIVE,
            }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Floating Status Badge */}
          <View className="absolute top-4 left-4">
            {isLive ? (
              <View className="bg-red-500 px-3 py-1 rounded-full flex-row items-center border border-red-400 shadow-lg">
                <BlinkingDot />
                <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                  LIVE
                </Text>
              </View>
            ) : (
              <View className="bg-blue-500 px-3 py-1 rounded-full flex-row items-center border border-blue-400 shadow-lg">
                <Feather name="clock" size={10} color="white" style={{ marginRight: 4 }} />
                <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                  UPCOMING
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Content Section */}
        <View className="p-4">
          {/* Pills Row at Top of Content */}
          <View className="flex-row items-center mb-3">
            <View className="bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-full border border-orange-100/50 dark:border-orange-800/40">
              <Text
                className="text-primary text-[10px] font-black uppercase tracking-widest"
                numberOfLines={1}
              >
                {test.examSlug?.replace(/-/g, " ").toUpperCase() || "MOCK TEST"}
              </Text>
            </View>
            <View className="ml-2.5 bg-cyan-50 dark:bg-cyan-950/20 px-3 py-1.5 rounded-full border border-cyan-100/50 dark:border-cyan-800/40">
              <Text className="text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase tracking-widest">
                {test.language?.toUpperCase() || "ENGLISH"}
              </Text>
            </View>
          </View>

          <Text
            className="text-[17px] font-extrabold text-slate-800 dark:text-white mb-1.5 leading-6"
            numberOfLines={2}
          >
            {test.title}
          </Text>

          {/* Author & Rating Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                By:{" "}
                <Text className="text-slate-600 dark:text-slate-300 font-bold">
                  {test.teacherName}
                </Text>
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

            <View className="flex-row items-center bg-orange-50 dark:bg-slate-700/40 px-2.5 py-1 rounded-lg border border-orange-100 dark:border-slate-600/60">
              <MaterialIcons name="star" size={12} color="#F97316" />
              <Text className="ml-1 text-orange-500 font-black text-xs">
                {test.rating || "5.0"}
              </Text>
              {test.reviewsCount !== undefined && (
                <Text className="ml-1 text-slate-400 dark:text-slate-500 font-bold text-[10px]">
                  ({test.reviewsCount})
                </Text>
              )}
            </View>
          </View>

          {/* Grid Icon Stats (2x2) */}
          <View className="flex-row flex-wrap mb-4">
            <View className="w-1/2 flex-row items-center mb-4 pr-2">
              <Feather
                name="file-text"
                size={14}
                color="#F97316"
                style={{ top: -1 }}
              />
              <Text className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-1">
                {test.actualQuestionCount} Questions
              </Text>
            </View>
            <View className="w-1/2 flex-row items-center mb-4">
              <Feather
                name="clock"
                size={14}
                color="#F97316"
                style={{ top: -1 }}
              />
              <Text className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-1">
                {test.durationMinutes} Minutes
              </Text>
            </View>
            <View className="w-1/2 flex-row items-center pr-2">
              <Feather
                name="book-open"
                size={14}
                color="#F97316"
                style={{ top: -1 }}
              />
              <Text className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-1">
                {test.subjects}
              </Text>
            </View>
            <View className="w-1/2 flex-row items-center">
              <Feather
                name="users"
                size={14}
                color="#F97316"
                style={{ top: -1 }}
              />
              <Text className="ml-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-1">
                {test.enrolledCount} Enrolled
              </Text>
            </View>
          </View>

          {/* Countdown Highlighter */}
          {timeLeft && (
            <View className="bg-orange-50 dark:bg-orange-950/30 px-4 py-3.5 rounded-xl border border-orange-100 dark:border-orange-900/30 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2" />
                <Text className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                  {countdownLabel}:
                </Text>
              </View>
              <Text className="text-orange-500 dark:text-orange-300 font-black text-sm">
                {timeLeft}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveTestCard;
