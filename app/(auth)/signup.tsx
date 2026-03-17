import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import Header from '../../components/Header';
import BottomTabs from '../../components/BottomTabs';
import { useColorScheme } from 'nativewind';
import { Link } from 'expo-router';

const Signup = () => {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-slate-900">
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-5 py-8">
        <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
          <Text className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Create Student Account
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center mb-8">
            Sign up with Google or mobile number to get started
          </Text>

          {/* Google Login */}
          <TouchableOpacity className="flex-row items-center justify-center border border-gray-200 dark:border-slate-600 rounded-xl h-14 mb-8">
            <AntDesign name="google" size={24} color={colorScheme === 'dark' ? '#fff' : '#4285F4'} />
            <Text className="text-primary font-bold ml-3 text-lg">Continue with Google</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-700" />
            <Text className="px-4 text-gray-400 font-bold">OR</Text>
            <View className="flex-1 h-[1px] bg-gray-200 dark:bg-slate-700" />
          </View>

          {/* Form */}
          <View className="mb-6">
            <Text className="text-slate-900 dark:text-white font-bold mb-2 text-lg">Full Name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#999"
              className="border border-gray-200 dark:border-slate-600 rounded-xl h-14 px-4 text-slate-900 dark:text-white text-base bg-gray-50 dark:bg-slate-700/50"
            />
          </View>

          <View className="mb-8">
            <Text className="text-slate-900 dark:text-white font-bold mb-2 text-lg">Mobile Number</Text>
            <TextInput
              placeholder="Enter your 10-digit mobile number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              className="border border-gray-200 dark:border-slate-600 rounded-xl h-14 px-4 text-slate-900 dark:text-white text-base bg-gray-50 dark:bg-slate-700/50"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity className="bg-primary rounded-xl h-14 items-center justify-center shadow-lg shadow-primary mb-6">
            <Text className="text-white text-lg font-bold">Send OTP</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center">
            <Text className="text-slate-500 dark:text-slate-400 text-base">Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-base">Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        <View className="h-10" />
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default Signup;
