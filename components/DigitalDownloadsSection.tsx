import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import DigitalDownloadCard from './DigitalDownloadCard';

interface DigitalDownloadsSectionProps {
  products: any[];
}

const DigitalDownloadsSection = ({ products }: DigitalDownloadsSectionProps) => {
  if (!products || products.length === 0) return null;

  return (
    <View className="bg-white dark:bg-slate-900">
      <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">
          Digital Downloads
        </Text>
        <TouchableOpacity 
          className="flex-row items-center"
          onPress={() => router.push('/shop')}
        >
          <Text className="text-orange-500 font-black text-lg mr-1.5">View All</Text>
          <Feather name="arrow-right" size={20} color="#FF8A50" />
        </TouchableOpacity>
      </View>

      <View className="pb-8">
        {products.map((product, index) => (
          <DigitalDownloadCard key={product.id || index} product={product} />
        ))}
      </View>
    </View>
  );
};

export default DigitalDownloadsSection;
