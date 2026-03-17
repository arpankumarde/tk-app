import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";

import { useEnrolledCourses } from "./hooks/useEnrolledCourses";
import { useEnrolledTests } from "./hooks/useEnrolledTests";
import EnrolledCourseCard from "./_components/EnrolledCourseCard";
import EnrolledTestCard from "./_components/EnrolledTestCard";

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colorScheme } = useColorScheme();

  const {
    courses: enrolledCourses,
    loading: loadingCourses,
    total: totalCourses
  } = useEnrolledCourses(token);

  const {
    tests: enrolledTests,
    loading: loadingTests,
    total: totalTests
  } = useEnrolledTests(token);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  const menuItems = [
    { title: "My Courses", icon: "book-open", route: "/courses", color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { title: "My Mock Tests", icon: "layers", route: "/tests", color: "text-orange-500", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
    { title: "Live Sessions", icon: "radio", route: "/live", color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-900/20" },
    { title: "Downloads & Shop", icon: "shopping-bag", route: "/shop", color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
    { title: "Account Settings", icon: "settings", route: "/", color: "text-gray-500", bgColor: "bg-gray-50 dark:bg-gray-700/20" },
    { title: "Help & Support", icon: "headphones", route: "/", color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-900/20" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <Header />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <View className="px-6 py-8">
          <View className="flex-row items-center mb-10">
            <View className="w-24 h-24 rounded-full bg-primary/10 border-4 border-white dark:border-slate-800 shadow-xl items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} className="w-full h-full" />
              ) : (
                <Text className="text-4xl font-black text-primary">
                  {user?.displayName?.charAt(0).toUpperCase() || "P"}
                </Text>
              )}
            </View>
            <View className="ml-5 flex-1">
              <Text className="text-2xl font-black text-slate-800 dark:text-white mb-1.5" numberOfLines={1}>
                {user?.displayName || "User Name"}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-4" numberOfLines={1}>
                {user?.email || "user@example.com"}
              </Text>
              <TouchableOpacity className="bg-orange-50 dark:bg-orange-950/30 px-6 py-2.5 rounded-full self-start border border-orange-100 dark:border-orange-800/30">
                <Text className="text-primary font-black text-sm">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Bar */}
          <View className="bg-white dark:bg-slate-900 rounded-[32px] p-6 flex-row items-center shadow-2xl shadow-slate-200 dark:shadow-none border border-gray-50 dark:border-slate-800">
            <View className="items-center flex-1">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">{totalTests}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Tests</Text>
            </View>
            <View className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">{totalCourses}</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Courses</Text>
            </View>
            <View className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-black text-slate-800 dark:text-white">85%</Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Score</Text>
            </View>
          </View>
        </View>

        <View className="px-6">
          {/* Ongoing Courses Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-black text-slate-800 dark:text-white">
              Ongoing Courses ({totalCourses})
            </Text>
            <TouchableOpacity onPress={() => router.push("/(main)/courses" as any)}>
              <View className="flex-row items-center">
                <Text className="text-primary font-black text-sm">View All</Text>
                <Feather name="chevron-right" size={16} color="#FF8A50" className="ml-1" />
              </View>
            </TouchableOpacity>
          </View>

          {loadingCourses ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#FF8A50" />
            </View>
          ) : enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center mb-8">
              <Feather name="book" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">No ongoing courses yet</Text>
            </View>
          )}

          {/* Ongoing Tests Header */}
          <View className="flex-row items-center justify-between mb-4 mt-4">
            <Text className="text-xl font-black text-slate-800 dark:text-white">
              Ongoing Tests ({totalTests})
            </Text>
            <TouchableOpacity onPress={() => router.push("/(main)/live" as any)}>
              <View className="flex-row items-center">
                <Text className="text-primary font-black text-sm">View All</Text>
                <Feather name="chevron-right" size={16} color="#FF8A50" className="ml-1" />
              </View>
            </TouchableOpacity>
          </View>

          {loadingTests ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#FF8A50" />
            </View>
          ) : enrolledTests.length > 0 ? (
            enrolledTests.map((test) => (
              <EnrolledTestCard key={test.id} test={test} />
            ))
          ) : (
            <View className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 border-dashed items-center mb-8">
              <Feather name="file-text" size={32} color="#CBD5E1" />
              <Text className="text-slate-400 font-bold mt-2">No enrolled tests yet</Text>
            </View>
          )}

          {/* Account Menu List */}
          <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">My Account</Text>
          <View className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm mb-8">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => item.route !== "/" && router.push(item.route as any)}
                className={`flex-row items-center p-5 active:bg-slate-50 dark:active:bg-slate-800/50 ${index !== menuItems.length - 1 ? 'border-b border-gray-50 dark:border-slate-800' : ''}`}
              >
                <View className={`w-12 h-12 rounded-2xl ${item.bgColor} items-center justify-center mr-4`}>
                  <Feather name={item.icon as any} size={22} className={item.color} />
                </View>
                <Text className="flex-1 text-slate-700 dark:text-slate-200 font-bold text-lg">{item.title}</Text>
                <Feather name="chevron-right" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Section */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mb-12 p-6 bg-red-50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-900/20 flex-row items-center justify-center space-x-3"
          >
            <Feather name="log-out" size={22} color="#EF4444" />
            <Text className="text-red-500 font-black text-lg ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>

      <BottomTabs />
    </SafeAreaView>
  );
}
