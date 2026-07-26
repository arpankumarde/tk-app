import BottomTabs from "@/components/BottomTabs";
import Header from "@/components/Header";
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
      >
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-black text-slate-800 dark:text-white mb-1">
            My Bundles
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm">
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
                <Text className="text-primary text-center font-bold underline">
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
            <View className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center">
              <Feather name="package" size={40} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-3 text-base">
                No bundles yet
              </Text>
              <Text className="text-slate-400 text-sm mt-1 text-center">
                Bundles pack courses, tests and notes together at a lower price.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/bundles" as any)}
                className="mt-6 bg-primary px-8 py-3 rounded-2xl"
              >
                <Text className="text-white font-black text-sm">
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
