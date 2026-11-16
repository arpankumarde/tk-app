import BottomTabs from "@/components/BottomTabs";
import DetailHeader from "@/components/DetailHeader";
import BundleCrossSell from "@/components/BundleCrossSell";
import Placeholder from "@/constants/placeholder";
import { useAuth } from "@/context/AuthContext";
import { useEnrollmentContext } from "@/context/EnrollmentContext";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useBuildShareUrl } from "@/hooks/useBuildShareUrl";
import { useNow } from "@/hooks/useNow";
import { formatOpensDate, isScheduledAhead } from "@/utils/testSchedule";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clientHeaders } from "@/utils/clientHeaders";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface TeacherSocialLinks {
  twitter: string;
  youtube: string;
  facebook: string;
  linkedin: string;
  instagram: string;
}

interface Subject {
  id: number;
  subjectName: string;
  actualQuestionCount: number;
}

interface TestItem {
  id: number;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalQuestions: number;
  isFree: boolean;
  orderIndex: number;
  createdAt: string;
  scheduledDate: string | null;
  subjects: Subject[];
}

interface Package {
  id: number;
  title: string;
  description: string;
  subject: string;
  price: number;
  discountPrice: number;
  examName: string;
  examSlug: string;
  slug: string;
  teacherName: string;
  teacherAvatarUrl: string;
  teacherId: number;
  teacherSlug: string;
  teacherBio: string;
  teacherWebsiteUrl: string;
  teacherPublicPhone: string;
  teacherPublicEmail: string;
  teacherAcademyName: string | null;
  teacherSocialLinks: TeacherSocialLinks;
  teacherAwardsCertificates: string[];
  rating: number;
  studentsEnrolled: number;
  reviewsCount: number;
  totalTests: number;
  freeTestsCount: number;
  thumbnailUrl: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  isEnrolled: boolean;
  language: string;
  teacherIsVerified: boolean;
  whatYouLearn: string[];
  requirements: string[];
  longDescription: string;
  disclaimer: string | null;
}

interface PackageResponse {
  package: Package;
  items: TestItem[];
}

interface FreeEnrollResponse {
  json: {
    error?: string;
    message?: string;
    orderId?: number;
  };
}

const TestDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { user, token } = useAuth();
  const { enrolledTestIds, markTestEnrolled } = useEnrollmentContext();

  const [test, setTest] = useState<Package | null>(null);
  const [items, setItems] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<{
    visible: boolean;
    success: boolean;
    orderId?: number;
    message?: string;
  }>({ visible: false, success: false });
  const { addToCart, adding: addingToCart } = useAddToCart();
  const buildShareUrl = useBuildShareUrl();
  const now = useNow(60000);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/tests/details?slug=${slug}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const data = await response.json();
        const payload: PackageResponse = data.json || data;
        // console.log(
        //   "Test details API response:",
        //   JSON.stringify(payload, null, 2),
        // );
        setTest(payload.package);
        setItems(
          payload.items && payload.items.length > 0 ? payload.items : [],
        );
      } catch (error: any) {
        console.error("Error fetching test details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchTestDetails();
  }, [slug, token]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this test series: ${test?.title}\n${buildShareUrl(`${BASE_URL}/mock-test/${test?.slug}`)}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    try {
      setEnrolling(true);
      const res = await fetch(`${BASE_URL}/_api/tests/enroll-free`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...clientHeaders(),
        },
        body: JSON.stringify({ json: { mockTestId: test?.id } }),
      });
      const data: FreeEnrollResponse = await res.json();
      console.log("Enroll response:", data);
      if (data.json?.orderId) {
        setTest((prev) => (prev ? { ...prev, isEnrolled: true } : prev));
        if (test?.id) markTestEnrolled(test.id);
        setEnrollResult({
          visible: true,
          success: true,
          orderId: data.json.orderId,
        });
      } else {
        setEnrollResult({
          visible: true,
          success: false,
          message:
            data.json?.message ||
            data.json?.error ||
            "Failed to enroll. Please try again.",
        });
      }
    } catch (err) {
      console.error("Enroll error:", err);
      setEnrollResult({
        visible: true,
        success: false,
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const toggleItem = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter((i) => i !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-paper dark:bg-night items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </SafeAreaView>
    );
  }

  if (!test) {
    return (
      <SafeAreaView className="flex-1 bg-paper dark:bg-night items-center justify-center p-6">
        <Text className="w-full text-xl font-bold text-ink dark:text-white mb-4 text-center">
          Test not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-6 py-3 bg-primary-deep rounded-full"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const actualPrice = test.discountPrice ?? test.price;
  const isFree = actualPrice === 0;
  const isEnrolled = test.isEnrolled || enrolledTestIds.has(test.id);
  const hasDiscount =
    typeof test.discountPrice === "number" && test.discountPrice < test.price;
  const originalPrice = hasDiscount ? test.price : null;
  const discountPercent =
    hasDiscount && test.price > 0
      ? Math.round(((test.price - actualPrice) / test.price) * 100)
      : null;
  const formatInr = (amount: number) => amount.toLocaleString("en-IN");

  const totalQuestions = items.reduce((sum, t) => sum + t.totalQuestions, 0);
  const totalDuration = items.reduce((sum, t) => sum + t.durationMinutes, 0);

  return (
    <SafeAreaView className="flex-1 bg-paper dark:bg-night" edges={["top"]}>
      <DetailHeader title="Mock test" onShare={handleShare} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-5 flex-row">
          <View className="bg-sage-tint dark:bg-night-raised px-3 py-1.5 rounded-full flex-row items-center flex-shrink-1">
            <Feather name="award" size={12} color={colorScheme === "dark" ? "#A9C4AF" : "#4F6F58"} />
            <Text className="text-sage dark:text-night-soft text-xs font-bold ml-1.5 flex-shrink-1">
              {test.examName || "Mock test"}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <View className="px-6 pt-2 pb-6">
          <Text className="text-3xl font-extrabold text-ink dark:text-white leading-[42px] mb-4">
            {test.title}
          </Text>
          <Text className="text-ink-soft dark:text-night-soft text-base font-medium leading-6 mb-6">
            {test.description ||
              "Prepare with this comprehensive test series covering all key topics and exam patterns."}
          </Text>

          {/* Metadata Row: Author + Rating */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-1 pr-3 flex-row items-center flex-wrap">
              <Text className="text-ink-soft dark:text-night-soft text-sm font-bold">
                Created by{" "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (test.teacherSlug) {
                    router.push(`/expert/${test.teacherSlug}` as any);
                  }
                }}
                disabled={!test.teacherSlug}
                className="flex-row items-center"
              >
                <Text className="text-primary-deep dark:text-primary font-bold text-sm">
                  {test.teacherName || "Expert"}
                </Text>
                {test.teacherIsVerified && (
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color="#22C55E"
                    className="ml-1"
                  />
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center">
              <Text className="mr-3 text-line">|</Text>
              <Ionicons name="star" size={16} color="#FF8A50" />
              <Text className="ml-1 text-ink dark:text-white font-extrabold text-sm">
                {test.rating ? test.rating.toFixed(1) : "New"}
              </Text>
              <Text className="ml-1 text-ink-soft text-xs">
                ({test.reviewsCount || 0})
              </Text>
            </View>
          </View>

          {/* Language Pill */}
          <View className="mb-6">
            <View className="self-start px-3 py-1 bg-sky-tint dark:bg-night-raised rounded-full border border-line dark:border-night-line flex-row items-center">
              <Feather name="globe" size={12} color="#3F6577" />
              <Text className="text-sky dark:text-sky-light text-[10px] font-extrabold tracking-widest ml-1.5 uppercase">
                {test.language?.trim() || "English"}
              </Text>
            </View>
          </View>
        </View>

        {/* Thumbnail */}
        <View className="px-6 mb-8">
          <View className="aspect-video w-full rounded-3xl overflow-hidden bg-sand dark:bg-night-raised relative shadow-2xl">
            <Image
              source={{
                uri: test.thumbnailUrl || Placeholder.TEST,
              }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Package Stats Card */}
        <View className="px-6 mb-8">
          <View className="bg-sand dark:bg-night-raised rounded-xl p-5 border border-line dark:border-night-line">
            <Text className="text-ink dark:text-white font-extrabold text-lg mb-5">
              This package includes
            </Text>

            <View className="flex-row flex-wrap">
              <View className="w-1/2 flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-white dark:bg-night/50 items-center justify-center mr-3">
                  <Feather name="layers" size={16} color="#FF8A50" />
                </View>
                <View>
                  <Text className="text-ink dark:text-white font-extrabold text-sm">
                    {test.totalTests || items.length}
                  </Text>
                  <Text className="text-ink-soft text-[10px] font-bold">
                    Total Tests
                  </Text>
                </View>
              </View>

              {test.freeTestsCount > 0 && (
                <View className="w-1/2 flex-row items-center mb-4">
                  <View className="w-8 h-8 rounded-lg bg-white dark:bg-night/50 items-center justify-center mr-3">
                    <Feather name="gift" size={16} color="#10b981" />
                  </View>
                  <View>
                    <Text className="text-ink dark:text-white font-extrabold text-sm">
                      {test.freeTestsCount}
                    </Text>
                    <Text className="text-ink-soft text-[10px] font-bold">
                      Free Tests
                    </Text>
                  </View>
                </View>
              )}

              <View className="w-1/2 flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-white dark:bg-night/50 items-center justify-center mr-3">
                  <Feather name="file-text" size={16} color="#FF8A50" />
                </View>
                <View>
                  <Text className="text-ink dark:text-white font-extrabold text-sm">
                    {totalQuestions}
                  </Text>
                  <Text className="text-ink-soft text-[10px] font-bold">
                    Questions
                  </Text>
                </View>
              </View>

              <View className="w-1/2 flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-white dark:bg-night/50 items-center justify-center mr-3">
                  <Feather name="clock" size={16} color="#FF8A50" />
                </View>
                <View>
                  <Text className="text-ink dark:text-white font-extrabold text-sm">
                    {totalDuration} min
                  </Text>
                  <Text className="text-ink-soft text-[10px] font-bold">
                    Total Duration
                  </Text>
                </View>
              </View>

              <View className="w-1/2 flex-row items-center">
                <View className="w-8 h-8 rounded-lg bg-white dark:bg-night/50 items-center justify-center mr-3">
                  <Feather name="globe" size={16} color="#FF8A50" />
                </View>
                <View>
                  <Text className="text-ink dark:text-white font-extrabold text-sm">
                    {test.language || "English"}
                  </Text>
                  <Text className="text-ink-soft text-[10px] font-bold">
                    Language
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Test Series Content (Expandable Items) */}
        {items.length > 0 && (
          <View className="px-6 mb-8">
            <Text className="text-2xl font-extrabold text-ink dark:text-white mb-2">
              Test series content
            </Text>
            <Text className="text-ink-soft dark:text-night-soft text-sm font-medium mb-6">
              {items.length} tests • {totalQuestions} questions
            </Text>

            <View className="bg-sand dark:bg-night-raised border border-line dark:border-night-line rounded-xl overflow-hidden">
              {items.map((item, idx) => {
                const isScheduled = isScheduledAhead(item.scheduledDate, now);
                const opensLabel =
                  isScheduled && item.scheduledDate
                    ? `Opens ${formatOpensDate(item.scheduledDate)}`
                    : null;
                return (
                  <View
                    key={item.id}
                    className={`${idx !== items.length - 1 ? "border-b border-line dark:border-night-line/50" : ""}`}
                  >
                    <TouchableOpacity
                      onPress={() => toggleItem(idx)}
                      className="p-5 flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center mb-1.5">
                          <View className="w-1 h-3 bg-orange-400 rounded-full mr-2" />
                          <Text className="text-ink-soft text-[10px] font-extrabold uppercase tracking-widest">
                            Test {idx + 1}
                          </Text>
                          {item.isFree && (
                            <View className="bg-green-100/50 dark:bg-green-900/20 px-2 py-0.5 rounded-md ml-2">
                              <Text className="text-green-600 dark:text-green-400 text-[9px] font-extrabold uppercase">
                                Free
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-ink dark:text-white font-extrabold text-sm">
                          {item.title}
                        </Text>
                        <View className="flex-row items-center flex-wrap mt-2">
                          {!isScheduled && (
                            <>
                              <Feather
                                name="file-text"
                                size={11}
                                color="#968E82"
                              />
                              <Text className="text-ink-soft text-[10px] font-bold ml-1.5 mr-4">
                                {item.totalQuestions} Qs
                              </Text>
                            </>
                          )}
                          {(!isScheduled || item.durationMinutes > 0) && (
                            <>
                              <Feather name="clock" size={11} color="#968E82" />
                              <Text className="text-ink-soft text-[10px] font-bold ml-1.5 mr-4">
                                {item.durationMinutes} min
                              </Text>
                            </>
                          )}
                          {opensLabel && (
                            <>
                              <Feather
                                name="calendar"
                                size={11}
                                color="#FF8A50"
                              />
                              <Text className="text-primary-deep dark:text-primary text-[10px] font-bold ml-1.5">
                                {opensLabel}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Feather
                        name={
                          expandedItems.includes(idx)
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={18}
                        color="#FF8A50"
                      />
                    </TouchableOpacity>

                    {expandedItems.includes(idx) &&
                      (item.subjects.length > 0 || item.isFree) && (
                        <View className="px-5 pb-5 pt-1">
                          <View className="h-[0.5px] bg-sand dark:bg-night-line/30 mb-3" />
                          {item.subjects.map((subject) => (
                            <View
                              key={subject.id}
                              className="flex-row items-center py-2"
                            >
                              <View className="w-6 h-6 rounded-full bg-clay-tint dark:bg-night-raised items-center justify-center mr-3">
                                <Feather
                                  name="book-open"
                                  size={12}
                                  color="#FF8A50"
                                />
                              </View>
                              <Text className="text-ink-soft dark:text-night-soft text-xs font-bold flex-1">
                                {subject.subjectName}
                              </Text>
                              {!isScheduled && (
                                <Text className="text-ink-soft text-[10px] font-bold">
                                  {subject.actualQuestionCount} Qs
                                </Text>
                              )}
                            </View>
                          ))}

                          {item.isFree && opensLabel && (
                            <View className="mt-4 bg-sand dark:bg-night-line h-11 rounded-2xl flex-row items-center justify-center">
                              <Feather
                                name="calendar"
                                size={16}
                                color={
                                  colorScheme === "dark" ? "#E3DACB" : "#6A6358"
                                }
                              />
                              <Text className="text-ink-soft dark:text-night-soft font-extrabold text-sm ml-2">
                                {opensLabel}
                              </Text>
                            </View>
                          )}
                          {item.isFree && !opensLabel && (
                            <TouchableOpacity
                              onPress={() => {
                                if (!user || !token) {
                                  router.push("/login");
                                  return;
                                }
                                router.push({
                                  pathname: "/user/portal/[slug]",
                                  params: {
                                    slug: String(item.id),
                                    title: item.title,
                                    duration: String(item.durationMinutes),
                                    questions: String(item.totalQuestions),
                                  },
                                });
                              }}
                              className="mt-4 bg-emerald-500 h-11 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-500/20"
                            >
                              <Feather name="play" size={16} color="white" />
                              <Text className="text-white font-extrabold text-sm ml-2">
                                Take Test
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* What You'll Learn */}
        {test.whatYouLearn && test.whatYouLearn.length > 0 && (
          <View className="px-6 mb-8">
            <Text className="text-2xl font-extrabold text-ink dark:text-white mb-6">
              What you&apos;ll learn
            </Text>
            {test.whatYouLearn.map((point, id) => (
              <View key={id} className="flex-row items-center mb-4">
                <View className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full items-center justify-center mr-4">
                  <Feather name="check" size={14} color="#10b981" />
                </View>
                <Text className="text-ink-soft dark:text-night-soft text-sm font-medium flex-1">
                  {point}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Requirements */}
        {test.requirements && test.requirements.length > 0 && (
          <View className="px-6 mb-8">
            <Text className="text-2xl font-extrabold text-ink dark:text-white mb-4">
              Requirements
            </Text>
            {test.requirements.map((req, rid) => (
              <View key={rid} className="flex-row items-center mb-3">
                <View className="w-1.5 h-1.5 bg-primary-deep rounded-full mr-3" />
                <Text className="text-ink-soft dark:text-night-soft text-sm font-medium flex-1">
                  {req}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Long Description */}
        {(test.longDescription || test.disclaimer) && (
          <View className="px-6 mb-8">
            {test.longDescription ? (
              <>
                <Text className="text-2xl font-extrabold text-ink dark:text-white mb-4">
                  Description
                </Text>
                <Text className="text-ink-soft dark:text-night-soft text-sm font-medium leading-6">
                  {test.longDescription.replace(/<[^>]*>?/gm, "")}
                </Text>
              </>
            ) : null}

            {test.disclaimer ? (
              <View
                className={`${test.longDescription ? "mt-6" : ""} rounded-2xl overflow-hidden border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5`}
              >
                <View className="flex-row items-center px-4 py-3 bg-amber-100/60 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                  <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3">
                    <Feather name="alert-triangle" size={16} color="white" />
                  </View>
                  <Text className="text-amber-900 dark:text-amber-300 font-extrabold text-sm uppercase tracking-wider">
                    Disclaimer
                  </Text>
                </View>
                <Text className="px-4 py-4 text-amber-900/80 dark:text-amber-200/80 text-[13px] leading-6 font-medium">
                  {test.disclaimer
                    .replace(/^\s*disclaimer\s*:\s*/i, "")
                    .replace(/<[^>]*>?/gm, "")
                    .trim()}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Bundles that include this test series */}
        {!isEnrolled && (
          <View className="px-6">
            <BundleCrossSell
              itemType="test"
              itemId={test.id}
              teacherId={test.teacherId}
            />
          </View>
        )}

        {/* About the Author */}
        <View className="px-6 mb-8">
          <Text className="text-2xl font-extrabold text-ink dark:text-white mb-4">
            About the Author
          </Text>
          <View className="bg-sand dark:bg-night-raised border border-line dark:border-night-line rounded-xl p-5">
            <TouchableOpacity
              onPress={() => router.push(`/expert/${test.teacherSlug}` as any)}
              className="flex-row items-center"
            >
              <Image
                source={{
                  uri:
                    test.teacherAvatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(test.teacherName)}&background=FF8A50&color=fff`,
                }}
                className="w-14 h-14 rounded-2xl"
              />
              <View className="ml-4 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-ink dark:text-white font-extrabold text-base">
                    {test.teacherName || "Author"}
                  </Text>
                  {test.teacherIsVerified && (
                    <MaterialIcons
                      name="verified"
                      size={15}
                      color="#22C55E"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                {test.teacherAcademyName && (
                  <Text className="text-ink-soft text-xs font-medium mt-0.5">
                    {test.teacherAcademyName}
                  </Text>
                )}
              </View>
              <Feather name="chevron-right" size={20} color="#FF8A50" />
            </TouchableOpacity>

            {test.teacherBio && (
              <Text className="text-ink-soft dark:text-night-soft text-sm font-medium leading-6 mt-4 pt-4 border-t border-line dark:border-night-line/50 px-1">
                {test.teacherBio}
              </Text>
            )}
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
      {/* Sticky Bottom Bar */}
      <View className="bg-white dark:bg-night border-t border-line dark:border-night-line p-6 flex-row items-center">
        <View className="flex-1">
          <Text className="text-ink-soft dark:text-night-soft text-xs font-extrabold uppercase tracking-tighter">
            Price
          </Text>
          <View className="flex-row items-center mt-1">
            {actualPrice === 0 ? (
              <Text className="text-2xl font-extrabold text-green-500">Free</Text>
            ) : (
              <Text className="text-2xl font-extrabold text-ink dark:text-white">
                ₹{formatInr(actualPrice)}
              </Text>
            )}
            {originalPrice && (
              <>
                <Text className="ml-2 text-ink-soft line-through text-sm">
                  ₹{formatInr(originalPrice)}
                </Text>
                <View className="ml-2 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                  <Text className="text-green-600 dark:text-green-400 font-extrabold text-[10px]">
                    {discountPercent}% OFF
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={
            isFree
              ? !user || !token
                ? () => router.push("/login")
                : isEnrolled
                  ? () =>
                      router.push({
                        pathname: "/user/tests/[slug]",
                        params: { slug: test.slug },
                      })
                  : handleFreeEnroll
              : async () => {
                  const result = await addToCart(test.id, "test");
                  if (result.success) {
                    router.push("/user/cart");
                  } else {
                    setEnrollResult({
                      visible: true,
                      success: false,
                      message: result.message,
                    });
                  }
                }
          }
          disabled={addingToCart || (isFree && enrolling)}
          className={`${isFree ? "bg-emerald-500 shadow-emerald-500/30" : "bg-primary-deep shadow-orange-500/30"} h-14 w-44 rounded-xl items-center justify-center shadow-lg disabled:opacity-60`}
        >
          {addingToCart || (isFree && enrolling) ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-extrabold">
              {isFree
                ? !user || !token
                  ? "Login to Start"
                  : isEnrolled
                    ? "Start Test"
                    : "Enroll Free"
                : "Buy Now"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Enrollment Result Modal */}
      <Modal
        visible={enrollResult.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEnrollResult((prev) => ({ ...prev, visible: false }))
        }
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white dark:bg-night-raised rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl">
            {enrollResult.success ? (
              <>
                <View className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-5">
                  <Feather name="check-circle" size={32} color="#10B981" />
                </View>
                <Text className="text-2xl font-extrabold text-ink dark:text-white mb-2">
                  Enrolled Successfully!
                </Text>
                <Text className="text-ink-soft dark:text-night-soft font-bold text-sm mb-1">
                  Order ID #{enrollResult.orderId}
                </Text>
                <Text className="text-ink-soft dark:text-night-soft text-center text-sm leading-5 mb-6">
                  Your test series is now available in your dashboard.
                </Text>
                <TouchableOpacity
                  className="bg-green-500 w-full h-14 rounded-2xl items-center justify-center mb-3"
                  onPress={() => {
                    setEnrollResult((prev) => ({
                      ...prev,
                      visible: false,
                    }));
                    router.push("/user");
                  }}
                >
                  <Text className="text-white font-extrabold text-base">
                    Go to Dashboard
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
                  <Text className="text-ink-soft dark:text-night-soft font-bold text-sm">
                    Continue Browsing
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-5">
                  <Feather name="alert-circle" size={32} color="#EF4444" />
                </View>
                <Text className="text-2xl font-extrabold text-ink dark:text-white mb-2">
                  Enrollment Failed
                </Text>
                <Text className="text-ink-soft dark:text-night-soft text-center text-sm leading-5 mb-6">
                  {enrollResult.message}
                </Text>
                <TouchableOpacity
                  className="bg-primary-deep w-full h-14 rounded-2xl items-center justify-center"
                  onPress={() =>
                    setEnrollResult((prev) => ({
                      ...prev,
                      visible: false,
                    }))
                  }
                >
                  <Text className="text-white font-extrabold text-base">
                    Try Again
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default TestDetails;
