import React from 'react';
import { View, Text } from 'react-native';

const PopularMockTests = () => {
  return (
    <View className="px-6 pt-10 pb-5 items-center bg-white dark:bg-slate-900">
      <Text className="text-4xl font-black text-slate-800 dark:text-white mb-3 text-center">
        Popular Mock Tests
      </Text>
      <Text className="text-base text-slate-500 dark:text-slate-400 leading-6 text-center">
        Join thousands of students preparing with these tests.
      </Text>
    </View>
  );
};

export default PopularMockTests;
