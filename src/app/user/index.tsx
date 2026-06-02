import BottomTabs from "@/components/BottomTabs";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import Feather from "@react-native-vector-icons/feather";
import Ionicons from "@react-native-vector-icons/ionicons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EnrolledCourseCard from "./_components/EnrolledCourseCard";
import EnrolledTestCard from "./_components/EnrolledTestCard";
import PurchasedProductCard from "./_components/PurchasedProductCard";
import { useEnrolledCourses } from "./_hooks/useEnrolledCourses";
import { useEnrolledTests } from "./_hooks/useEnrolledTests";

import { usePurchasedProducts } from "./_hooks/usePurchasedProducts";

const version =
  Constants.expoConfig?.version ??
  Application.nativeApplicationVersion ??
  "0.0.0";
const buildNumber =
  (Platform.OS === "android"
    ? Constants.expoConfig?.android?.versionCode
    : Constants.expoConfig?.ios?.buildNumber) ??
  Application.nativeBuildVersion ??
  "—";

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colorScheme } = useColorScheme();

  const {
    courses: enrolledCourses,
    loading: loadingCourses,
    total: totalCourses,
  } = useEnrolledCourses(token);

  const {
    tests: enrolledTests,
    loading: loadingTests,
    total: totalTests,
  } = useEnrolledTests(token);

  const {
    products: purchasedProducts,
    loading: loadingProducts,
    total: totalProducts,
  } = usePurchasedProducts(token, { limit: 5 });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.push("/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

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
        {/* Profile Card */}
        <View className="px-6 py-8">
          <View className="flex-row items-center mb-6">
            <View className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white dark:border-slate-800 shadow-xl items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  className="w-full h-full"
                />
              ) : (
                <Text className="text-4xl font-black text-primary">
                  {user?.displayName?.charAt(0).toUpperCase() || "P"}
                </Text>
              )}
            </View>
            <View className="ml-5 flex-1">
              <Text
                className="text-2xl font-black text-slate-800 dark:text-white mb-1.5"
                numberOfLines={1}
              >
                {user?.displayName || "User Name"}
              </Text>
              <View className="flex-row items-center mb-4">
                <Text
                  className="text-slate-500 dark:text-slate-400 font-bold text-sm"
                  numberOfLines={1}
                >
                  {user?.email || user?.mobileNumber || "user@example.com"}
                </Text>
                {user?.mobileVerified && (
                  <MaterialIcons
                    name="verified"
                    size={18}
                    color="#22C55E"
                    style={{ marginLeft: 6 }}
                  />
                )}
              </View>
              {/* <TouchableOpacity className="bg-orange-50 dark:bg-orange-950/30 px-6 py-2.5 rounded-full self-start border border-orange-100 dark:border-orange-800/30">
                <Text className="text-primary font-black text-sm">
                  Edit Profile
                </Text>
              </TouchableOpacity> */}
            </View>
          </View>

          {/* Stats Cards */}
          <View className="flex-row justify-between mb-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/user/tests")}
              className="flex-1 bg-white dark:bg-slate-800 rounded-2xl py-3 px-2 items-center mr-3 border border-slate-100 dark:border-slate-700/50 shadow-sm shadow-slate-200/50 dark:shadow-none"
            >
              <View className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-1.5">
                <Feather name="file-text" size={14} color="#3B82F6" />
              </View>
              <Text className="text-xl font-black text-slate-800 dark:text-white">
                {totalTests}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                Tests
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/user/courses")}
              className="flex-1 bg-white dark:bg-slate-800 rounded-2xl py-3 px-2 items-center mr-3 border border-slate-100 dark:border-slate-700/50 shadow-sm shadow-slate-200/50 dark:shadow-none"
            >
              <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 items-center justify-center mb-1.5">
                <Feather name="book-open" size={14} color="#FF8A50" />
              </View>
              <Text className="text-xl font-black text-slate-800 dark:text-white">
                {totalCourses}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                Courses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/user/products")}
              className="flex-1 bg-white dark:bg-slate-800 rounded-2xl py-3 px-2 items-center border border-slate-100 dark:border-slate-700/50 shadow-sm shadow-slate-200/50 dark:shadow-none"
            >
              <View className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center mb-1.5">
                <Feather name="shopping-bag" size={14} color="#10B981" />
              </View>
              <Text className="text-xl font-black text-slate-800 dark:text-white">
                {totalProducts}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">
                Notes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-6">
          {/* Ongoing Courses Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-black text-slate-800 dark:text-white">
              Ongoing Courses ({totalCourses})
            </Text>
            {totalCourses > 0 && (
              <TouchableOpacity onPress={() => router.push("/user/courses")}>
                <View className="flex-row items-center">
                  <Text className="text-primary font-black text-sm">
                    View All
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color="#FF8A50"
                    className="ml-1"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {loadingCourses ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#FF8A50" />
            </View>
          ) : enrolledCourses.length > 0 ? (
            enrolledCourses
              .slice(0, 2)
              .map((course) => (
                <EnrolledCourseCard key={course.id} course={course} />
              ))
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 border-dashed items-center mb-8">
              <Feather name="book" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">
                No ongoing courses yet
              </Text>
            </View>
          )}

          {/* Ongoing Tests Header */}
          <View className="flex-row items-center justify-between mb-4 mt-4">
            <Text className="text-xl font-black text-slate-800 dark:text-white">
              Ongoing Tests ({totalTests})
            </Text>
            {totalTests > 0 && (
              <TouchableOpacity onPress={() => router.push("/user/tests")}>
                <View className="flex-row items-center">
                  <Text className="text-primary font-black text-sm">
                    View All
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color="#FF8A50"
                    className="ml-1"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {loadingTests ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#FF8A50" />
            </View>
          ) : enrolledTests.length > 0 ? (
            enrolledTests
              .slice(0, 2)
              .map((test) => <EnrolledTestCard key={test.id} test={test} />)
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 border-dashed items-center mb-8">
              <Feather name="file-text" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">
                No enrolled tests yet
              </Text>
            </View>
          )}

          {/* My Notes Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-black text-slate-800 dark:text-white">
              My Notes ({totalProducts})
            </Text>
            {totalProducts > 0 && (
              <TouchableOpacity onPress={() => router.push("/user/products")}>
                <View className="flex-row items-center">
                  <Text className="text-primary font-black text-sm">
                    View All
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color="#FF8A50"
                    className="ml-1"
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {loadingProducts ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#FF8A50" />
            </View>
          ) : purchasedProducts.length > 0 ? (
            purchasedProducts
              .slice(0, 2)
              .map((product) => (
                <PurchasedProductCard
                  key={product.purchaseId}
                  product={product}
                />
              ))
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-gray-100 dark:border-slate-800 border-dashed items-center mb-8">
              <Feather name="shopping-bag" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">
                No purchased notes yet
              </Text>
            </View>
          )}

          {/* Account Menu List */}
          <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">
            My Account
          </Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm mb-8">
            <TouchableOpacity
              onPress={() => router.push("/user/orders")}
              className="flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800"
            >
              <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                <Feather name="shopping-cart" size={22} color="#3B82F6" />
              </View>
              <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">
                My Orders
              </Text>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/user/wallet")}
              className="flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800"
            >
              <View className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 items-center justify-center mr-4">
                <Ionicons name="wallet-outline" size={22} color="#3B82F6" />
              </View>
              <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">
                Wallet
              </Text>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/user/profile")}
              className="flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800"
            >
              <View className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700/20 items-center justify-center mr-4">
                <Feather name="settings" size={22} color="#6B7280" />
              </View>
              <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">
                Account Settings
              </Text>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/about" as any)}
              className="flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 border-b border-gray-50 dark:border-slate-800"
            >
              <View className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 items-center justify-center mr-4">
                <Feather name="info" size={22} color="#FF8A50" />
              </View>
              <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">
                About the App
              </Text>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                let message = `Hello, I need help. I'm ${user?.displayName || "a user"}.`;
                if (user?.email) message += ` Email: ${user.email}`;
                const supportUrl = process.env.EXPO_PUBLIC_SUPPORT_URL;
                Linking.openURL(
                  `${supportUrl}?text=${encodeURIComponent(message)}`,
                );
              }}
              className="flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50"
            >
              <View className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 items-center justify-center mr-4">
                <Feather name="headphones" size={22} color="#22C55E" />
              </View>
              <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">
                Help & Support
              </Text>
              <Feather name="chevron-right" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleLogout}
            className="p-4 px-10 bg-red-50 dark:bg-red-950/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex-row items-center justify-center self-center"
          >
            <Feather name="log-out" size={18} color="#EF4444" />
            <Text className="text-red-500 font-black text-base ml-2">
              Sign Out
            </Text>
          </TouchableOpacity>

          {/* App Version & Copyright */}
          <View className="items-center pt-8">
            <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs">
              Version {version} (Build {buildNumber})
            </Text>
            <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-2">
              © {new Date().getFullYear()} Testkart. All rights reserved.
            </Text>
            <Text className="text-slate-300 dark:text-slate-600 font-medium text-[11px] mt-1">
              Made with care for learners across India.
            </Text>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
