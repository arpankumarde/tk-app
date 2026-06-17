import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface HomeRailProps<T> {
  title: string;
  viewAllHref?: string;
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactElement;
}

function HomeRail<T>({
  title,
  viewAllHref,
  data,
  keyExtractor,
  renderItem,
}: HomeRailProps<T>) {
  if (!data || data.length === 0) return null;

  return (
    <View className="bg-white dark:bg-slate-900 pb-10">
      <View className="flex-row items-end justify-between px-6 mb-4">
        <Text className="text-2xl font-black text-slate-800 dark:text-white">
          {title}
        </Text>
        {viewAllHref && (
          <TouchableOpacity
            onPress={() => router.push(viewAllHref as any)}
            className="flex-row items-center pb-1"
          >
            <Text className="text-primary font-bold text-sm mr-1">
              View all
            </Text>
            <Feather name="chevron-right" size={16} color="#FF8A50" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
        renderItem={({ item, index }) => renderItem(item, index)}
      />
    </View>
  );
}

export default HomeRail;
