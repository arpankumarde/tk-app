import Feather from "@react-native-vector-icons/feather";
import { themeColors } from "@/constants/theme";
import { router } from "expo-router";
import { useColorScheme } from "nativewind";
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
  const { colorScheme } = useColorScheme();
  const accent = themeColors(colorScheme).accentText;

  if (!data || data.length === 0) return null;

  return (
    <View className="pb-9">
      <View className="flex-row items-end justify-between px-5 mb-3">
        <Text className="text-[22px] font-extrabold text-ink dark:text-white">
          {title}
        </Text>
        {viewAllHref && (
          <TouchableOpacity
            onPress={() => router.push(viewAllHref as any)}
            className="flex-row items-center pb-1"
          >
            <Text className="text-primary-deep dark:text-primary font-bold text-sm mr-0.5">
              View all
            </Text>
            <Feather name="chevron-right" size={16} color={accent} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item, index }) => renderItem(item, index)}
      />
    </View>
  );
}

export default HomeRail;
