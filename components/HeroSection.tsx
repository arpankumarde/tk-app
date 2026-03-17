import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

const HeroSection = () => {
  const { colorScheme } = useColorScheme();

  return (
    <View className="px-5 py-10 items-center bg-white dark:bg-slate-900">
      <Text className="text-3xl font-extrabold text-[#333] dark:text-gray-100 text-center mb-4 leading-tight">
        Find the Best Learning Materials
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8 leading-6 px-2">
        Search for mock tests, courses, and study notes for your exam
        preparation.
      </Text>

      <View className="w-full">
        <View className="flex-row items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full px-4 h-14 mb-4">
          <Feather
            name="search"
            size={20}
            color={colorScheme === "dark" ? "#999" : "#999"}
            className="mr-2"
          />
          <TextInput
            placeholder="Search for exams, tests, or courses..."
            className="flex-1 text-base text-[#333] dark:text-white"
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity className="bg-primary rounded-full h-14 items-center justify-center shadow-lg shadow-primary">
          <Text className="text-white text-lg font-bold">Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HeroSection;
