import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useColorScheme } from "nativewind";

const LiveTests = () => {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      <Header />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-white dark:bg-slate-900"
      >
        {/* Hero Text Section */}
        <View className="px-6 py-10 items-center">
          <Text className="text-4xl font-bold text-slate-800 dark:text-white text-center leading-tight">
            Live Competitive{"\n"}Tests
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center mt-4 text-base leading-6 px-2">
            Experience the thrill of real exams. Compete with thousands of
            students in real-time and get instant performance analysis.
          </Text>
        </View>

        {/* Filter Card Container */}
        <View className="px-5">
          <View className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            {/* Search Input */}
            <View className="flex-row items-center border border-gray-200 dark:border-slate-600 rounded-xl px-4 h-14 mb-4 bg-gray-50 dark:bg-slate-700/50">
              <Feather
                name="search"
                size={20}
                color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
              />
              <TextInput
                placeholder="Search by title..."
                placeholderTextColor={
                  colorScheme === "dark" ? "#64748b" : "#94a3b8"
                }
                className="flex-1 ml-3 text-slate-900 dark:text-white text-base"
              />
            </View>

            {/* Exam Selector */}
            <TouchableOpacity className="flex-row items-center justify-between border border-gray-200 dark:border-slate-600 rounded-xl px-4 h-14 mb-4 bg-white dark:bg-slate-700/30">
              <Text className="text-slate-600 dark:text-slate-300 text-base">
                All Exams
              </Text>
              <Feather
                name="chevron-down"
                size={20}
                color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>

            {/* General Filter Selector */}
            <TouchableOpacity className="flex-row items-center justify-between border border-gray-200 dark:border-slate-600 rounded-xl px-4 h-14 bg-white dark:bg-slate-700/30">
              <Text className="text-slate-600 dark:text-slate-300 text-base">
                All
              </Text>
              <Feather
                name="chevron-down"
                size={20}
                color={colorScheme === "dark" ? "#94a3b8" : "#64748b"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty State Section */}
        <View className="flex-1 items-center justify-center px-8 py-16">
          <View className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full items-center justify-center mb-6">
            <Feather
              name="search"
              size={48}
              color={colorScheme === "dark" ? "#475569" : "#cbd5e1"}
            />
          </View>
          <Text className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            No Live Tests Found
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-base leading-6">
            There are no live tests matching your criteria. Please check back
            later or adjust your filters.
          </Text>
        </View>

        {/* Bottom Spacer for Nav */}
        <View className="h-10" />
      </ScrollView>

      {/* Persistent Nav */}
      <BottomTabs />
    </SafeAreaView>
  );
};

export default LiveTests;
