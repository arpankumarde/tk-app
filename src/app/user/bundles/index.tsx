import BottomTabs from "@/components/BottomTabs";
import DetailHeader from "@/components/DetailHeader";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EnrolledBundleCard from "../_components/EnrolledBundleCard";
import { useEnrolledBundles } from "../_hooks/useEnrolledBundles";

export default function MyBundlesScreen() {
  const { token, user, loading: authLoading } = useAuth();
  const { colorScheme } = useColorScheme();
  const { bundles, loading, error, refetch } = useEnrolledBundles(token);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user]);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-paper dark:bg-night"
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <DetailHeader title="My bundles" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-ink-soft dark:text-night-soft font-semibold text-sm">
            Every course, test and note included in the bundles you own
          </Text>
        </View>

        <View className="px-6">
          {error && (
            <View className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
              <Text className="text-red-600 dark:text-red-400 text-center font-medium">
                {error}
              </Text>
              <TouchableOpacity onPress={refetch} className="mt-2">
                <Text className="text-primary-deep dark:text-primary text-center font-bold underline">
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color="#FF8A50" size="large" />
            </View>
          ) : bundles.length > 0 ? (
            bundles.map((bundle) => (
              <EnrolledBundleCard key={bundle.id} bundle={bundle} expanded />
            ))
          ) : (
            <View className="bg-white dark:bg-night p-12 rounded-3xl border border-line dark:border-night-line border-dashed items-center">
              <Feather name="package" size={40} color="#B5AEA3" />
              <Text className="text-ink dark:text-white font-bold mt-3 text-base">
                No bundles yet
              </Text>
              <Text className="text-ink-soft text-sm mt-1 text-center">
                Bundles pack courses, tests and notes together at a lower price.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/bundles" as any)}
                className="mt-6 bg-primary-deep px-8 py-3 rounded-2xl"
              >
                <Text className="text-white font-extrabold text-sm">
                  Browse Bundles
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="h-10" />
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
