import React from "react";
import { View, Text, Image, TouchableOpacity, Modal, Pressable, FlatList } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { EnrolledTest } from "../types";

interface EnrolledTestCardProps {
  test: EnrolledTest;
}

const EnrolledTestCard = ({ test }: EnrolledTestCardProps) => {
  const displayThumbnail = test.thumbnailUrl || test.thumbnailImageUrl || test.teacherAvatar || "https://ik.imagekit.io/testkart/placeholders/mock-test-placeholder__FmYrad7s.png";
  const displayExamName = test.examName || test.category || "Mock Test";
  
  const formattedDate = test.enrolledAt ? new Date(test.enrolledAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : "";

  const handlePress = () => {
    if (test.pdfUrl) {
      router.push(`/product/${test.slug}` as any);
    } else {
      router.push(`/(user)/enrolled-test/${test.slug}` as any);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm mb-5"
    >
      <View className="flex-row items-center mb-4">
        {/* Small Thumbnail */}
        <View className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/30 mr-4 overflow-hidden relative items-center justify-center">
          <Image 
            source={{ uri: displayThumbnail }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          <View className="absolute inset-0 items-center justify-center bg-black/5">
            <Ionicons name={test.pdfUrl ? "document" : "document-text"} size={14} color="white" />
          </View>
        </View>

        {/* Title and Date */}
        <View className="flex-1">
          <View className="bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-md self-start mb-1">
            <Text className="text-primary font-black text-[10px]">{displayExamName}</Text>
          </View>
          <Text className="text-slate-800 dark:text-white font-black text-base" numberOfLines={1}>
            {test.title}
          </Text>
          {formattedDate && (
            <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px] mt-0.5">
              Enrolled on {formattedDate}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={20} color="#CBD5E1" />
      </View>

      {/* Progress Section */}
      <View className="pt-3 border-t border-gray-50 dark:border-slate-800">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-slate-800 dark:text-white font-black text-[11px]">Overall Progress</Text>
          <Text className="text-slate-400 dark:text-slate-500 font-bold text-[10px]">
             {test.completedItems || 0} of {test.totalItems || 0} tests completed
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
           <View 
             className="h-full bg-primary" 
             style={{ width: `${Math.min(test.progressPercentage || 0, 100)}%` }} 
           />
        </View>

        {/* Stats Grid */}
        <View className="flex-row justify-between">
           <View className="items-center flex-1">
              <Text className="text-slate-800 dark:text-white font-black text-sm">{test.totalItems || 0}</Text>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Total Tests</Text>
           </View>
           <View className="w-[1px] h-6 bg-gray-100 dark:bg-slate-800" />
           <View className="items-center flex-1">
              <Text className="text-slate-800 dark:text-white font-black text-sm">{test.completedItems || 0}</Text>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Completed</Text>
           </View>
           <View className="w-[1px] h-6 bg-gray-100 dark:bg-slate-800" />
           <View className="items-center flex-1">
              <Text className="text-slate-800 dark:text-white font-black text-sm">{test.averageScore || "N/A"}</Text>
              <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Avg Score</Text>
           </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EnrolledTestCard;
