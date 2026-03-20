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
import { Feather } from "@expo/vector-icons";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";

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
  const enrollmentProgress = (test.enrolledCount / test.maxSeats) * 100;

  return (
    <View className="bg-white dark:bg-slate-800 rounded-[32px] mb-6 shadow-md border border-gray-100 dark:border-slate-800 overflow-hidden">
      <View className="h-48 w-full bg-slate-100 dark:bg-slate-900">
        <Image
          source={{
            uri:
              test.thumbnailUrl ||
              "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png",
          }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="p-6">
        {/* Status Badge */}
        <View className="items-center mb-4">
          <View className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 px-10 py-2 rounded-full">
            <Text className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
              {test.status}
            </Text>
          </View>
        </View>

        {/* Title & Teacher */}
        <Text className="text-2xl font-black text-slate-800 dark:text-white mb-2">
          {test.title}
        </Text>
        <View className="flex-row items-center mb-6">
          <Text className="text-slate-500 dark:text-slate-400 text-base">
            By: {test.teacherName}
          </Text>
          {test.teacherIsVerified && (
            <View className="ml-1.5 bg-orange-500 rounded-full p-0.5">
              <Feather name="check" size={10} color="white" />
            </View>
          )}
        </View>

        {/* Details Grid */}
        <View className="space-y-4 mb-8">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4">
              <Feather name="clock" size={20} color="#FF8A50" />
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-slate-500 dark:text-slate-400 text-base">
                Duration:{" "}
              </Text>
              <Text className="text-slate-800 dark:text-white text-base font-black">
                {test.durationMinutes} Minutes
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4">
              <Feather name="file-text" size={20} color="#FF8A50" />
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-slate-500 dark:text-slate-400 text-base">
                Questions:{" "}
              </Text>
              <Text className="text-slate-800 dark:text-white text-base font-black">
                {test.actualQuestionCount}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4">
              <Feather name="book-open" size={20} color="#FF8A50" />
            </View>
            <View className="flex-row items-baseline flex-1">
              <Text className="text-slate-500 dark:text-slate-400 text-base">
                Subjects:{" "}
              </Text>
              <Text
                className="text-slate-800 dark:text-white text-base font-black flex-1"
                numberOfLines={1}
              >
                {test.subjects}
              </Text>
            </View>
          </View>
        </View>

        {/* Prize Pool Section */}
        {test.hasPrizes && (
          <View className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-3xl p-5 mb-8">
            <View className="flex-row items-center mb-4">
              <Feather name="award" size={24} color="#FF8A50" />
              <Text className="ml-3 text-lg font-black text-orange-800 dark:text-orange-400">
                Prize Pool: ₹{test.totalPrizePool}
              </Text>
            </View>

            <View className="flex-row space-x-3">
              {[
                { rank: "1ST", prize: test.firstPrize, icon: "award" },
                { rank: "2ND", prize: test.secondPrize, icon: "award" },
                { rank: "3RD", prize: test.thirdPrize, icon: "award" },
              ].map((p, i) => (
                <View
                  key={i}
                  className="flex-1 bg-white dark:bg-slate-800 border border-orange-50 dark:border-slate-700 rounded-2xl p-3 items-center"
                >
                  <Feather
                    name="award"
                    size={16}
                    color={
                      i === 0 ? "#FFC107" : i === 1 ? "#9E9E9E" : "#CD7F32"
                    }
                  />
                  <Text className="text-[10px] font-black text-slate-400 uppercase mt-1">
                    {p.rank}:
                  </Text>
                  <Text className="text-sm font-black text-slate-800 dark:text-white">
                    ₹{p.prize}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Enrollment Progress */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Feather name="users" size={16} color="#64748b" />
              <Text className="ml-2 text-slate-500 dark:text-slate-400 font-bold">
                {test.enrolledCount} / {test.maxSeats} Enrolled
              </Text>
            </View>
          </View>
          <View className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <View
              style={{ width: `${Math.min(enrollmentProgress, 100)}%` }}
              className="h-full bg-orange-500 rounded-full"
            />
          </View>
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          className="border border-primary rounded-2xl py-4 items-center"
          onPress={() => router.push(`/live/${test.id}` as any)}
        >
          <Text className="text-primary text-lg font-black">View Details</Text>
        </TouchableOpacity>
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
