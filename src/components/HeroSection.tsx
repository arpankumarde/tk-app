import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const HeroSection = () => {
  const { colorScheme } = useColorScheme();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/(main)/search?q=${encodeURIComponent(trimmed)}` as any);
  };

  return (
    <View className="px-6 pt-6 pb-4 bg-white dark:bg-slate-900">
      <Text className="text-4xl font-black text-slate-800 dark:text-white leading-[48px] mb-4">
        Find the Best Materials
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-8 leading-6">
        Search for mock tests, courses, and study notes for your exam
        preparation.
      </Text>

      <View>
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-4 h-14 mb-4">
          <Feather name="search" size={20} color="#999" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search for exams, tests, or courses..."
            className="flex-1 text-base text-[#333] dark:text-white ml-2"
            placeholderTextColor="#999"
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          onPress={handleSearch}
          className="bg-primary rounded-full h-14 items-center justify-center shadow-lg shadow-primary"
        >
          <Text className="text-white text-lg font-bold">Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HeroSection;
