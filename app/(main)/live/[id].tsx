import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Share,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useCountdown } from "@/hooks/useCountdown";
import Header from "@/components/Header";
import BlinkingDot from "@/components/BlinkingDot";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface SocialLinks {
  twitter: string;
  youtube: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

interface AwardCertificate {
  title: string;
  description: string;
}

interface TeacherProfile {
  id: number;
  name: string;
  avatarUrl: string | null;
  bio: string;
  websiteUrl: string;
  socialLinks: SocialLinks;
  awardsCertificates: AwardCertificate[];
  publicPhone: string;
  publicEmail: string;
  academyName: string | null;
  slug: string;
}

interface MockTestDetails {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  subject: string;
  firstTestItemId: number;
}

type PrizeDistributionStatus = "distributed" | "pending" | "none";
type PrizeFundSource = "enrollment" | "sponsor" | "organizer";

interface LiveTest {
  id: number;
  mockTestId: number;
  teacherId: number;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  thumbnailFileId: string | null;
  price: number;
  startTime: string;
  endTime: string;
  registrationDeadline: string | null;
  maxSeats: number;
  enrolledCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasPrizes: boolean;
  totalPrizePool: number;
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  prizeDistributionStatus: PrizeDistributionStatus;
  prizeFundSource: PrizeFundSource;
  actualTotalDistributed: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  teacherBio: string;
  teacherWebsiteUrl: string;
  teacherSocialLinks: SocialLinks;
  teacherAwardsCertificates: AwardCertificate[];
  teacherPublicPhone: string;
  teacherPublicEmail: string;
  teacherAcademyName: string | null;
  teacherIsVerified: boolean;
  mockTestTitle: string;
  mockTestDescription: string;
  mockTestDurationMinutes: number;
  mockTestExamName: string;
  mockTestSlug: string;
  teacherSlug: string;
  examSlug: string;
  slug: string;
  isEnrolled: boolean;
  canEnroll: boolean;
  hasAttempted: boolean;
  language: string | null;
  teacherProfile: TeacherProfile;
  mockTestDetails: MockTestDetails;
}

type CurrentUserStatus = "not_enrolled" | "enrolled" | "attempted";
type TestStatus = "completed" | "upcoming" | "live";

interface LeaderboardEntry {
  rank: number;
  studentName: string;
  score: number;
  timeTaken: number;
}

interface DynamicPrizes {
  firstPrize: number;
  secondPrize: number;
  thirdPrize: number;
  totalPrizePool: number;
  isReduced: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  currentUserStatus: CurrentUserStatus;
  testStatus: TestStatus;
  dynamicPrizes: DynamicPrizes;
}

const RuleSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View className="mb-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
    <Text className="text-base font-black text-slate-800 dark:text-white mb-3">
      {title}
    </Text>
    {children}
  </View>
);

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
}) => (
  <View className="flex-row items-center mb-2 last:mb-0">
    <Feather name={icon} size={14} color="#64748b" />
    <Text className="text-slate-500 dark:text-slate-400 text-sm ml-2 w-28">
      {label}
    </Text>
    <Text className="text-slate-700 dark:text-slate-200 font-bold text-sm flex-1">
      {value}
    </Text>
  </View>
);

const BulletItem = ({
  text,
  children,
}: {
  text?: string;
  children?: React.ReactNode;
}) => (
  <View className="flex-row mb-2 last:mb-0">
    <Text className="text-orange-400 mr-2 mt-0.5 font-black">•</Text>
    <Text className="text-slate-600 dark:text-slate-300 text-sm leading-5 flex-1">
      {text || children}
    </Text>
  </View>
);

const LiveTestDetails = () => {
  const { id } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "leaderboard">("about");
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const { user, token } = useAuth();
  const { addToCart, adding } = useAddToCart();
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    message?: string;
  }>({ visible: false, success: false });

  const isLive =
    liveTest &&
    new Date(liveTest.startTime) <= new Date() &&
    new Date(liveTest.endTime) >= new Date();

  const now = Date.now();
  const hasDeadline =
    liveTest?.registrationDeadline &&
    new Date(liveTest.registrationDeadline).getTime() > now;
  const hasNotStarted =
    liveTest?.startTime && new Date(liveTest.startTime).getTime() > now;

  const isEnrolled = liveTest?.isEnrolled;

  const countdownTarget = isLive
    ? liveTest.endTime
    : isEnrolled
      ? hasNotStarted
        ? liveTest.startTime
        : liveTest.endTime
      : hasDeadline
        ? liveTest.registrationDeadline
        : hasNotStarted
          ? liveTest.startTime
          : null;

  const countdownLabel = isLive
    ? "Test Ends In"
    : isEnrolled
      ? hasNotStarted
        ? "Test Starts In"
        : "Test Ends In"
      : hasDeadline
        ? "Registration Closes In"
        : hasNotStarted
          ? "Test Starts In"
          : "";

  const timeLeft = useCountdown(countdownTarget);

  useEffect(() => {
    const fetchLiveTestDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/live-tests/details?id=${id}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        );
        const data = await response.json();
        const payload = data.json || data;
        // console.log(
        //   "[LiveTestDetails] API response:",
        //   JSON.stringify(payload, null, 2),
        // );
        setLiveTest(payload);
      } catch (error: any) {
        console.error("Error fetching live test details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLiveTestDetails();
  }, [id, token]);

  useEffect(() => {
    // if (activeTab !== "leaderboard" || !liveTest) return;

    const fetchLeaderboard = async () => {
      try {
        // console.debug(liveTest?.id);
        if (!liveTest?.id) return;
        setLeaderboardLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/live-tests/leaderboard?liveTestId=${liveTest?.id}`,
        );
        const data = await response.json();
        const payload = data.json || data;
        setLeaderboardData(payload);
      } catch (error: any) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchLeaderboard();
  }, [activeTab, liveTest]);

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    try {
      setEnrolling(true);
      const res = await fetch(`${BASE_URL}/_api/live-tests/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ json: { liveTestId: Number(id) } }),
      });

      const data = await res.json();
      const payload = data.json || data;
      console.log("[LiveTestDetails] Enroll response:", {
        status: res.status,
        payload,
      });

      if (res.ok) {
        setLiveTest((prev) => (prev ? { ...prev, isEnrolled: true } : null));
        setEnrollResult({
          visible: true,
          success: true,
          message: payload.message || "Successfully enrolled in the live test.",
        });
      } else {
        setEnrollResult({
          visible: true,
          success: false,
          message: payload.message || "Failed to enroll. Please try again.",
        });
      }
    } catch (err) {
      console.error("[LiveTestDetails] Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this live test: ${liveTest?.title}\n${BASE_URL}/live/${liveTest?.slug}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "TBD";
    const date = new Date(isoString);
    return (
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  };

  if (loading || !liveTest) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900">
        <StatusBar
          barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        />
        <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
          <Header />
          <View className="flex-1 items-center justify-center px-10">
            {loading ? (
              <ActivityIndicator size="large" color="#FF8A50" />
            ) : (
              <>
                <Text className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                  Live Test not found
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  className="bg-primary px-8 py-3 rounded-xl"
                >
                  <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isTestEnded = new Date(liveTest.endTime) < new Date();

  const seatsPercentage =
    liveTest.maxSeats > 0
      ? Math.min((liveTest.enrolledCount / liveTest.maxSeats) * 100, 100)
      : 0;

  const duration =
    liveTest.mockTestDetails?.durationMinutes ||
    liveTest.mockTestDurationMinutes ||
    60;

  const totalQuestions = liveTest.mockTestDetails?.totalQuestions || 50;

  const subject =
    (liveTest.mockTestDetails?.subject &&
    liveTest.mockTestDetails.subject !== "[]"
      ? liveTest.mockTestDetails.subject
      : liveTest.mockTestExamName) || "General";

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Image Hero Section */}
          <View className="px-6 pt-5 mb-5">
            <View className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-800">
              <Image
                source={{
                  uri:
                    liveTest.thumbnailUrl ||
                    "https://ik.imagekit.io/testkart/placeholders/live.png",
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute top-4 left-4">
                {isLive ? (
                  <View className="bg-red-500 px-3 py-1.5 rounded-full flex-row items-center border border-red-400 shadow-lg">
                    <BlinkingDot />
                    <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                      LIVE
                    </Text>
                  </View>
                ) : (
                  <View className="bg-blue-500 px-3 py-1.5 rounded-full flex-row items-center border border-blue-400 shadow-lg">
                    <Feather
                      name="clock"
                      size={10}
                      color="white"
                      style={{ marginRight: 4 }}
                    />
                    <Text className="text-white font-black text-[10px] uppercase tracking-wider">
                      UPCOMING
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Ends In Highlighter (Timer) */}
          {timeLeft && (
            <View className="px-6 mb-6">
              <View className="bg-orange-50 dark:bg-orange-950/30 px-5 py-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-orange-500 mr-2.5 animate-pulse" />
                  <Text className="text-orange-600 dark:text-orange-400 font-black text-sm uppercase tracking-wider">
                    {countdownLabel}:
                  </Text>
                </View>
                <Text className="text-orange-500 dark:text-orange-300 font-black text-lg tabular-nums">
                  {timeLeft}
                </Text>
              </View>
            </View>
          )}

          {/* Heading (same style language as tests screen) */}
          <View className="px-6">
            <View className="flex-row items-center mb-4">
              <View className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800/30 px-4 py-1.5 rounded-full">
                <Text className="text-primary text-[11px] font-black uppercase tracking-wider">
                  {liveTest.examSlug?.replace(/-/g, " ").toUpperCase() ||
                    "MOCK TEST"}
                </Text>
              </View>
              <View className="ml-3 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800/30 px-4 py-1.5 rounded-full">
                <Text className="text-cyan-600 dark:text-cyan-400 font-black text-[11px] uppercase tracking-wider">
                  {liveTest.language?.toUpperCase() || "ENGLISH"}
                </Text>
              </View>
            </View>

            <Text className="text-slate-800 dark:text-white text-5xl font-black leading-tight mb-4">
              {liveTest.title}
            </Text>

            {/* <Text className="text-slate-500 dark:text-slate-400 text-base leading-7 mb-4">
              {(liveTest.description ||
                "Join this live mock test to improve speed, accuracy, and confidence.").trim()}
            </Text> */}

            <View className="flex-row items-center mb-5">
              <Text className="text-slate-500 dark:text-slate-400 text-sm">
                By:{" "}
              </Text>
              <Image
                source={{
                  uri:
                    liveTest.teacherAvatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(liveTest.teacherName)}&background=FF8A50&color=fff`,
                }}
                className="w-5 h-5 rounded-full mx-1.5"
              />
              <Text className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                {liveTest.teacherName}
              </Text>
              {liveTest.teacherIsVerified && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color="#22C55E"
                  style={{ marginLeft: 4 }}
                />
              )}
              <TouchableOpacity
                onPress={handleShare}
                className="ml-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 w-9 h-9 rounded-full items-center justify-center"
              >
                <Feather name="share-2" size={16} color="#FF8A50" />
              </TouchableOpacity>
            </View>

            {/* Time Info */}
            <View className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-4 py-4 mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg items-center justify-center">
                  <Feather name="calendar" size={13} color="#FF8A50" />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs ml-2.5 w-12">
                  Starts
                </Text>
                <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs flex-1">
                  {formatDateTime(liveTest.startTime)}
                </Text>
              </View>
              <View className="flex-row items-center mb-3">
                <View className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg items-center justify-center">
                  <Feather name="calendar" size={13} color="#FF8A50" />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs ml-2.5 w-12">
                  Ends
                </Text>
                <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs flex-1">
                  {formatDateTime(liveTest.endTime)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-7 h-7 bg-orange-50 dark:bg-orange-900/20 rounded-lg items-center justify-center">
                  <Feather name="clock" size={13} color="#FF8A50" />
                </View>
                <Text className="text-slate-500 dark:text-slate-400 text-xs ml-2.5 w-12">
                  Duration
                </Text>
                <Text className="text-slate-700 dark:text-slate-200 font-bold text-xs flex-1">
                  {duration} mins
                </Text>
              </View>
            </View>
          </View>

          {/* ── Prize Pool ── */}
          {liveTest.hasPrizes && (
            <View className="mx-5 mb-5 rounded-[24px] overflow-hidden">
              <View className="px-5 pt-5 pb-6 bg-[#FF6B35]">
                <Text className="text-white/80 text-xs font-black uppercase tracking-widest mb-1 text-center">
                  WIN UP TO
                </Text>
                <Text className="font-black text-white text-4xl text-center mb-2">
                  ₹{liveTest.firstPrize}
                </Text>
                <View className="self-center bg-black/20 px-4 py-1.5 rounded-full mb-5">
                  <Text className="text-white/90 text-xs font-bold text-center">
                    Total Prize Pool:{" "}
                    <Text className="font-black text-white">
                      ₹{liveTest.totalPrizePool}
                    </Text>
                  </Text>
                </View>

                <View className="flex-row justify-center items-end gap-2">
                  {/* 1st Place */}
                  <View className="flex-1 items-center">
                    <View className="bg-white/30 rounded-2xl px-2 py-3 items-center w-full border border-white/30">
                      <Text className="text-3xl mb-1">🏆</Text>
                      <Text className="text-white/80 text-[9px] font-black uppercase tracking-wide">
                        1st Place
                      </Text>
                      <Text className="text-white font-black text-xl mt-0.5">
                        ₹{liveTest.firstPrize}
                      </Text>
                    </View>
                  </View>

                  {/* 2nd Place */}
                  <View className="flex-1 items-center">
                    <View className="bg-white/20 rounded-2xl px-2 py-2.5 items-center w-full">
                      <Text className="text-2xl mb-1">🥈</Text>
                      <Text className="text-white/70 text-[9px] font-black uppercase tracking-wide">
                        2nd Place
                      </Text>
                      <Text className="text-white font-black text-lg mt-0.5">
                        ₹{liveTest.secondPrize}
                      </Text>
                    </View>
                  </View>

                  {/* 3rd Place */}
                  <View className="flex-1 items-center">
                    <View className="bg-white/15 rounded-2xl px-2 py-2.5 items-center w-full">
                      <Text className="text-2xl mb-1">🥉</Text>
                      <Text className="text-white/70 text-[9px] font-black uppercase tracking-wide">
                        3rd Place
                      </Text>
                      <Text className="text-white font-black text-lg mt-0.5">
                        ₹{liveTest.thirdPrize}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Seats Progress ── */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text className="text-slate-600 dark:text-slate-400 text-sm font-bold ml-1.5">
                  {liveTest.enrolledCount} / {liveTest.maxSeats} seats filled
                </Text>
              </View>
              <Text className="text-orange-500 font-black text-sm">
                {liveTest.maxSeats - liveTest.enrolledCount} left
              </Text>
            </View>
            <View className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-orange-400 rounded-full"
                style={{ width: `${seatsPercentage}%` }}
              />
            </View>
          </View>

          {/* ── Action Button ── */}
          <View className="px-5 mb-6">
            {isTestEnded && (
              <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl px-4 py-3 mb-3">
                <Text className="text-red-600 dark:text-red-400 font-black text-sm text-center">
                  Test Ended
                </Text>
              </View>
            )}
            {liveTest.hasAttempted ? (
              <TouchableOpacity
                disabled
                className="h-14 w-full rounded-2xl flex-row items-center justify-center shadow-md bg-slate-400 dark:bg-slate-600"
              >
                <Feather name="check-circle" size={18} color="white" />
                <Text className="text-white text-lg font-black ml-2.5">
                  Already Attempted
                </Text>
              </TouchableOpacity>
            ) : liveTest.isEnrolled &&
              (!liveTest.startTime ||
                new Date(liveTest.startTime) <= new Date()) &&
              !isTestEnded ? (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/user/live-portal/${liveTest.id}` as any)
                }
                className="h-14 w-full rounded-2xl flex-row items-center justify-center shadow-md bg-emerald-500 shadow-emerald-500/30"
              >
                <Feather name="play-circle" size={18} color="white" />
                <Text className="text-white text-lg font-black ml-2.5">
                  Start Test
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  if (liveTest.price === 0) {
                    await handleFreeEnroll();
                  } else {
                    const result = await addToCart(liveTest.id, "live");
                    console.log(
                      "[LiveTestDetails] Add to cart result:",
                      result,
                    );
                    if (result.success) {
                      router.push("/user/cart");
                    }
                  }
                }}
                disabled={
                  isTestEnded ||
                  adding ||
                  enrolling ||
                  liveTest.isEnrolled ||
                  liveTest.enrolledCount >= liveTest.maxSeats
                }
                className={`h-14 w-full rounded-2xl flex-row items-center justify-center shadow-md ${
                  isTestEnded ||
                  (!liveTest.isEnrolled &&
                    liveTest.enrolledCount >= liveTest.maxSeats)
                    ? "bg-slate-300 dark:bg-slate-700"
                    : liveTest.isEnrolled
                      ? "bg-emerald-500 shadow-emerald-500/30"
                      : liveTest.price === 0
                        ? "bg-emerald-500 shadow-emerald-500/20"
                        : "bg-primary shadow-orange-500/20"
                }`}
              >
                {adding || enrolling ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather
                      name={
                        isTestEnded ||
                        (!liveTest.isEnrolled &&
                          liveTest.enrolledCount >= liveTest.maxSeats)
                          ? "x-circle"
                          : liveTest.isEnrolled
                            ? "check-circle"
                            : "zap"
                      }
                      size={18}
                      color="white"
                    />
                    <Text className="text-white text-lg font-black ml-2.5">
                      {isTestEnded
                        ? "Enrollment Closed"
                        : !liveTest.isEnrolled &&
                            liveTest.enrolledCount >= liveTest.maxSeats
                          ? "Registration Closed"
                          : liveTest.isEnrolled
                            ? "Already Enrolled"
                            : liveTest.price === 0
                              ? "Enroll for Free"
                              : `Enroll for ₹${liveTest.price}`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── Tabs ── */}
          <View className="px-5 mb-6">
            <View className="flex-row bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
              <TouchableOpacity
                onPress={() => setActiveTab("about")}
                className="flex-1 py-3 rounded-xl items-center"
                style={
                  activeTab === "about"
                    ? {
                        backgroundColor:
                          colorScheme === "dark" ? "#334155" : "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 1,
                      }
                    : undefined
                }
              >
                <Text
                  className="font-black text-sm"
                  style={{
                    color:
                      activeTab === "about"
                        ? "#f97316"
                        : colorScheme === "dark"
                          ? "#94a3b8"
                          : "#64748b",
                  }}
                >
                  About
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("leaderboard")}
                className="flex-1 py-3 rounded-xl items-center"
                style={
                  activeTab === "leaderboard"
                    ? {
                        backgroundColor:
                          colorScheme === "dark" ? "#334155" : "#ffffff",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 1,
                      }
                    : undefined
                }
              >
                <Text
                  className="font-black text-sm"
                  style={{
                    color:
                      activeTab === "leaderboard"
                        ? "#f97316"
                        : colorScheme === "dark"
                          ? "#94a3b8"
                          : "#64748b",
                  }}
                >
                  Leaderboard
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Tab Content ── */}
          {activeTab === "about" ? (
            <View className="px-5">
              {/* About This Test */}
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                About This Test
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-base leading-7 mb-8">
                {liveTest.description ||
                  "Join this exciting live mock test and compete with thousands of students. Win prizes and improve your exam preparation."}
              </Text>

              <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">
                Comprehensive Rules & Information
              </Text>

              {/* Test Format */}
              <RuleSection title="Test Format">
                <InfoRow icon="book-open" label="Subject" value={subject} />
                <InfoRow
                  icon="list"
                  label="Total Questions"
                  value={String(totalQuestions)}
                />
                <InfoRow
                  icon="clock"
                  label="Duration"
                  value={`${duration} minutes`}
                />
              </RuleSection>

              {/* Scoring Rules */}
              <RuleSection title="Scoring Rules">
                <BulletItem text="Each question carries positive marks." />
                <BulletItem text="For multiple correct questions, partial marking may be available." />
                <BulletItem text="Leaderboard score = Sum of marks obtained across all questions." />
              </RuleSection>

              {/* Ranking */}
              <RuleSection title="Ranking & Leaderboard">
                <BulletItem text="Rank is determined by score first, then by time (less time = higher rank)." />
                <BulletItem text="Leaderboard updates in real-time during the test." />
                <BulletItem text="Final rankings are declared after the test ends." />
              </RuleSection>

              {/* Prizes */}
              {liveTest.hasPrizes && (
                <RuleSection title="Prizes">
                  <BulletItem
                    text={`1st Prize: ₹${liveTest.firstPrize} | 2nd Prize: ₹${liveTest.secondPrize} | 3rd Prize: ₹${liveTest.thirdPrize}`}
                  />
                  <BulletItem text="Prize money will be credited to the winner's TestKart wallet after the test ends." />
                  <BulletItem text="Winners can withdraw prize money to their bank account." />
                </RuleSection>
              )}

              {/* Attempt Rules */}
              <RuleSection title="Attempt Rules">
                <BulletItem text="Only one attempt is allowed per student." />
                <BulletItem text="Once you start the test, you cannot re-attempt." />
                <BulletItem text="Test will auto-submit when the time ends." />
                <BulletItem text="You must be enrolled to be able to attempt the test." />
              </RuleSection>

              {/* Enrollment & Refund */}
              <RuleSection title="Enrollment & Refund">
                <BulletItem
                  text={`Seats are limited (Max seats: ${liveTest.maxSeats}).`}
                />
                <BulletItem text="Registration closes at the deadline or when all seats are filled." />
                <BulletItem text="No refund once enrolled in the contest." />
              </RuleSection>

              {/* Disclaimer */}
              <RuleSection title="Disclaimer">
                <BulletItem text="TestKart does not proctor the test or verify student identity." />
                <BulletItem text="Accuracy and correctness of questions depends solely upon the teacher who created the test." />
                <BulletItem>
                  By enrolling, you agree to the above rules and{" "}
                  <Text
                    className="text-orange-500 font-bold"
                    onPress={() => Linking.openURL("https://testkart.in/terms")}
                  >
                    TestKart&apos;s Terms of Service
                  </Text>
                  .
                </BulletItem>
              </RuleSection>

              <View className="mt-4 mb-4">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                  About the Host
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      `/expert/${liveTest.teacherSlug || liveTest.teacherProfile?.slug}` as any,
                    )
                  }
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-[24px] p-5 active:opacity-70"
                >
                  <View className="flex-row items-center">
                    <Image
                      source={{
                        uri:
                          liveTest.teacherAvatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(liveTest.teacherName)}&background=FF8A50&color=fff`,
                      }}
                      className="w-14 h-14 rounded-2xl"
                    />
                    <View className="ml-4 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-slate-800 dark:text-white font-black text-base">
                          {liveTest.teacherName}
                        </Text>
                        {liveTest.teacherIsVerified && (
                          <MaterialIcons
                            name="verified"
                            size={18}
                            color="#22C55E"
                            className="ml-1"
                          />
                        )}
                      </View>
                      {liveTest.teacherAcademyName ? (
                        <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          {liveTest.teacherAcademyName}
                        </Text>
                      ) : null}
                    </View>
                    <Feather name="chevron-right" size={24} color="#FF8A50" />
                  </View>
                  {liveTest.teacherBio ? (
                    <Text className="text-slate-600 dark:text-slate-300 text-sm leading-6 mt-4">
                      {liveTest.teacherBio}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="px-5 min-h-[200px]">
              {leaderboardLoading ? (
                <View className="py-36 items-center">
                  <ActivityIndicator size="large" color="#FF8A50" />
                </View>
              ) : !leaderboardData ||
                leaderboardData.leaderboard.length === 0 ? (
                <View className="py-24 items-center justify-center">
                  <View className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[30px] items-center justify-center mb-6">
                    <Feather name="bar-chart-2" size={32} color="#94a3b8" />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-black text-2xl mb-3 text-center">
                    No Submissions Yet
                  </Text>
                  <Text className="text-slate-400 dark:text-slate-500 text-base text-center leading-6 px-10">
                    The leaderboard will appear here once students start
                    completing the test.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Status + current user rank */}
                  <View className="flex-row items-center justify-between mb-5">
                    <View
                      className={`px-3 py-1.5 rounded-full ${
                        leaderboardData.testStatus === "completed"
                          ? "bg-slate-100 dark:bg-slate-800"
                          : leaderboardData.testStatus === "live"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-orange-100 dark:bg-orange-900/30"
                      }`}
                    >
                      <Text
                        className={`text-xs font-black uppercase tracking-wider ${
                          leaderboardData.testStatus === "completed"
                            ? "text-slate-500 dark:text-slate-400"
                            : leaderboardData.testStatus === "live"
                              ? "text-green-600 dark:text-green-400"
                              : "text-orange-600 dark:text-orange-400"
                        }`}
                      >
                        {leaderboardData.testStatus === "completed"
                          ? "Test Completed"
                          : leaderboardData.testStatus === "live"
                            ? "• Live Now"
                            : "Upcoming"}
                      </Text>
                    </View>

                    {leaderboardData.currentUserRank && (
                      <View className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 px-3 py-1.5 rounded-full">
                        <Text className="text-orange-500 font-black text-xs">
                          Your Rank: #{leaderboardData.currentUserRank}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Top 3 podium */}
                  {leaderboardData.leaderboard.length >= 3 && (
                    <View className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 mb-5 border border-slate-100 dark:border-slate-700/50">
                      <View className="flex-row items-end justify-center gap-3">
                        {/* 2nd */}
                        <View className="flex-1 items-center">
                          <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mb-1">
                            <Text className="text-base">🥈</Text>
                          </View>
                          <Text
                            className="text-slate-700 dark:text-slate-200 font-black text-xs text-center"
                            numberOfLines={1}
                          >
                            {leaderboardData.leaderboard[1].studentName}
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                            {leaderboardData.leaderboard[1].score} pts
                          </Text>
                          <View className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-t-xl mt-2 items-center justify-center">
                            <Text className="text-slate-600 dark:text-slate-300 font-black text-sm">
                              #2
                            </Text>
                          </View>
                        </View>
                        {/* 1st */}
                        <View className="flex-1 items-center">
                          <View className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mb-1">
                            <Text className="text-xl">🏆</Text>
                          </View>
                          <Text
                            className="text-slate-800 dark:text-white font-black text-xs text-center"
                            numberOfLines={1}
                          >
                            {leaderboardData.leaderboard[0].studentName}
                          </Text>
                          <Text className="text-orange-500 font-black text-xs">
                            {leaderboardData.leaderboard[0].score} pts
                          </Text>
                          <View className="h-16 w-full bg-orange-400 rounded-t-xl mt-2 items-center justify-center">
                            <Text className="text-white font-black text-sm">
                              #1
                            </Text>
                          </View>
                        </View>
                        {/* 3rd */}
                        <View className="flex-1 items-center">
                          <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mb-1">
                            <Text className="text-base">🥉</Text>
                          </View>
                          <Text
                            className="text-slate-700 dark:text-slate-200 font-black text-xs text-center"
                            numberOfLines={1}
                          >
                            {leaderboardData.leaderboard[2].studentName}
                          </Text>
                          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
                            {leaderboardData.leaderboard[2].score} pts
                          </Text>
                          <View className="h-8 w-full bg-slate-300 dark:bg-slate-600 rounded-t-xl mt-2 items-center justify-center">
                            <Text className="text-slate-600 dark:text-slate-300 font-black text-sm">
                              #3
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Full list */}
                  <View className="mb-4">
                    {/* Header row */}
                    <View className="flex-row px-3 py-2 mb-1">
                      <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase w-10">
                        #
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase flex-1">
                        Student
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase w-14 text-right">
                        Score
                      </Text>
                      <Text className="text-slate-400 dark:text-slate-500 text-xs font-black uppercase w-16 text-right">
                        Time
                      </Text>
                    </View>

                    {leaderboardData.leaderboard.map((entry) => {
                      const isTop3 = entry.rank <= 3;
                      const isCurrentUser =
                        leaderboardData.currentUserRank === entry.rank;
                      return (
                        <View
                          key={entry.rank}
                          className={`flex-row items-center px-3 py-3 rounded-xl mb-1.5 ${
                            isCurrentUser
                              ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30"
                              : isTop3
                                ? "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50"
                                : ""
                          }`}
                        >
                          <View className="w-10">
                            {entry.rank === 1 ? (
                              <Text className="text-base">🥇</Text>
                            ) : entry.rank === 2 ? (
                              <Text className="text-base">🥈</Text>
                            ) : entry.rank === 3 ? (
                              <Text className="text-base">🥉</Text>
                            ) : (
                              <Text className="text-slate-500 dark:text-slate-400 font-black text-sm">
                                {entry.rank}
                              </Text>
                            )}
                          </View>
                          <Text
                            className={`flex-1 text-sm font-bold ${
                              isCurrentUser
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                            numberOfLines={1}
                          >
                            {entry.studentName}
                            {isCurrentUser ? " (You)" : ""}
                          </Text>
                          <Text className="text-slate-800 dark:text-white font-black text-sm w-14 text-right">
                            {entry.score}
                          </Text>
                          <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold w-16 text-right">
                            {entry.timeTaken}m
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
        {/* ── Feedback Modal ─────────────────────────── */}
        <Modal
          visible={enrollResult.visible}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setEnrollResult((prev) => ({ ...prev, visible: false }))
          }
        >
          <View className="flex-1 bg-black/50 items-center justify-center px-6">
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
              {enrollResult.success ? (
                <>
                  <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                    <Feather name="check-circle" size={32} color="#10B981" />
                  </View>
                  <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Enrolled Successfully!
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                    {enrollResult.message ||
                      "You have been successfully enrolled in this live test."}
                  </Text>
                  {!liveTest.hasAttempted &&
                  (!liveTest.startTime ||
                    new Date(liveTest.startTime) <= new Date()) &&
                  !isTestEnded ? (
                    <>
                      <TouchableOpacity
                        className="bg-emerald-500 w-full h-14 rounded-2xl items-center justify-center flex-row mb-3"
                        onPress={() => {
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }));
                          router.push(
                            `/user/live-portal/${liveTest.id}` as any,
                          );
                        }}
                      >
                        <Feather name="play-circle" size={18} color="white" />
                        <Text className="text-white font-black text-base ml-2">
                          Start Test
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="w-full h-12 rounded-2xl items-center justify-center"
                        onPress={() =>
                          setEnrollResult((prev) => ({
                            ...prev,
                            visible: false,
                          }))
                        }
                      >
                        <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                          Close
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center"
                      onPress={() =>
                        setEnrollResult((prev) => ({
                          ...prev,
                          visible: false,
                        }))
                      }
                    >
                      <Text className="text-white font-black text-base">
                        Got it
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-5">
                    <Feather name="alert-circle" size={32} color="#EF4444" />
                  </View>
                  <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                    Enrollment Failed
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-center text-sm leading-5 mb-6">
                    {enrollResult.message ||
                      "We couldn't process your enrollment right now."}
                  </Text>
                  <TouchableOpacity
                    className="bg-primary w-full h-14 rounded-2xl items-center justify-center"
                    onPress={() =>
                      setEnrollResult((prev) => ({
                        ...prev,
                        visible: false,
                      }))
                    }
                  >
                    <Text className="text-white font-black text-base">
                      Try Again
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default LiveTestDetails;
