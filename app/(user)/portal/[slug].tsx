import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const Portal = () => {
  const { slug } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white dark:bg-slate-900 pt-10">
      <Text className="text-2xl font-bold text-center text-gray-800 dark:text-white mt-4">
        Portal: {slug}
      </Text>
    </View>
  );
};

export default Portal;
