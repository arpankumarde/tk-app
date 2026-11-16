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
import Feather from "@react-native-vector-icons/feather";
import { useColorScheme } from "nativewind";
import DetailHeader from "@/components/DetailHeader";
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
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="My courses" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        <View className="px-6 pt-6">
          <Text className="text-ink-soft dark:text-night-soft font-semibold text-sm mb-6">
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
            <View className="bg-white dark:bg-night p-8 rounded-3xl border border-line dark:border-night-line border-dashed items-center">
              <Feather name="book" size={32} color="#B5AEA3" />
              <Text className="text-ink-soft font-bold mt-2">
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
