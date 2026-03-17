import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import Header from "@/components/Header";
import BottomTabs from "@/components/BottomTabs";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colorScheme } = useColorScheme();

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
    } catch {
      Alert.alert("Error", "Failed to log out.");
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-slate-50 dark:bg-slate-950">
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <Header />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="px-6 pt-8 pb-10 bg-white dark:bg-slate-900 rounded-b-[40px] shadow-sm mb-6">
          <View className="flex-row items-center mb-6">
             {user?.avatarUrl ? (
                <View className="w-24 h-24 rounded-full border-4 border-orange-50 dark:border-slate-800 shadow-xl overflow-hidden">
                   <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
                </View>
             ) : (
                <View className="w-24 h-24 rounded-full bg-orange-100 dark:bg-slate-800 border-4 border-orange-50 dark:border-slate-800 shadow-xl items-center justify-center">
                   <Feather name="user" size={40} color="#FF8A50" />
                </View>
             )}
             <View className="ml-5 flex-1">
                <Text className="text-2xl font-black text-slate-800 dark:text-white" numberOfLines={1}>
                   {user.displayName}
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</Text>
                <TouchableOpacity className="mt-3 bg-orange-50 dark:bg-orange-950/30 px-4 py-2 rounded-full self-start border border-orange-100 dark:border-orange-900/30">
                   <Text className="text-primary font-bold text-sm">Edit Profile</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* Compact Stats Info */}
          <View className="flex-row justify-between bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-gray-50 dark:border-slate-800">
             <View className="items-center flex-1">
                <Text className="text-2xl font-black text-slate-800 dark:text-white">12</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Tests</Text>
             </View>
             <View className="w-[1px] h-10 bg-gray-200 dark:bg-slate-700" />
             <View className="items-center flex-1">
                <Text className="text-2xl font-black text-slate-800 dark:text-white">4</Text>
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
          {/* Resume Learning / Recent Activity */}
          <Text className="text-xl font-black text-slate-800 dark:text-white mb-4">Resume Learning</Text>
          <TouchableOpacity 
             onPress={() => router.push("/tests")}
             className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex-row items-center mb-8"
          >
             <View className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 items-center justify-center mr-4">
                <Feather name="play-circle" size={32} color="#FF8A50" />
             </View>
             <View className="flex-1">
                <Text className="text-slate-800 dark:text-white font-bold text-lg mb-1" numberOfLines={1}>Motion - Physics MCQ</Text>
                <View className="flex-row items-center">
                   <View className="flex-1 h-2 bg-gray-100 dark:bg-slate-800 rounded-full mr-3 overflow-hidden">
                      <View className="h-full bg-primary w-[45%]" />
                   </View>
                   <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs">45%</Text>
                </View>
             </View>
             <Feather name="chevron-right" size={24} color="#CBD5E1" className="ml-2" />
          </TouchableOpacity>

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
