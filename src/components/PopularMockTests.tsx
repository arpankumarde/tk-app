import { View, Text } from "react-native";

const PopularMockTests = () => {
  return (
    <View className="px-6 pt-10 pb-5 items-center bg-white dark:bg-night">
      <Text className="text-4xl font-extrabold text-ink dark:text-white mb-3 text-center">
        Popular Mock Tests
      </Text>
      <Text className="text-base text-ink-soft dark:text-night-soft leading-6 text-center">
        Join thousands of students preparing with these tests.
      </Text>
    </View>
  );
};

export default PopularMockTests;
