import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Share,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/components/Header";
import MockTestCard from "@/components/MockTestCard";
import ProductCard from "@/components/ProductCard";
import CourseCard from "@/components/CourseCard";

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
    title: string;
    organization: string;
    startYear: string;
    endYear: string | null;
    description: string;
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
  examName: string;
  language: string | null;
  teacherName: string;
  teacherIsVerified: boolean;
  actualQuestionCount: number;
  isEnrolled: boolean;
  examSlug: string;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  pdfUrl: string;
  category: string;
  price: number;
  rating: number | null;
  totalPurchases: number;
  publishedAt: string;
  language: string;
  teacherName: string;
  teacherAvatar: string;
  teacherSlug: string;
  teacherIsVerified: boolean;
}

interface Data {
  teacher: Teacher;
  courses: any[];
  tests: Test[];
  liveTests: Test[];
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

  const totalStudents = [...(tests || []), ...(liveTests || [])].reduce(
    (acc, t) => acc + (t.studentsEnrolled || 0),
    0,
  );

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
              <View className="flex-row items-center mb-1">
                <Text className="text-2xl font-black text-slate-800 dark:text-white mr-2">
                  {teacher.displayName}
                </Text>
                {teacher.isVerified && (
                  <MaterialIcons name="verified" size={20} color="#22C55E" />
                )}
              </View>

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
                label: "Students",
                value:
                  totalStudents > 999
                    ? `${(totalStudents / 1000).toFixed(1)}k`
                    : String(totalStudents),
                icon: "users" as const,
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

          {/* ── About ─────────────────────────────────── */}
          {!!teacher.bio && (
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
          {activeSocialLinks.length > 0 && (
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
          {teacher.expertiseAreas?.length > 0 && (
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
          {teacher.languages?.length > 0 && (
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
          {teacher.workExperiences?.length > 0 && (
            <View className="mx-5 mt-6">
              <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">
                Experience
              </Text>
              <View style={{ gap: 12 }}>
                {teacher.workExperiences.map((exp, i) => (
                  <View
                    key={i}
                    className="bg-white dark:bg-slate-800 rounded-[24px] p-5 border border-gray-100 dark:border-slate-700 shadow-sm flex-row items-start"
                  >
                    <View className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4 mt-0.5 shrink-0">
                      <Feather name="briefcase" size={18} color="#FF8A50" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-black text-slate-800 dark:text-white leading-tight">
                        {exp.title}
                      </Text>
                      <Text className="text-sm font-bold text-primary mt-0.5">
                        {exp.organization}
                      </Text>
                      <Text className="text-xs text-slate-400 font-semibold mt-1">
                        {exp.startYear} — {exp.endYear || "Present"}
                      </Text>
                      {!!exp.description && (
                        <Text className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-5">
                          {exp.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Awards & Certificates ─────────────────── */}
          {teacher.awardsCertificates?.length > 0 && (
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
                      <Ionicons name="trophy" size={18} color="#f59e0b" />
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
          <View className="mt-8">
            <View className="h-[1px] bg-gray-100 dark:bg-slate-800 mb-5" />
            <Text className="text-xl font-black text-slate-800 dark:text-white mb-4 px-5">
              Content by {teacher.displayName}
            </Text>

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
                    <MockTestCard key={test.id} test={test as any} />
                  ))
                ) : (
                  <EmptyState label="No mock tests yet" />
                )}
              </View>
            )}

            {activeTab === "liveTests" && (
              <View>
                {liveTests?.length > 0 ? (
                  liveTests.map((test) => (
                    <MockTestCard key={test.id} test={test} />
                  ))
                ) : (
                  <EmptyState label="No live tests yet" />
                )}
              </View>
            )}

            {activeTab === "products" && (
              <View>
                {products?.length > 0 ? (
                  products.map((product) => (
                    <ProductCard key={product.id} product={product as any} />
                  ))
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
