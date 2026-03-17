import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColorScheme } from "nativewind";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import { EnrolledTest } from "../types";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const EnrolledTestDetails = () => {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { colorScheme } = useColorScheme();

  const [test, setTest] = useState<EnrolledTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!token || !slug) return;
    
    try {
      setLoading(true);
      setError(null);
      // We'll fetch the list and find the specific test since it's enrolled
      const response = await fetch(`${BASE_URL}/_api/student/enrolled-tests?limit=20`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });

      if (!response.ok) throw new Error("Failed to fetch details");

      const data = await response.json();
      const payload = data.json || data;
      const enrolledTests = payload.enrolledTests || payload.tests || [];
      
      const foundTest = enrolledTests.find((t: any) => t.slug === slug);
      
      if (foundTest) {
        setTest(foundTest);
      } else {
        throw new Error("Test package not found among your enrollments");
      }
    } catch (err: any) {
      console.error("Error fetching test details:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, slug]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#FF8A50" />
      </View>
    );
  }

  if (error || !test) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-950 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mt-4 mb-8">
           <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
        <View className="items-center justify-center pt-20">
           <Feather name="alert-circle" size={48} color="#FF6B6B" />
           <Text className="text-xl font-black text-slate-800 dark:text-white mt-4 text-center">
              {error || "Oops! Test not found."}
           </Text>
           <TouchableOpacity 
             onPress={() => router.back()}
             className="mt-6 bg-primary px-8 py-3 rounded-2xl"
           >
              <Text className="text-white font-black">Go Back</Text>
           </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayThumbnail = test.thumbnailUrl || test.thumbnailImageUrl || test.teacherAvatar || "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png";

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white dark:bg-slate-950">
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <Header />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Compact Header Section */}
        <View className="px-6 pt-4 mb-6">
           <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="w-10 h-10 bg-gray-50 dark:bg-slate-900 rounded-full items-center justify-center border border-gray-100 dark:border-slate-800"
              >
                 <Feather name="arrow-left" size={20} color={colorScheme === 'dark' ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
              <View className="bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/30">
                <Text className="text-primary font-black text-[10px] uppercase tracking-wider">{test.examName || "Mock Test"}</Text>
              </View>
           </View>

           <View className="flex-row items-center bg-gray-50/50 dark:bg-slate-900/50 p-4 rounded-[32px] border border-gray-100 dark:border-slate-800">
              <View className="w-20 h-20 rounded-2xl overflow-hidden mr-4 shadow-sm">
                 <Image 
                   source={{ uri: displayThumbnail }} 
                   className="w-full h-full" 
                   resizeMode="cover"
                 />
              </View>
              <View className="flex-1">
                 <Text className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-1" numberOfLines={2}>
                    {test.title}
                 </Text>
                 <Text className="text-slate-400 dark:text-slate-500 font-bold text-xs">
                    {test.totalItems || 0} Total Tests • {test.completedItems || 0} Completed
                 </Text>
              </View>
           </View>
        </View>

        {/* Compact Stats Row */}
        <View className="px-6 mb-8">
           <View className="flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <View className="items-center flex-1">
                 <View className="flex-row items-center mb-0.5">
                    <Ionicons name="list" size={12} color="#94A3B8" className="mr-1" />
                    <Text className="text-slate-800 dark:text-white font-black text-base">{test.totalItems || 0}</Text>
                 </View>
                 <Text className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">Tests</Text>
              </View>
              <View className="w-[1px] h-6 bg-gray-100 dark:bg-slate-800" />
              <View className="items-center flex-1">
                 <View className="flex-row items-center mb-0.5">
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" className="mr-1" />
                    <Text className="text-slate-800 dark:text-white font-black text-base">{test.completedItems || 0}</Text>
                 </View>
                 <Text className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">Done</Text>
              </View>
              <View className="w-[1px] h-6 bg-gray-100 dark:bg-slate-800" />
              <View className="items-center flex-1">
                 <View className="flex-row items-center mb-0.5">
                    <Ionicons name="stats-chart" size={12} color="#FF8A50" className="mr-1" />
                    <Text className="text-slate-800 dark:text-white font-black text-base">{test.averageScore || "N/A"}</Text>
                 </View>
                 <Text className="text-slate-400 font-bold text-[8px] uppercase tracking-widest">Avg Score</Text>
              </View>
           </View>
        </View>

        {/* Test Items List */}
        <View className="px-6">
           <View className="flex-row items-center mb-4 pl-1">
              <Text className="text-lg font-black text-slate-800 dark:text-white">Included Tests</Text>
              <View className="ml-3 flex-1 h-[1px] bg-gray-100 dark:bg-slate-800" />
           </View>

           {test.testItems && test.testItems.length > 0 ? (
             test.testItems.map((item, index) => (
               <View key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-[32px] mb-4 border border-gray-100 dark:border-slate-800 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                     <View className="flex-1 mr-3">
                        <Text className="text-slate-800 dark:text-white font-black text-base mb-1" numberOfLines={1}>
                           {item.title}
                        </Text>
                        <View className="flex-row items-center">
                           <Text className="text-slate-400 font-bold text-[10px] uppercase">{item.totalQuestions} Questions</Text>
                           <View className="mx-2 w-1 h-1 rounded-full bg-slate-300" />
                           <Text className="text-slate-400 font-bold text-[10px] uppercase">{item.durationMinutes} Min</Text>
                        </View>
                     </View>
                     <View className={`px-3 py-1 rounded-xl ${item.isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                        <Text className={`font-black text-[9px] uppercase tracking-wider ${item.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                           {item.isCompleted ? "Completed" : "Ongoing"}
                        </Text>
                     </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-50 dark:border-slate-800/50">
                     <View className="flex-row items-center">
                        <Ionicons name="repeat" size={14} color="#94A3B8" />
                        <Text className="text-slate-500 font-bold text-xs ml-1.5">{item.attemptsCount || 0} Attempts</Text>
                     </View>
                     
                     <TouchableOpacity 
                       onPress={() => router.push(`/tests/attempt?id=${item.id}` as any)}
                       className="bg-primary px-5 py-2.5 rounded-2xl shadow-sm"
                     >
                        <Text className="text-white font-black text-xs">
                           {item.isCompleted ? "Re-attempt" : "Start Test"}
                        </Text>
                     </TouchableOpacity>
                  </View>
               </View>
             ))
           ) : (
             <View className="items-center justify-center py-16 bg-gray-50 dark:bg-slate-900 rounded-[32px] border border-dashed border-gray-200 dark:border-slate-800">
                <Ionicons name="document-text" size={32} color="#cbd5e1" />
                <Text className="text-slate-450 font-bold mt-3 text-center px-10 text-xs">No tests available in this package currently</Text>
             </View>
           )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EnrolledTestDetails;
