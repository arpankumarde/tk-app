import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, StatusBar, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import HeroSection from '../../components/HeroSection';
import PopularMockTests from '../../components/PopularMockTests';
import MockTestCard from '../../components/MockTestCard';
import DigitalDownloadsSection from '../../components/DigitalDownloadsSection';
import BottomTabs from '../../components/BottomTabs';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const App = () => {
  const { colorScheme } = useColorScheme();
  const [tests, setTests] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/_api/homepage/data`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      const payload = data.json || data;
      setTests(payload.tests || []);
      setShopProducts(payload.shopProducts || []);
    } catch (err: any) {
      console.error("Home fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-white dark:bg-slate-900">
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#0f172a' : '#ffffff'}
      />
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white dark:bg-slate-900">
        <HeroSection />
        <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />
        
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#FF8A50" />
            <Text className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Loading premium content...</Text>
          </View>
        ) : error ? (
          <View className="px-6 py-10 items-center">
            <Text className="text-red-500 mb-4 text-center">{error}</Text>
            <TouchableOpacity onPress={fetchHomeData} className="bg-primary px-8 py-3 rounded-xl">
              <Text className="text-white font-bold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <PopularMockTests />
            <View className="pb-4">
              {tests.length > 0 ? (
                tests.map((test, index) => (
                  <MockTestCard
                    key={test.id || index}
                    test={test}
                  />
                ))
              ) : (
                <View className="py-10 items-center">
                  <Text className="text-slate-500">No mock tests available.</Text>
                </View>
              )}
              
              <TouchableOpacity 
                className="mx-5 mb-5 bg-orange-100/50 dark:bg-orange-900/20 py-5 rounded-3xl items-center border border-orange-200 dark:border-orange-800/30"
                onPress={() => router.push('/courses')}
              >
                <View className="flex-row items-center">
                  <Text className="text-primary font-black text-xl mr-2">Explore All Tests</Text>
                  <Feather name="arrow-right" size={24} color="#FF8A50" />
                </View>
              </TouchableOpacity>
            </View>

            <View className="h-[1px] bg-gray-100 dark:bg-slate-800" />
            <DigitalDownloadsSection products={shopProducts} />
          </>
        )}
        <View className="h-10" />
      </ScrollView>
      <BottomTabs />
    </SafeAreaView>
  );
};

export default App;
