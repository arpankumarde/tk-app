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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import LiveTestCard from "@/components/LiveTestCard";
import { useColorScheme } from "nativewind";

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
  rating?: number | null;
  reviewsCount?: number;
}

export interface LiveTestResponse {
  tests: LiveTest[];
  total: number;
  page: number;
  limit: number;
}

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const LIVE_TESTS_PAGE = 1;
const LIVE_TESTS_LIMIT = 12;

const LiveTests = () => {
  const { colorScheme } = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Live Tests states
  const [tests, setTests] = useState<LiveTest[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const statusOptions = ["All", "Live Now", "Upcoming", "Ended"];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      const statusMap: Record<string, string> = {
        All: "",
        "Live Now": "live",
        Upcoming: "upcoming",
        Ended: "ended",
      };
      const statusParam = statusMap[statusFilter] ?? "";
      let apiUrl = `${BASE_URL}/_api/live-tests/list?page=${LIVE_TESTS_PAGE}&limit=${LIVE_TESTS_LIMIT}`;

      if (statusParam) {
        apiUrl += `&status=${statusParam}`;
      }

      if (selectedExam) {
        const encodedExamSlug = encodeURIComponent(selectedExam.examSlug);
        apiUrl += `&exam=${encodedExamSlug}&examSlug=${encodedExamSlug}`;
      }

      if (debouncedSearchQuery) {
        apiUrl += `&searchQuery=${encodeURIComponent(debouncedSearchQuery)}`;
      }

      console.log("Fetching live tests from:", apiUrl);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const payload = data.json || data;
      const testsData = payload.tests || [];

      const normalizedSearch = debouncedSearchQuery.trim().toLowerCase();
      const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);

      const filteredTests = testsData.filter((test: LiveTest) => {
        const matchesExam = selectedExam
          ? test.examSlug === selectedExam.examSlug
          : true;

        if (!matchesExam) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          test.title,
          test.teacherName,
          test.subjects,
          test.examSlug,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchTerms.every((term) => searchableText.includes(term));
      });

      setTests(filteredTests);
    } catch (err) {
      console.log("Fetch Tests Error:", err);
    } finally {
      setLoadingTests(false);
    }
  }, [statusFilter, selectedExam, debouncedSearchQuery]);

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
        <View className="px-6 pt-6 pb-4">
          <View className="self-start bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full mb-3 border border-orange-200 dark:border-orange-800/40">
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
              Real-time Exams
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-slate-800 dark:text-white leading-9">
            Live Competitive Tests
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium leading-5">
            Experience the thrill of real exams. Compete with thousands of
            students.
          </Text>
        </View>

        {/* Filter Card Container */}
        <View className="px-6">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">
            {/* Search Input */}
            <View className="flex-row items-center bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 h-12 mb-3">
              <Feather
                name="search"
                size={18}
                color={colorScheme === "dark" ? "#64748b" : "#94a3b8"}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search tests..."
                placeholderTextColor={
                  colorScheme === "dark" ? "#64748b" : "#94a3b8"
                }
                className="flex-1 ml-3 text-slate-900 dark:text-white text-sm font-semibold"
              />
            </View>

            <View className="flex-row items-center gap-3">
              {/* Exam Selector */}
              <TouchableOpacity
                onPress={() => setShowExamModal(true)}
                className="flex-[1.8] flex-row items-center justify-between bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 h-12"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Feather
                    name="grid"
                    size={14}
                    color="#FF8A50"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    numberOfLines={1}
                    className={`text-[13px] font-bold flex-1 ${selectedExam ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {selectedExam
                      ? selectedExam.fullName || selectedExam.examName
                      : "Category"}
                  </Text>
                </View>
                <Feather name="chevron-down" size={14} color="#FF8A50" />
              </TouchableOpacity>

              {/* Status Filter */}
              <TouchableOpacity
                onPress={() => setShowStatusModal(true)}
                className="flex-1 flex-row items-center justify-between bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl px-4 h-12"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Feather
                    name="filter"
                    size={14}
                    color="#FF8A50"
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    numberOfLines={1}
                    className="text-[13px] font-bold text-slate-800 dark:text-white flex-1"
                  >
                    {statusFilter}
                  </Text>
                </View>
                <Feather name="chevron-down" size={14} color="#FF8A50" />
              </TouchableOpacity>
            </View>
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
