import type { LiveTest } from "@/app/(main)/live/index";
import CourseCard from "@/components/CourseCard";
import Header from "@/components/Header";
import LiveTestCard from "@/components/LiveTestCard";
import MockTestCard from "@/components/MockTestCard";
import ProductCard from "@/components/ProductCard";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

interface Teacher {
  id: number;
  displayName: string;
  avatarUrl: string;
  bio: string;
  websiteUrl: string;
  mobileNumber: string;
  publicEmail: string;
  publicPhone: string;
  socialLinks: {
    twitter: string;
    youtube: string;
    facebook: string;
    linkedin: string;
    instagram: string;
  };
  awardsCertificates: {
    title: string;
    description: string;
  }[];
  languages: string[];
  location: string;
  expertiseAreas: string[];
  responseTime: string;
  tagline: string;
  isVerified: boolean;
  workExperiences: {
    id: number;
    companyName: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
    description: string | null;
    isCurrent: boolean;
  }[];
}

interface Test {
  id: number;
  slug: string;
  title: string;
  description: string;
  subject: string | null;
  price: number;
  discountPrice: number | null;
  rating: number | null;
  durationMinutes: number;
  totalQuestions: number;
  thumbnailUrl: string | null;
  totalTests: number;
  freeTestsCount: number;
  creatorName: string;
  studentsEnrolled: number;
  reviewsCount: number;
  examName: string | null;
  language: string | null;
  teacherName: string;
  teacherIsVerified: boolean;
  actualQuestionCount: number;
  isEnrolled: boolean;
  examSlug: string;
  views: number;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  category: string;
  price: number;
  rating: number | null;
  ratingsCount: number;
  totalPurchases: number;
  publishedAt: string;
  language: string;
  views: number;
  teacherName: string;
  teacherAvatar: string;
  teacherSlug: string;
  teacherIsVerified: boolean;
}

interface Data {
  teacher: Teacher;
  courses: any[];
  tests: Test[];
  liveTests: (Partial<LiveTest> & {
    id: number;
    title: string;
    creatorName?: string;
    studentsEnrolled?: number;
  })[];
  products: Product[];
}

type TabKey = "tests" | "liveTests" | "products" | "courses";

const TABS: { key: TabKey; label: string }[] = [
  { key: "tests", label: "Mock Tests" },
  { key: "liveTests", label: "Live Tests" },
  { key: "products", label: "Study Notes" },
  { key: "courses", label: "Courses" },
];

const ExpertDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("tests");
  const [mainTab, setMainTab] = useState<"content" | "about">("content");
  const [liveTestsCanonicalMap, setLiveTestsCanonicalMap] = useState<
    Record<number, Partial<LiveTest>>
  >({});
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const fetchExpertDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/_api/teachers/profile?teacherSlug=${slug}`,
        );
        const json = await response.json();
        const payload = json.json || json;
        setData(payload);
      } catch (error: any) {
        console.error("Error fetching expert details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchExpertDetails();
  }, [slug]);

  useEffect(() => {
    const ids = (data?.liveTests || []).map((t) => t.id).filter(Boolean);
    if (ids.length === 0) {
      setLiveTestsCanonicalMap({});
      return;
    }

    const fetchCanonicalLiveTests = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/_api/live-tests/list?status=`,
        );
        const json = await response.json();
        const payload = json.json || json;
        const list: LiveTest[] = payload.tests || [];

        const idSet = new Set(ids);
        const nextMap: Record<number, Partial<LiveTest>> = {};

        list.forEach((item) => {
          if (idSet.has(item.id)) {
            nextMap[item.id] = item;
          }
        });

        setLiveTestsCanonicalMap(nextMap);
      } catch (error) {
        console.error("Error fetching canonical live tests:", error);
        setLiveTestsCanonicalMap({});
      }
    };

    fetchCanonicalLiveTests();
  }, [data?.liveTests]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${data?.teacher?.displayName} on TestKart!\n${BASE_URL}/expert/${slug}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (!data?.teacher) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-900 items-center justify-center px-10">
        <Text className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">
          Expert profile not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { teacher, tests, liveTests, products, courses } = data;

  const activeSocialLinks = [
    {
      key: "youtube",
      icon: "logo-youtube",
      url: teacher.socialLinks?.youtube,
      color: "#FF0000",
      bg: "#FFF0F0",
      darkBg: "rgba(255,0,0,0.1)",
    },
    {
      key: "instagram",
      icon: "logo-instagram",
      url: teacher.socialLinks?.instagram,
      color: "#E1306C",
      bg: "#FFF0F5",
      darkBg: "rgba(225,48,108,0.1)",
    },
    {
      key: "facebook",
      icon: "logo-facebook",
      url: teacher.socialLinks?.facebook,
      color: "#1877F2",
      bg: "#F0F5FF",
      darkBg: "rgba(24,119,242,0.1)",
    },
    {
      key: "twitter",
      icon: "logo-twitter",
      url: teacher.socialLinks?.twitter,
      color: "#1DA1F2",
      bg: "#F0FAFF",
      darkBg: "rgba(29,161,242,0.1)",
    },
    {
      key: "linkedin",
      icon: "logo-linkedin",
      url: teacher.socialLinks?.linkedin,
      color: "#0A66C2",
      bg: "#EEF4FF",
      darkBg: "rgba(10,102,194,0.1)",
    },
  ].filter((s) => !!s.url);

  const tabCounts: Record<TabKey, number> = {
    tests: tests?.length || 0,
    liveTests: liveTests?.length || 0,
    products: products?.length || 0,
    courses: courses?.length || 0,
  };

  const totalStudents =
    (tests || []).reduce((acc, t) => acc + (t.studentsEnrolled || 0), 0) +
    (liveTests || []).reduce(
      (acc, t) => acc + (t.studentsEnrolled || t.enrolledCount || 0),
      0,
    );

  const mapToLiveCardTest = (liveTest: Data["liveTests"][number]): LiveTest => {
    const canonical = liveTestsCanonicalMap[liveTest.id] || {};
    const merged = { ...liveTest, ...canonical };

    const startTime =
      merged.startTime || new Date(now + 60 * 60 * 1000).toISOString();
    const endTime =
      merged.endTime || new Date(now + 2 * 60 * 60 * 1000).toISOString();

    return {
      id: merged.id,
      title: merged.title || liveTest.title,
      description: merged.description || "",
      price: merged.price ?? 0,
      startTime,
      endTime,
      registrationDeadline: merged.registrationDeadline || null,
      maxSeats: merged.maxSeats ?? 0,
      enrolledCount: merged.enrolledCount ?? merged.studentsEnrolled ?? 0,
      thumbnailUrl: merged.thumbnailUrl || null,
      hasPrizes: merged.hasPrizes ?? false,
      mockTestId: merged.mockTestId ?? merged.id,
      teacherName:
        merged.teacherName || merged.creatorName || teacher.displayName,
      teacherIsVerified: merged.teacherIsVerified ?? teacher.isVerified,
      durationMinutes: Number(merged.durationMinutes ?? 0),
      language: merged.language || "English",
      examSlug: merged.examSlug || "mock-test",
      actualQuestionCount: String(merged.actualQuestionCount ?? 0),
      subjects:
        merged.subjects ||
        (merged.examSlug ? merged.examSlug.replace(/-/g, " ") : "General"),
      status: merged.status || "upcoming",
      isEnrolled: merged.isEnrolled ?? false,
      hasAttempted: merged.hasAttempted ?? false,
      rating: merged.rating ?? null,
      reviewsCount: merged.reviewsCount,
      totalPrizePool: merged.totalPrizePool,
      firstPrize: merged.firstPrize,
      secondPrize: merged.secondPrize,
      thirdPrize: merged.thirdPrize,
    };
  };

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <SafeAreaView edges={["top", "left", "right"]} className="flex-1">
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          {/* ── Hero Card ─────────────────────────────── */}
          <View className="mx-5 mt-4 bg-white dark:bg-slate-800 rounded-[32px] overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm">
            {/* Cover strip */}
            <View className="h-20 bg-orange-500">
              <TouchableOpacity
                onPress={handleShare}
                className="absolute right-5 top-4 w-11 h-11 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-white/70 dark:border-slate-600 items-center justify-center shadow-sm"
              >
                <Feather
                  name="share-2"
                  size={17}
                  color={colorScheme === "dark" ? "#CBD5E1" : "#475569"}
                />
              </TouchableOpacity>
            </View>

            <View className="px-5 pb-6">
              {/* Avatar */}
              <View className="-mt-10 mb-4">
                <View className="w-20 h-20 rounded-[24px] border-4 border-white dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-md">
                  <Image
                    source={{
                      uri:
                        teacher.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.displayName)}&size=200&background=FF8A50&color=fff`,
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>

              {/* Name & verified badge */}
              <View className="flex-row items-center mb-0.5">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mr-2">
                  {teacher.displayName}
                </Text>
                {teacher.isVerified && (
                  <MaterialIcons name="verified" size={20} color="#22C55E" />
                )}
              </View>

              {/* Current Role/Expertise */}
              {teacher.workExperiences?.length > 0 &&
                (() => {
                  const exp = teacher.workExperiences[0];
                  return (
                    <Text className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">
                      {exp.position}
                      {!!exp.companyName && ` at ${exp.companyName}`}
                    </Text>
                  );
                })()}

              {!!teacher.tagline && (
                <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-3">
                  {teacher.tagline}
                </Text>
              )}

              <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {!!teacher.location && (
                  <View className="flex-row items-center">
                    <Feather name="map-pin" size={13} color="#94a3b8" />
                    <Text className="ml-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {teacher.location}
                    </Text>
                  </View>
                )}
                {!!teacher.responseTime && (
                  <View className="flex-row items-center">
                    <Feather name="clock" size={13} color="#94a3b8" />
                    <Text className="ml-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      Responds in {teacher.responseTime}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Stats Row ─────────────────────────────── */}
          <View className="mx-5 mt-4 flex-row" style={{ gap: 10 }}>
            {[
              {
                label: "Tests",
                value: tabCounts.tests + tabCounts.liveTests,
                icon: "file-text" as const,
              },
              {
                label: "Notes",
                value: tabCounts.products,
                icon: "book-open" as const,
              },
              {
                label: "Courses",
                value: tabCounts.courses,
                icon: "play-circle" as const,
              },
              {
                label: "Students",
                value:
                  totalStudents > 999
                    ? `${(totalStudents / 1000).toFixed(1)}k`
                    : String(totalStudents),
                icon: "users" as const,
              },
            ].map((stat) => (
              <View
                key={stat.label}
                className="flex-1 bg-white dark:bg-slate-800 rounded-[20px] py-3 px-2 items-center border border-gray-100 dark:border-slate-700 shadow-sm"
              >
                <View className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-1.5">
                  <Feather name={stat.icon} size={15} color="#FF8A50" />
                </View>
                <Text className="text-lg font-black text-slate-800 dark:text-white leading-none">
                  {stat.value}
                </Text>
                <Text className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Main Tabs (Content / About) ───────────── */}
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 20,
              flexDirection: "row",
              backgroundColor: colorScheme === "dark" ? "#1e293b" : "#f1f5f9",
              borderRadius: 16,
              padding: 4,
            }}
          >
            {(["content", "about"] as const).map((key) => {
              const isActive = mainTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setMainTab(key)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isActive
                      ? colorScheme === "dark"
                        ? "#334155"
                        : "#ffffff"
                      : "transparent",
                    shadowColor: isActive ? "#000" : "transparent",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isActive ? 0.05 : 0,
                    shadowRadius: isActive ? 1 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "900",
                      color: isActive
                        ? "#f97316"
                        : colorScheme === "dark"
                          ? "#94a3b8"
                          : "#64748b",
                    }}
                  >
                    {key === "content" ? "Content" : "About"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {mainTab === "about" && !!teacher.bio && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-3">
                About
              </Text>
              <Text className="text-slate-600 dark:text-slate-300 text-sm leading-6">
                {teacher.bio}
              </Text>
            </View>
          )}

          {/* ── Social Links ──────────────────────────── */}
          {mainTab === "about" && activeSocialLinks.length > 0 && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-3">
                Connect
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {activeSocialLinks.map((social) => (
                  <TouchableOpacity
                    key={social.key}
                    onPress={() => Linking.openURL(social.url!)}
                    className="w-12 h-12 rounded-2xl items-center justify-center border border-gray-100 dark:border-slate-700"
                    style={{
                      backgroundColor:
                        colorScheme === "dark" ? social.darkBg : social.bg,
                    }}
                  >
                    <Ionicons
                      name={social.icon as any}
                      size={22}
                      color={social.color}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Expertise Areas ───────────────────────── */}
          {mainTab === "about" && teacher.expertiseAreas?.length > 0 && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-3">
                Expertise
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {teacher.expertiseAreas.map((area, i) => (
                  <View
                    key={i}
                    className="px-4 py-2 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30"
                  >
                    <Text className="text-primary font-black text-xs uppercase tracking-wider">
                      {area}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Languages ─────────────────────────────── */}
          {mainTab === "about" && teacher.languages?.length > 0 && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-3">
                Languages
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {teacher.languages.map((lang, i) => (
                  <View
                    key={i}
                    className="px-4 py-2 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800/30"
                  >
                    <Text className="text-cyan-600 dark:text-cyan-400 font-black text-xs uppercase tracking-wider">
                      {lang}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Work Experience ───────────────────────── */}
          {mainTab === "about" && teacher.workExperiences?.length > 0 && (
            <View className="mx-5 mt-6">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-3">
                  <Feather name="briefcase" size={16} color="#FF8A50" />
                </View>
                <Text className="text-xl font-black text-slate-800 dark:text-white">
                  Work Experience
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {teacher.workExperiences.map((exp: any, i: number) => {
                  const formatDate = (date: any) => {
                    if (!date) return "";
                    try {
                      const d = new Date(date);
                      if (!isNaN(d.getTime())) {
                        return d.toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        });
                      }
                      return date.toString();
                    } catch {
                      return date?.toString() || "";
                    }
                  };

                  const title = exp.position;
                  const org = exp.companyName;
                  const loc = exp.location;
                  const start = formatDate(exp.startDate);
                  const end = exp.endDate ? formatDate(exp.endDate) : "Present";

                  if (!title && !org) return null;

                  return (
                    <View
                      key={i}
                      className="bg-slate-50 dark:bg-slate-800/50 rounded-[24px] p-5 border border-gray-100 dark:border-slate-700 shadow-sm"
                    >
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 mr-2">
                          <Text className="text-base font-black text-slate-800 dark:text-white leading-tight">
                            {title}
                          </Text>
                          <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            {org}
                            {!!loc && ` • ${loc}`}
                          </Text>
                        </View>
                        <View className="px-3 py-1 rounded-full bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600">
                          <Text className="text-[10px] font-black text-primary uppercase">
                            {start} {start && end ? "–" : ""} {end}
                          </Text>
                        </View>
                      </View>

                      {!!exp.description && (
                        <View className="mt-2 pt-2 border-t border-gray-200/50 dark:border-slate-700/50">
                          <Text className="text-sm text-slate-500 dark:text-slate-400 leading-5 italic">
                            {exp.description}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Awards & Certificates ─────────────────── */}
          {mainTab === "about" && teacher.awardsCertificates?.length > 0 && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">
                Awards & Certificates
              </Text>
              <View style={{ gap: 12 }}>
                {teacher.awardsCertificates.map((award, i) => (
                  <View
                    key={i}
                    className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-gray-100 dark:border-slate-700 shadow-sm flex-row items-start"
                  >
                    <View className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 items-center justify-center mr-4 mt-0.5 shrink-0">
                      <Feather name="award" size={18} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-black text-slate-800 dark:text-white leading-tight">
                        {award.title}
                      </Text>
                      {!!award.description && (
                        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-5">
                          {award.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Content Tabs ──────────────────────────── */}
          {mainTab === "content" && (
            <View className="mt-4">
              {/* Tab Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                className="mb-5"
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      className={`px-5 py-2.5 rounded-2xl border flex-row items-center ${
                        isActive
                          ? "bg-primary border-primary"
                          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`font-black text-sm ${
                          isActive
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {tab.label}
                      </Text>
                      <View
                        className={`ml-2 px-1.5 py-0.5 rounded-lg ${
                          isActive
                            ? "bg-white/20"
                            : "bg-orange-50 dark:bg-orange-900/20"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-black ${isActive ? "text-white" : "text-primary"}`}
                        >
                          {tabCounts[tab.key]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Tab Content */}
              {activeTab === "tests" && (
                <View>
                  {tests?.length > 0 ? (
                    tests.map((test) => (
                      <MockTestCard key={test.id} test={test} />
                    ))
                  ) : (
                    <EmptyState label="No mock tests yet" />
                  )}
                </View>
              )}

              {activeTab === "liveTests" && (
                <View>
                  {liveTests?.length > 0 ? (
                    <View className="px-5">
                      {liveTests.map((test) => (
                        <LiveTestCard
                          key={test.id}
                          test={mapToLiveCardTest(test)}
                          colorScheme={colorScheme}
                        />
                      ))}
                    </View>
                  ) : (
                    <EmptyState label="No live tests yet" />
                  )}
                </View>
              )}

              {activeTab === "products" && (
                <View>
                  {products?.length > 0 ? (
                    <View className="px-5">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState label="No study notes yet" />
                  )}
                </View>
              )}

              {activeTab === "courses" && (
                <View className="px-5">
                  {courses?.length > 0 ? (
                    courses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))
                  ) : (
                    <EmptyState label="No courses yet" />
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const EmptyState = ({ label }: { label: string }) => (
  <View className="items-center py-12 px-10">
    <View className="w-16 h-16 rounded-[20px] bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
      <Feather name="inbox" size={28} color="#94a3b8" />
    </View>
    <Text className="text-slate-400 dark:text-slate-500 font-bold text-center">
      {label}
    </Text>
  </View>
);

export default ExpertDetails;
