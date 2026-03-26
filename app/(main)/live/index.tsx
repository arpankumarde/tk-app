import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useCountdown } from "@/hooks/useCountdown";

export interface ExamData {
  categories: Category[];
}

export interface Category {
  id: number;
  categoryName: string;
  categorySlug: string;
  orderIndex: number;
  createdAt: string;
  exams: Exam[];
}

export interface Exam {
  id: number;
  categoryId: number;
  examName: string;
  fullName: string;
  examSlug: string;
  description: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  aiGenerationPrompt?: string | null;
}

export interface LiveTest {
  id: number;
  title: string;
  description: string;
  price: number;
  startTime: string;
  endTime: string;
  registrationDeadline: string | null;
  maxSeats: number;
  enrolledCount: number;
  thumbnailUrl: string | null;
  hasPrizes: boolean;
  totalPrizePool?: number;
  firstPrize?: number;
  secondPrize?: number;
  thirdPrize?: number;
  mockTestId: number;
  teacherName: string;
  teacherIsVerified: boolean;
  durationMinutes: number;
  language: string | null;
  examSlug: string;
  actualQuestionCount: string;
  subjects: string;
  status: string;
  isEnrolled: boolean;
  hasAttempted: boolean;
}

export interface LiveTestResponse {
  tests: LiveTest[];
  total: number;
  page: number;
  limit: number;
}

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;


const LiveTestCard = ({
  test,
  colorScheme,
}: {
  test: LiveTest;
  colorScheme: "light" | "dark" | undefined;
}) => {
  const enrollmentProgress = Math.min(
    (test.enrolledCount / test.maxSeats) * 100,
    100,
  );

  const isLive =
    test.status?.toLowerCase().includes("live") ||
    (new Date(test.startTime) <= new Date() &&
      new Date(test.endTime) >= new Date());

  const timeLeft = useCountdown(isLive ? test.endTime : null);

  return (
    <View
      className="bg-white dark:bg-slate-900 rounded-[32px] mb-8 p-3.5 border border-gray-100 dark:border-slate-800"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 6,
      }}
    >
      {/* Top Badges Row */}
      <View className="flex-row justify-between mb-2.5 px-1">
        <View className="bg-orange-50 dark:bg-orange-950/30 px-3.5 py-1.5 rounded-full border border-orange-100/50 dark:border-orange-900/30">
          <Text className="text-orange-500 dark:text-orange-400 font-black text-[10px] uppercase tracking-widest">
            {test.examSlug?.replace(/-/g, " ").toUpperCase() || "MOCK TEST"}
          </Text>
        </View>
        <View className="bg-cyan-50 dark:bg-cyan-950/30 px-3.5 py-1.5 rounded-full border border-cyan-100/50 dark:border-cyan-900/30">
          <Text className="text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase tracking-widest">
            {test.language?.toUpperCase() || "ENGLISH"}
          </Text>
        </View>
      </View>

      {/* Inset Image */}
      <View className="relative aspect-video w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
        <Image
          source={{
            uri:
              test.thumbnailUrl ||
              "https://ik.imagekit.io/testkart/placeholders/live.png",
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Floating LIVE Badge on Image */}
        {isLive && (
          <View className="absolute top-3 right-3">
            <View className="bg-red-500 px-2.5 py-1 rounded-full flex-row items-center border border-red-400 shadow-sm">
              <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
              <Text className="text-white font-black text-[9px] uppercase">LIVE</Text>
            </View>
          </View>
        )}

        {/* Floating Plus button from reference */}
        <View className="absolute bottom-4 right-4 bg-orange-500/90 w-11 h-11 rounded-2xl items-center justify-center shadow-lg">
          <Feather name="plus" size={24} color="white" />
        </View>
      </View>

      <View className="px-1.5">
        {/* Title */}
        <Text className="text-[22px] font-black text-slate-800 dark:text-white mb-2 leading-tight">
          {test.title}
        </Text>

        {/* Teacher & Rating Info Row */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center">
            <Text className="text-slate-400 dark:text-slate-500 text-sm font-bold">
              By:{" "}
            </Text>
            <Text className="text-slate-600 dark:text-slate-300 text-sm font-black">
              {test.teacherName}
            </Text>
            {test.teacherIsVerified && (
              <MaterialIcons
                name="check-circle"
                size={16}
                color="#F97316"
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
          
          <View className="flex-row items-center">
            <MaterialIcons name="star-outline" size={16} color="#F97316" />
            <Text className="ml-1 text-orange-500 font-black text-sm">5.0</Text>
            <Text className="ml-1 text-slate-400 text-xs">(0 reviews)</Text>
          </View>
        </View>

        {/* Vertical Icon Stats */}
        <View className="gap-y-3 mb-6">
          <View className="flex-row items-center">
            <Feather name="file-text" size={17} color="#F97316" />
            <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
              Questions: <Text className="text-slate-800 dark:text-white font-black">{test.actualQuestionCount}</Text>
            </Text>
          </View>

          <View className="flex-row items-center">
            <Feather name="clock" size={17} color="#F97316" />
            <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
              Total Time: <Text className="text-slate-800 dark:text-white font-black">{test.durationMinutes} Minutes</Text>
            </Text>
          </View>

          <View className="flex-row items-center">
            <Feather name="book-open" size={17} color="#F97316" />
            <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm" numberOfLines={1}>
              Subjects: <Text className="text-slate-800 dark:text-white font-black">{test.subjects}</Text>
            </Text>
          </View>

          <View className="flex-row items-center">
            <Feather name="users" size={17} color="#F97316" />
            <Text className="ml-3 text-slate-500 dark:text-slate-400 font-bold text-sm">
              Students Enrolled: <Text className="text-slate-800 dark:text-white font-black">{test.enrolledCount}</Text>
            </Text>
          </View>

          {/* Ends In Highlighter */}
          {timeLeft && (
            <View className="bg-orange-50 dark:bg-orange-950/20 px-4 py-3 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex-row items-center mt-1">
              <Feather name="activity" size={15} color="#F59E0B" />
              <Text className="ml-3 text-orange-600 dark:text-orange-400 font-black text-sm">
                Ends in: <Text className="text-orange-500 dark:text-orange-300">{timeLeft}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-[1px] bg-slate-100 dark:bg-slate-800 mb-6" />

        {/* Footer Row: CTA */}
        <View className="items-center justify-center">
          <TouchableOpacity
            className="w-full bg-orange-500 items-center justify-center py-4 rounded-2xl flex-row shadow-sm shadow-orange-500/40"
            onPress={() => router.push(`/live/${test.id}` as any)}
          >
            <Feather name="eye" size={20} color="white" />
            <Text className="text-white text-lg font-black ml-3">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


const LiveTests = () => {
  const { colorScheme } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Live Tests states
  const [tests, setTests] = useState<LiveTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const statusOptions = ["All", "Live Now", "Upcoming", "Ended"];

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = `${BASE_URL}/_api/exams/list`;

      console.log("Fetching exams from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const payload = data.json || data;
      const categoriesData = payload.categories || data.categories;

      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error("Fetch Exams Error:", err);
      setError("Failed to load exams. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      setLoadingTests(true);
      const statusParam =
        statusFilter === "All"
          ? ""
          : statusFilter.toLowerCase().replace(/ /g, "-");
      let apiUrl = `${BASE_URL}/_api/live-tests/list?status=${statusParam}`;

      if (selectedExam) {
        apiUrl += `&exam=${selectedExam.examSlug}`;
      }

      if (searchQuery) {
        apiUrl += `&search=${encodeURIComponent(searchQuery)}`;
      }

      console.log("Fetching live tests from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const payload = data.json || data;
      const testsData = payload.tests || [];

      setTests(testsData);
    } catch (err) {
      console.log("Fetch Tests Error:", err);
    } finally {
      setLoadingTests(false);
    }
  }, [statusFilter, selectedExam, searchQuery]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <Header />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-white dark:bg-slate-900"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Text Section */}
        <View className="px-6 pt-8 pb-6">
          <View className="self-start bg-orange-100 dark:bg-orange-900/30 px-4 py-1.5 rounded-full mb-4 border border-orange-200 dark:border-orange-800/40">
            <Text className="text-primary text-[11px] font-black uppercase tracking-widest">
              Real-time Exams
            </Text>
          </View>
          <Text className="text-4xl font-black text-slate-800 dark:text-white leading-[48px]">
            Live Competitive Tests
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-4 text-lg font-medium leading-8">
            Experience the thrill of real exams. Compete with thousands of
            students.
          </Text>
        </View>

        {/* Filter Card Container */}
        <View className="px-6">
          <View className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
            {/* Search Input */}
            <View className="flex-row items-center bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 h-14 mb-4">
              <Feather
                name="search"
                size={20}
                color={colorScheme === "dark" ? "#64748b" : "#94a3b8"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tests..."
                placeholderTextColor={
                  colorScheme === "dark" ? "#64748b" : "#94a3b8"
                }
                className="flex-1 ml-3 text-slate-900 dark:text-white text-base font-semibold"
              />
            </View>

            {/* Exam Selector */}
            <TouchableOpacity
              onPress={() => setShowExamModal(true)}
              className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 h-14 mb-4"
            >
              <View className="flex-1 mr-4">
                <Text
                  numberOfLines={1}
                  className={`text-base font-bold ${selectedExam ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                >
                  {selectedExam
                    ? selectedExam.fullName || selectedExam.examName
                    : "Select Exam Category"}
                </Text>
              </View>
              <Feather name="chevron-down" size={18} color="#FF8A50" />
            </TouchableOpacity>

            {/* Status Filter */}
            <TouchableOpacity
              onPress={() => setShowStatusModal(true)}
              className="flex-row items-center justify-between bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-5 h-14"
            >
              <Text className="text-base font-bold text-slate-800 dark:text-white">
                {statusFilter}
              </Text>
              <Feather name="chevron-down" size={18} color="#FF8A50" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-6 py-8">
          {loading || loadingTests ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#FF8A50" />
              <Text className="mt-4 text-slate-500 dark:text-slate-400 font-bold">
                Finding best tests for you...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center px-4 py-20">
              <Text className="text-red-500 text-center font-bold text-lg mb-4">
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  fetchExams();
                  fetchTests();
                }}
                className="bg-primary px-8 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : tests.length > 0 ? (
            <View>
              {tests.map((test) => (
                <LiveTestCard
                  key={test.id}
                  test={test}
                  colorScheme={colorScheme}
                />
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <View className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
                <Feather
                  name="search"
                  size={48}
                  color={colorScheme === "dark" ? "#475569" : "#cbd5e1"}
                />
              </View>
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-3 text-center">
                No Live Tests Found
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-center text-lg font-medium leading-7">
                {selectedExam
                  ? `We couldn't find any live tests for ${selectedExam.fullName || selectedExam.examName}.`
                  : "There are no live tests matching your criteria at the moment."}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacer for Nav */}
        <View className="h-10" />
      </ScrollView>

      {/* Exam Selection Modal */}
      <Modal
        visible={showExamModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExamModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Pressable
            onPress={() => setShowExamModal(false)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />

          <View
            style={{
              backgroundColor: colorScheme === "dark" ? "#1e293b" : "white",
              borderRadius: 24,
              width: "100%",
              maxHeight: "80%",
              overflow: "hidden",
            }}
          >
            {/* List */}
            <ScrollView
              style={{ width: "100%" }}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedExam(null);
                  setShowExamModal(false);
                }}
                style={{
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor:
                    colorScheme === "dark" ? "#334155" : "#f1f5f9",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: !selectedExam
                      ? "#FF8A50"
                      : colorScheme === "dark"
                        ? "#cbd5e1"
                        : "#334155",
                  }}
                >
                  All Exams
                </Text>
                {!selectedExam && (
                  <Feather name="check" size={20} color="#FF8A50" />
                )}
              </TouchableOpacity>

              {categories.map((category) => (
                <View key={`cat-${category.id}`}>
                  {(category.exams || []).map((exam) => (
                    <TouchableOpacity
                      key={`exam-${exam.id}`}
                      onPress={() => {
                        console.log("Selected:", exam.examName);
                        setSelectedExam(exam);
                        setShowExamModal(false);
                      }}
                      style={{
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor:
                          colorScheme === "dark" ? "#334155" : "#f1f5f9",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 15 }}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "bold",
                            color:
                              selectedExam?.id === exam.id
                                ? "#FF8A50"
                                : colorScheme === "dark"
                                  ? "#cbd5e1"
                                  : "#334155",
                          }}
                        >
                          {exam.fullName || exam.examName}
                        </Text>
                      </View>
                      {selectedExam?.id === exam.id && (
                        <Feather name="check" size={20} color="#FF8A50" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Pressable
            onPress={() => setShowStatusModal(false)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />

          <View
            style={{
              backgroundColor: colorScheme === "dark" ? "#1e293b" : "white",
              borderRadius: 24,
              width: "100%",
              maxHeight: "40%",
              overflow: "hidden",
            }}
          >
            <ScrollView>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setShowStatusModal(false);
                  }}
                  style={{
                    padding: 20,
                    borderBottomWidth: 1,
                    borderBottomColor:
                      colorScheme === "dark" ? "#334155" : "#f1f5f9",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor:
                      statusFilter === status
                        ? colorScheme === "dark"
                          ? "#334155"
                          : "#f8fafc"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color:
                        statusFilter === status
                          ? "#FF8A50"
                          : colorScheme === "dark"
                            ? "#cbd5e1"
                            : "#334155",
                    }}
                  >
                    {status}
                  </Text>
                  {statusFilter === status && (
                    <Feather name="check" size={20} color="#FF8A50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Persistent Nav */}
      <BottomTabs />
    </SafeAreaView>
  );
};

export default LiveTests;
