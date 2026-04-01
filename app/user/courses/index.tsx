import {
  View,
  Text,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";
import { useEnrolledCourses } from "../_hooks/useEnrolledCourses";
import EnrolledCourseCard from "../_components/EnrolledCourseCard";

export default function EnrolledCoursesScreen() {
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();
  const { courses, loading, total, refetch } = useEnrolledCourses(token, {
    limit: 50,
  });

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-white dark:bg-slate-950"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <Header />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        <View className="px-6 pt-6">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-1">
            My Courses
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-6">
            {total} enrolled course{total !== 1 ? "s" : ""}
          </Text>

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : courses.length > 0 ? (
            courses.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
              <Feather name="book" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">
                No enrolled courses yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
