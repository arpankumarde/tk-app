import type { LiveTest } from "@/app/(main)/live/index";
import BlinkingDot from "@/components/BlinkingDot";
import Placeholder from "@/constants/placeholder";
import { useCountdown } from "@/hooks/useCountdown";
import { useNow } from "@/hooks/useNow";
import Feather from "@react-native-vector-icons/feather";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

const LiveTestCard = ({
  test,
  colorScheme,
}: {
  test: LiveTest;
  colorScheme: "light" | "dark" | undefined;
}) => {
  const normalizedStatus = test.status?.trim().toLowerCase() || "";
  const now = useNow();
  const startTimeMs = new Date(test.startTime).getTime();
  const endTimeMs = new Date(test.endTime).getTime();

  const isEnded =
    normalizedStatus.includes("ended") ||
    normalizedStatus.includes("completed") ||
    endTimeMs < now;

  const isLive =
    !isEnded &&
    (normalizedStatus.includes("live") ||
      (startTimeMs <= now && endTimeMs >= now));

  const isDeadlineActive =
    test.registrationDeadline &&
    new Date(test.registrationDeadline).getTime() > now;

  const countdownTarget = isDeadlineActive
    ? test.registrationDeadline
    : test.endTime;

  const timeLeft = useCountdown(countdownTarget);
  const countdownLabel = isDeadlineActive
    ? "Registration Closes In"
    : "Ends In";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/live/${test.slug}` as any)}
      activeOpacity={0.9}
      className="bg-white dark:bg-night-raised rounded-2xl overflow-hidden mb-6 shadow-xl dark:shadow-none border border-line dark:border-night-line"
    >
      <View>
        {/* Thumbnail with floating badges */}
        <View className="relative w-full aspect-video bg-sand dark:bg-night">
          <Image
            source={{
              uri: test.thumbnailUrl || Placeholder.LIVE,
            }}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Floating Status Badge */}
          <View className="absolute top-4 left-4">
            {isLive ? (
              <View className="bg-red-500 px-3 py-1 rounded-full flex-row items-center border border-red-400 shadow-lg">
                <BlinkingDot />
                <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">
                  LIVE
                </Text>
              </View>
            ) : isEnded ? (
              <View className="bg-ink px-3 py-1 rounded-full flex-row items-center border border-ink-soft shadow-lg">
                <Feather
                  name="check-circle"
                  size={10}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">
                  ENDED
                </Text>
              </View>
            ) : (
              <View className="bg-sky px-3 py-1 rounded-full flex-row items-center border border-sky shadow-lg">
                <Feather
                  name="clock"
                  size={10}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">
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
            <View className="bg-clay-tint dark:bg-night-raised px-3 py-1.5 rounded-full border border-line/50 dark:border-night-line">
              <Text
                className="text-primary-deep dark:text-primary text-[10px] font-extrabold uppercase tracking-widest"
                numberOfLines={1}
              >
                {test.examSlug?.replace(/-/g, " ").toUpperCase() || "MOCK TEST"}
              </Text>
            </View>
            <View className="ml-2.5 bg-sky-tint dark:bg-night-raised px-3 py-1.5 rounded-full border border-line dark:border-night-line">
              <Text className="text-sky dark:text-sky-light font-extrabold text-[10px] uppercase tracking-widest">
                {test.language?.toUpperCase() || "ENGLISH"}
              </Text>
            </View>
          </View>

          <Text
            className="text-[17px] font-extrabold text-ink dark:text-white mb-1.5 leading-6"
            numberOfLines={2}
          >
            {test.title}
          </Text>

          {/* Author & Rating Row */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <Text className="text-ink-soft dark:text-night-soft text-sm font-medium">
                By:{" "}
                <Text className="text-ink-soft dark:text-night-soft font-bold">
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

            <View className="flex-row items-center bg-clay-tint dark:bg-night-line/40 px-2.5 py-1 rounded-lg border border-line dark:border-night-line/60">
              <Feather name="star" size={12} color="#F97316" />
              <Text className="ml-1 text-primary-deep dark:text-primary font-extrabold text-xs">
                {test.rating || "5.0"}
              </Text>
              {test.reviewsCount !== undefined && (
                <Text className="ml-1 text-ink-soft dark:text-night-soft font-bold text-[10px]">
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
              <Text className="ml-2 text-xs font-bold text-ink-soft dark:text-night-soft flex-1">
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
              <Text className="ml-2 text-xs font-bold text-ink-soft dark:text-night-soft flex-1">
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
              <Text className="ml-2 text-xs font-bold text-ink-soft dark:text-night-soft flex-1">
                {test.subjects}
              </Text>
            </View>
          </View>

          {/* Countdown Highlighter */}
          {timeLeft && (
            <View className="bg-clay-tint dark:bg-night-raised px-4 py-3.5 rounded-xl border border-line dark:border-night-line flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather
                  name="clock"
                  size={14}
                  color="#F97316"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                  {countdownLabel}:
                </Text>
              </View>
              <Text className="text-orange-500 dark:text-orange-300 font-extrabold text-sm">
                {timeLeft}
              </Text>
            </View>
          )}

          <View
            className={`h-12 rounded-xl flex-row items-center justify-center ${timeLeft ? "mt-3" : ""} ${
              test.hasAttempted
                ? "bg-ink-soft dark:bg-night-line"
                : test.isEnrolled && isLive
                  ? "bg-emerald-500"
                  : isEnded ||
                      (!test.isEnrolled && test.enrolledCount >= test.maxSeats)
                    ? "bg-line dark:bg-night-line"
                    : test.isEnrolled
                      ? "bg-emerald-500"
                      : test.price === 0
                        ? "bg-emerald-500"
                        : "bg-primary-deep"
            }`}
          >
            <Feather
              name={
                test.hasAttempted
                  ? "check-circle"
                  : test.isEnrolled && isLive
                    ? "play-circle"
                    : isEnded ||
                        (!test.isEnrolled &&
                          test.enrolledCount >= test.maxSeats)
                      ? "x-circle"
                      : test.isEnrolled
                        ? "check-circle"
                        : "zap"
              }
              size={16}
              color="white"
            />
            <Text className="text-white text-sm font-extrabold ml-2">
              {test.hasAttempted
                ? "Already Attempted"
                : test.isEnrolled && isLive
                  ? "Start Test"
                  : isEnded
                    ? "Enrollment Closed"
                    : !test.isEnrolled && test.enrolledCount >= test.maxSeats
                      ? "Registration Closed"
                      : test.isEnrolled
                        ? "Already Enrolled"
                        : test.price === 0
                          ? "Enroll for Free"
                          : `Enroll for ₹${test.price}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default LiveTestCard;
