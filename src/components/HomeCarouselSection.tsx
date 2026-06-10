import Feather from "@react-native-vector-icons/feather";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import AutoSlider from "./AutoSlider";

interface HomeCarouselSectionProps<T> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => React.ReactElement;
  exploreLabel?: string;
  exploreHref?: string;
}

function HomeCarouselSection<T>({
  data,
  keyExtractor,
  renderItem,
  exploreLabel,
  exploreHref,
}: HomeCarouselSectionProps<T>) {
  if (!data || data.length === 0) return null;

  return (
    <View className="bg-white dark:bg-slate-900">
      <AutoSlider
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />

      {exploreLabel && exploreHref && (
        <TouchableOpacity
          className="mx-12 mb-10 bg-orange-100/50 dark:bg-orange-900/20 py-3 rounded-2xl items-center border border-orange-200 dark:border-orange-800/30 shadow-sm"
          onPress={() => router.push(exploreHref as any)}
        >
          <View className="flex-row items-center">
            <Text className="text-primary font-black text-lg mr-2">
              {exploreLabel}
            </Text>
            <Feather name="arrow-right" size={20} color="#FF8A50" />
          </View>
        </TouchableOpacity>
      )}
      {!(exploreLabel && exploreHref) && <View className="pb-10" />}
    </View>
  );
}

export default HomeCarouselSection;
